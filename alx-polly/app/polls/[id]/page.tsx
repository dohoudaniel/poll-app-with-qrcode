'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PollCard } from '@/components/polls/poll-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/types';
import { toast } from 'sonner';
import { ArrowLeft, Share2, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchPoll();
    fetchUserVotes();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/polls/${pollId}`);
      
      if (!response.ok) {
        throw new Error('Poll not found');
      }
      
      const pollData = await response.json();
      setPoll(pollData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load poll';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    try {
      // TODO: Replace with actual API call to get user's votes for this poll
      const response = await fetch(`/api/polls/${pollId}/votes/me`);
      
      if (response.ok) {
        const votesData = await response.json();
        setUserVotes(votesData.optionIds || []);
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

      const result = await response.json();
      
      // Update local state
      setUserVotes(optionIds);
      
      // Refresh poll data to get updated vote counts
      await fetchPoll();
      
      toast.success('Vote submitted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.title,
          text: poll?.description,
          url,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Poll link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const showQRCode = () => {
    // TODO: Implement QR code modal
    toast.info('QR code feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Poll Not Found</CardTitle>
              <CardDescription>
                {error || 'The poll you are looking for does not exist or has been removed.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/polls">Browse Polls</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/polls/create">Create Poll</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={showQRCode}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>
        </div>

        {/* Poll Card */}
        <PollCard
          poll={poll}
          onVote={handleVote}
          currentUserId={currentUserId}
          userVotes={userVotes}
          showResults={false}
        />

        {/* Additional Poll Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Poll Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Votes:</span>
                <span className="ml-2">{poll.totalVotes}</span>
              </div>
              <div>
                <span className="font-medium">Vote Type:</span>
                <span className="ml-2">
                  {poll.allowMultipleVotes ? 'Multiple Choice' : 'Single Choice'}
                </span>
              </div>
              <div>
                <span className="font-medium">Anonymous:</span>
                <span className="ml-2">{poll.isAnonymous ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">
                  {new Date(poll.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {poll.expiresAt && (
              <div className="pt-2 border-t">
                <span className="font-medium text-sm">Expires:</span>
                <span className="ml-2 text-sm">
                  {new Date(poll.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
