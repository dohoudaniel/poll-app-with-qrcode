/**
 * Poll service layer with business logic
 */

import { pollRepository, voteRepository } from '../repositories/poll-repository';
import { PollValidators, validateAndThrowPoll, validateAndThrowEditPoll, validateAndThrowVote } from '../validators/poll-validators';
import { Logger } from '../utils/logger';
import { measurePerformance } from '../utils/logger';
import {
  PollNotFoundError,
  UnauthorizedError,
  PollExpiredError,
  PollInactiveError,
  DuplicateVoteError,
  MultipleVotesNotAllowedError,
  BusinessLogicError,
} from '../errors/custom-errors';
import type { CreatePollFormData, EditPollFormData } from '../../types';
import type { PollWithOptions, Poll } from '../../types/database';

export interface PollServiceResult<T = any> {
  success: true;
  data: T;
}

export interface PollServiceError {
  success: false;
  error: string;
  code?: string;
}

export type PollServiceResponse<T = any> = PollServiceResult<T> | PollServiceError;

/**
 * Poll service class
 */
export class PollService {
  /**
   * Create a new poll
   */
  @measurePerformance('pollService.createPoll')
  static async createPoll(
    formData: CreatePollFormData,
    userId: string
  ): Promise<PollWithOptions> {
    // Validate input data
    validateAndThrowPoll(formData);
    
    // Prepare poll data
    const pollData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      created_by: userId,
      expires_at: formData.expiresAt ? formData.expiresAt.toISOString() : null,
      allow_multiple_votes: formData.allowMultipleVotes || false,
      is_anonymous: formData.isAnonymous || false,
      is_active: true,
    };
    
    // Prepare options data
    const optionsData = formData.options.map((option, index) => ({
      poll_id: '', // Will be set by repository
      text: option.trim(),
      order_index: index,
    }));
    
