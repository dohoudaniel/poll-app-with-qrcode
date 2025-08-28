'use client';

import { useState, useEffect } from 'react';
import { PollsList } from '@/components/polls/polls-list';
import { Poll } from '@/types';
import { toast } from 'sonner';

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchPolls();
    fetchUserVotes();
  }, []);

  const fetchPolls = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/polls');
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      
      const pollsData = await response.json();
      setPolls(pollsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load polls';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    try {
      // TODO: Replace with actual API call to get user's votes across all polls
      const response = await fetch('/api/votes/me');
      
      if (response.ok) {
        const votesData = await response.json();
        setUserVotes(votesData);
      }
    } catch (err) {
      console.error('Failed to fetch user votes:', err);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionIds
      }));
      
      // Refresh polls to get updated vote counts
      await fetchPolls();
      
      toast.success('Vote submitted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PollsList
        polls={polls}
        onVote={handleVote}
        currentUserId={currentUserId}
        userVotes={userVotes}
        isLoading={isLoading}
        showCreateButton={true}
      />
    </div>
  );
}
