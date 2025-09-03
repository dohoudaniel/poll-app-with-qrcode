/**
 * Poll repository for database operations
 */

import { BaseRepository } from './base-repository';
import { measurePerformance } from '../utils/logger';
import { Logger } from '../utils/logger';
import type { PollWithOptions, Poll, PollOption, Vote } from '../../types/database';

export interface CreatePollData {
  title: string;
  description?: string;
  created_by: string;
  expires_at?: string;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  is_active: boolean;
}

export interface CreatePollOptionData {
  poll_id: string;
  text: string;
  order_index: number;
}

export interface PollFilters {
  createdBy?: string;
  isActive?: boolean;
  isExpired?: boolean;
  search?: string;
}

/**
 * Poll repository class
 */
export class PollRepository extends BaseRepository<Poll> {
  protected tableName = 'polls';
  protected defaultSelect = `
    *,
    poll_options (
      id,
      text,
      order_index,
      votes_count
    )
  `;
  
  /**
   * Create poll with options
   */
  @measurePerformance('pollRepository.createWithOptions')
  async createWithOptions(
    pollData: CreatePollData,
    optionsData: CreatePollOptionData[]
  ): Promise<PollWithOptions> {
    try {
      // Start transaction-like operation
      // Create poll first
      const poll = await this.create(pollData);
      
      // Create options
      const optionsWithPollId = optionsData.map(option => ({
        ...option,
        poll_id: poll.id,
      }));
      
      const options = await this.createOptions(optionsWithPollId);
      
      Logger.info('Poll created with options', {
        pollId: poll.id,
        optionsCount: options.length,
        createdBy: pollData.created_by,
      });
      
      return {
        ...poll,
        poll_options: options,
      } as PollWithOptions;
    } catch (error) {
      Logger.error('Failed to create poll with options', error as Error, {
        pollData: { ...pollData, created_by: '[REDACTED]' },
        optionsCount: optionsData.length,
      });
      throw error;
    }
  }
  
  /**
   * Find poll with options by ID
   */
  @measurePerformance('pollRepository.findWithOptions')
  async findWithOptions(id: string): Promise<PollWithOptions | null> {
    const query = this.table
      .select(this.defaultSelect)
      .eq('id', id);
    
    try {
      const result = await this.executeQuery<PollWithOptions>(query, 'findWithOptions', true);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('PGRST116')) {
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Find polls by user with options
   */
  @measurePerformance('pollRepository.findByUserWithOptions')
  async findByUserWithOptions(
    userId: string,
    filters: PollFilters = {},
    pagination?: { page: number; limit: number }
  ): Promise<PollWithOptions[]> {
    let query = this.table.select(this.defaultSelect);
    
    // Apply user filter
    query = query.eq('created_by', userId);
    
    // Apply additional filters
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    if (filters.isExpired !== undefined) {
      const now = new Date().toISOString();
      if (filters.isExpired) {
        query = query.lt('expires_at', now);
      } else {
        query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
      }
    }
    
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    
    // Apply ordering
    query = query.order('created_at', { ascending: false });
    
    // Apply pagination
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }
    
    return this.executeQuery<PollWithOptions[]>(query, 'findByUserWithOptions');
  }
  
  /**
   * Find active polls with options
   */
  @measurePerformance('pollRepository.findActiveWithOptions')
  async findActiveWithOptions(
    filters: Omit<PollFilters, 'isActive'> = {},
    pagination?: { page: number; limit: number }
  ): Promise<PollWithOptions[]> {
    let query = this.table.select(this.defaultSelect);
    
    // Only active polls
    query = query.eq('is_active', true);
    
    // Only non-expired polls
    const now = new Date().toISOString();
    query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
    
    // Apply additional filters
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    
    // Apply ordering
    query = query.order('created_at', { ascending: false });
    
    // Apply pagination
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }
    
    return this.executeQuery<PollWithOptions[]>(query, 'findActiveWithOptions');
  }
  
  /**
   * Update poll status
   */
  @measurePerformance('pollRepository.updateStatus')
  async updateStatus(id: string, isActive: boolean): Promise<Poll> {
    const query = this.table
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*');
    
    return this.executeQuery<Poll>(query, 'updateStatus', true);
  }
  