    try {
      const poll = await pollRepository.createWithOptions(pollData, optionsData);
      
      Logger.info('Poll created successfully', {
        pollId: poll.id,
        userId,
        title: poll.title,
        optionsCount: poll.poll_options.length,
      });
      
      return poll;
    } catch (error) {
      Logger.error('Failed to create poll', error as Error, {
        userId,
        title: formData.title,
      });
      throw error;
    }
  }
  
  /**
   * Get poll by ID
   */
  @measurePerformance('pollService.getPoll')
  static async getPoll(pollId: string): Promise<PollWithOptions> {
    const poll = await pollRepository.findWithOptions(pollId);
    
    if (!poll) {
      throw new PollNotFoundError(pollId);
    }
    
    return poll;
  }
  
  /**
   * Update poll
   */
  @measurePerformance('pollService.updatePoll')
  static async updatePoll(
    pollId: string,
    formData: Partial<EditPollFormData>,
    userId: string
  ): Promise<Poll> {
    // Check if poll exists and user owns it
    const existingPoll = await pollRepository.findById(pollId);
    if (!existingPoll) {
      throw new PollNotFoundError(pollId);
    }
    
    if (existingPoll.created_by !== userId) {
      throw new UnauthorizedError('edit this poll');
    }
    
    // Validate input data
    validateAndThrowEditPoll(formData);
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (formData.title !== undefined) {
      updateData.title = formData.title.trim();
    }
    
    if (formData.description !== undefined) {
      updateData.description = formData.description?.trim() || null;
    }
    
    if (formData.expiresAt !== undefined) {
      updateData.expires_at = formData.expiresAt ? formData.expiresAt.toISOString() : null;
    }
    
    if (formData.allowMultipleVotes !== undefined) {
      updateData.allow_multiple_votes = formData.allowMultipleVotes;
    }
    
    if (formData.isAnonymous !== undefined) {
      updateData.is_anonymous = formData.isAnonymous;
    }
    
    if (formData.isActive !== undefined) {
      updateData.is_active = formData.isActive;
    }
    
    try {
      const updatedPoll = await pollRepository.update(pollId, updateData);
      
      Logger.info('Poll updated successfully', {
        pollId,
        userId,
        updatedFields: Object.keys(updateData),
      });
      
      return updatedPoll;
    } catch (error) {
      Logger.error('Failed to update poll', error as Error, {
        pollId,
        userId,
      });
      throw error;
    }
  }
  
  /**
   * Delete poll
   */
  @measurePerformance('pollService.deletePoll')
  static async deletePoll(pollId: string, userId: string): Promise<void> {
    // Check if poll exists and user owns it
    const existingPoll = await pollRepository.findById(pollId);
    if (!existingPoll) {
      throw new PollNotFoundError(pollId);
    }
    
    if (existingPoll.created_by !== userId) {
      throw new UnauthorizedError('delete this poll');
    }
    
    try {
      await pollRepository.delete(pollId);
      
      Logger.info('Poll deleted successfully', {
        pollId,
        userId,
        title: existingPoll.title,
      });
    } catch (error) {
      Logger.error('Failed to delete poll', error as Error, {
        pollId,
        userId,
      });
      throw error;
    }
  }
  
  /**
   * Toggle poll status
   */
  @measurePerformance('pollService.togglePollStatus')
  static async togglePollStatus(
    pollId: string,
    userId: string
  ): Promise<{ poll: Poll; isActive: boolean }> {
    // Check if poll exists and user owns it
    const existingPoll = await pollRepository.findById(pollId);
    if (!existingPoll) {
      throw new PollNotFoundError(pollId);
    }
    
    if (existingPoll.created_by !== userId) {
      throw new UnauthorizedError('modify this poll');
    }
    
    const newStatus = !existingPoll.is_active;
    
    try {
      const updatedPoll = await pollRepository.updateStatus(pollId, newStatus);
      
      Logger.info('Poll status toggled', {
        pollId,
        userId,
        oldStatus: existingPoll.is_active,
        newStatus,
      });
      
      return {
        poll: updatedPoll,
        isActive: newStatus,
      };
    } catch (error) {
      Logger.error('Failed to toggle poll status', error as Error, {
        pollId,
        userId,
      });
      throw error;
    }
  }
  
  /**
   * Submit vote
   */
  @measurePerformance('pollService.submitVote')
  static async submitVote(
    pollId: string,
    optionIds: string[],
    userId: string
  ): Promise<void> {
    // Get poll details
    const poll = await this.getPoll(pollId);
    
    // Validate poll state
    if (!poll.is_active) {
      throw new PollInactiveError(pollId);
    }
    
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new PollExpiredError(pollId, new Date(poll.expires_at));
    }
    
    // Validate vote data
    validateAndThrowVote(optionIds, poll.allow_multiple_votes);
    
    // Check if user has already voted (if multiple votes not allowed)
    if (!poll.allow_multiple_votes) {
      const hasVoted = await voteRepository.hasUserVoted(pollId, userId);
      if (hasVoted) {
        // For single-vote polls, we'll replace the existing vote
        Logger.info('Replacing existing vote', { pollId, userId });
      }
    }
    
    // Validate that all option IDs belong to this poll
    const validOptionIds = poll.poll_options.map(option => option.id);
    const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
    
    if (invalidOptions.length > 0) {
      throw new BusinessLogicError(
        `Invalid option IDs: ${invalidOptions.join(', ')}`
      );
    }
    
    try {
      await voteRepository.submitVotes(pollId, userId, optionIds);
      
      Logger.info('Vote submitted successfully', {
        pollId,
        userId,
        optionIds,
        optionCount: optionIds.length,
      });
    } catch (error) {
      Logger.error('Failed to submit vote', error as Error, {
        pollId,
        userId,
        optionIds,
      });
      throw error;
    }
  }
  
  /**
   * Get user's polls
   */
  @measurePerformance('pollService.getUserPolls')
  static async getUserPolls(
    userId: string,
    filters: {
      isActive?: boolean;
      search?: string;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<PollWithOptions[]> {
    try {
      const polls = await pollRepository.findByUserWithOptions(
        userId,
        filters,
        pagination
      );
      
      Logger.debug('Retrieved user polls', {
        userId,
        count: polls.length,
        filters,
        pagination,
      });
      
      return polls;
    } catch (error) {
      Logger.error('Failed to get user polls', error as Error, {
        userId,
        filters,
      });
      throw error;
    }
  }
  
  /**
   * Get active polls
   */
  @measurePerformance('pollService.getActivePolls')
  static async getActivePolls(
    filters: { search?: string } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<PollWithOptions[]> {
    try {
      const polls = await pollRepository.findActiveWithOptions(filters, pagination);
      
      Logger.debug('Retrieved active polls', {
        count: polls.length,
        filters,
        pagination,
      });
      
      return polls;
    } catch (error) {
      Logger.error('Failed to get active polls', error as Error, {
        filters,
      });
      throw error;
    }
  }
  
  /**
   * Get poll statistics
   */
  @measurePerformance('pollService.getPollStatistics')
  static async getPollStatistics(pollId: string, userId?: string) {
    const poll = await this.getPoll(pollId);
    
    // Check if user can view statistics
    if (userId && poll.created_by !== userId && !poll.is_active) {
      throw new UnauthorizedError('view statistics for this poll');
    }
    
    try {
      const stats = await pollRepository.getStatistics(pollId);
      
      Logger.debug('Retrieved poll statistics', {
        pollId,
        userId,
        totalVotes: stats.totalVotes,
        uniqueVoters: stats.uniqueVoters,
      });
      
      return {
        poll,
        statistics: stats,
      };
    } catch (error) {
      Logger.error('Failed to get poll statistics', error as Error, {
        pollId,
        userId,
      });
      throw error;
    }
  }
  
  /**
   * Get user's vote for a poll
   */
  static async getUserVote(pollId: string, userId: string) {
    try {
      const votes = await voteRepository.getUserVotes(pollId, userId);
      
      return {
        hasVoted: votes.length > 0,
        votes,
        optionIds: votes.map(vote => vote.option_id),
      };
    } catch (error) {
      Logger.error('Failed to get user vote', error as Error, {
        pollId,
        userId,
      });
      throw error;
    }
  }
}
