import { supabase } from '@/lib/supabase';
import { Database, InsertPoll, InsertPollOption, Poll, PollWithOptions } from '@/types/database';
import { CreatePollFormData } from '@/types';

export class PollService {
  /**
   * Create a new poll with options
   */
  static async createPoll(pollData: CreatePollFormData, userId: string): Promise<PollWithOptions> {
    try {
      // Start a transaction by creating the poll first
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description || null,
          created_by: userId,
          expires_at: pollData.expiresAt ? pollData.expiresAt.toISOString() : null,
          allow_multiple_votes: pollData.allowMultipleVotes,
          is_anonymous: pollData.isAnonymous,
          is_active: true,
        } satisfies InsertPoll)
        .select()
        .single();

      if (pollError) {
        console.error('Error creating poll:', pollError);
        throw new Error(`Failed to create poll: ${pollError.message}`);
      }

      // Create poll options
      const optionsToInsert: InsertPollOption[] = pollData.options.map((optionText) => ({
        poll_id: poll.id,
        text: optionText,
      }));

      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        console.error('Error creating poll options:', optionsError);
        // Clean up the poll if options creation failed
        await supabase.from('polls').delete().eq('id', poll.id);
        throw new Error(`Failed to create poll options: ${optionsError.message}`);
      }

      // Get the user profile for the response
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return {
        ...poll,
        poll_options: options || [],
        profiles: profile!,
      };
    } catch (error) {
      console.error('Error in createPoll:', error);
      throw error;
    }
  }

  /**
   * Get all active polls with their options
   */
  static async getActivePolls(): Promise<PollWithOptions[]> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*),
          profiles (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching polls:', error);
        throw new Error(`Failed to fetch polls: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActivePolls:', error);
      throw error;
    }
  }

  /**
   * Get a specific poll by ID with options
   */
  static async getPollById(pollId: string): Promise<PollWithOptions | null> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*),
          profiles (*)
        `)
        .eq('id', pollId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Poll not found
          return null;
        }
        console.error('Error fetching poll:', error);
        throw new Error(`Failed to fetch poll: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getPollById:', error);
      throw error;
    }
  }

  /**
   * Get polls created by a specific user
   */
  static async getUserPolls(userId: string): Promise<PollWithOptions[]> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*),
          profiles (*)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user polls:', error);
        throw new Error(`Failed to fetch user polls: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPolls:', error);
      throw error;
    }
  }

  /**
   * Update a poll (only by the creator)
   */
  static async updatePoll(
    pollId: string, 
    updates: Partial<InsertPoll>, 
    userId: string
  ): Promise<Poll> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId)
        .eq('created_by', userId) // Ensure only creator can update
        .select()
        .single();

      if (error) {
        console.error('Error updating poll:', error);
        throw new Error(`Failed to update poll: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updatePoll:', error);
      throw error;
    }
  }

  /**
   * Delete a poll (only by the creator)
   */
  static async deletePoll(pollId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
        .eq('created_by', userId); // Ensure only creator can delete

      if (error) {
        console.error('Error deleting poll:', error);
        throw new Error(`Failed to delete poll: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePoll:', error);
      throw error;
    }
  }

  /**
   * Toggle poll active status
   */
  static async togglePollStatus(pollId: string, userId: string): Promise<Poll> {
    try {
      // First get the current status
      const { data: currentPoll, error: fetchError } = await supabase
        .from('polls')
        .select('is_active')
        .eq('id', pollId)
        .eq('created_by', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch poll: ${fetchError.message}`);
      }

      // Toggle the status
      const { data, error } = await supabase
        .from('polls')
        .update({ is_active: !currentPoll.is_active })
        .eq('id', pollId)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling poll status:', error);
        throw new Error(`Failed to toggle poll status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in togglePollStatus:', error);
      throw error;
    }
  }
}