  /**
   * Check if user owns poll
   */
  async isOwner(pollId: string, userId: string): Promise<boolean> {
    const poll = await this.findById(pollId, 'created_by');
    return poll?.created_by === userId;
  }
  
  /**
   * Get poll statistics
   */
  @measurePerformance('pollRepository.getStatistics')
  async getStatistics(pollId: string): Promise<{
    totalVotes: number;
    uniqueVoters: number;
    optionStats: Array<{
      optionId: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
  }> {
    // Get poll with options
    const poll = await this.findWithOptions(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }
    
    // Get vote statistics
    const { data: voteStats } = await this.table.supabase
      .from('votes')
      .select(`
        option_id,
        poll_options!inner(text)
      `)
      .eq('poll_id', pollId);
    
    const { data: uniqueVotersData } = await this.table.supabase
      .from('votes')
      .select('user_id', { count: 'exact' })
      .eq('poll_id', pollId);
    
    const totalVotes = voteStats?.length || 0;
    const uniqueVoters = uniqueVotersData?.length || 0;
    
    // Calculate option statistics
    const optionVoteCounts = voteStats?.reduce((acc, vote) => {
      acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const optionStats = poll.poll_options.map(option => ({
      optionId: option.id,
      text: option.text,
      votes: optionVoteCounts[option.id] || 0,
      percentage: totalVotes > 0 ? ((optionVoteCounts[option.id] || 0) / totalVotes) * 100 : 0,
    }));
    
    return {
      totalVotes,
      uniqueVoters,
      optionStats,
    };
  }
  
  /**
   * Create poll options
   */
  private async createOptions(optionsData: CreatePollOptionData[]): Promise<PollOption[]> {
    const { data, error } = await this.table.supabase
      .from('poll_options')
      .insert(optionsData)
      .select('*');
    
    if (error) {
      this.handleError(error, 'createOptions');
    }
    
    return data as PollOption[];
  }
}

/**
 * Vote repository class
 */
export class VoteRepository extends BaseRepository<Vote> {
  protected tableName = 'votes';
  
  /**
   * Submit votes for a poll
   */
  @measurePerformance('voteRepository.submitVotes')
  async submitVotes(
    pollId: string,
    userId: string,
    optionIds: string[]
  ): Promise<Vote[]> {
    try {
      // Delete existing votes for this user and poll
      await this.deleteBy('poll_id', pollId);
      await this.deleteBy('user_id', userId);
      
      // Create new votes
      const votesData = optionIds.map(optionId => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
        created_at: new Date().toISOString(),
      }));
      
      const votes = await this.createMany(votesData);
      
      Logger.info('Votes submitted', {
        pollId,
        userId,
        optionCount: optionIds.length,
      });
      
      return votes;
    } catch (error) {
      Logger.error('Failed to submit votes', error as Error, {
        pollId,
        userId,
        optionIds,
      });
      throw error;
    }
  }
  
  /**
   * Get user's votes for a poll
   */
  async getUserVotes(pollId: string, userId: string): Promise<Vote[]> {
    return this.findBy('poll_id', pollId).then(votes =>
      votes.filter(vote => vote.user_id === userId)
    );
  }
  
  /**
   * Check if user has voted on poll
   */
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const votes = await this.getUserVotes(pollId, userId);
    return votes.length > 0;
  }
  
  /**
   * Get vote count for poll
   */
  async getVoteCount(pollId: string): Promise<number> {
    return this.count('poll_id', pollId);
  }
  
  /**
   * Get unique voter count for poll
   */
  async getUniqueVoterCount(pollId: string): Promise<number> {
    const { data } = await this.table.supabase
      .from(this.tableName)
      .select('user_id')
      .eq('poll_id', pollId);
    
    const uniqueVoters = new Set(data?.map(vote => vote.user_id) || []);
    return uniqueVoters.size;
  }
}

// Export singleton instances
export const pollRepository = new PollRepository();
export const voteRepository = new VoteRepository();
