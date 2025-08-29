'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CreatePollForm } from '@/components/forms/create-poll-form';
import { PollService } from '@/lib/services/poll-service';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { CreatePollFormData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditPollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPoll, setIsLoadingPoll] = useState(true);
  const [error, setError] = useState<string>('');
  const [initialData, setInitialData] = useState<CreatePollFormData | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    fetchPoll();
  }, [user, pollId, router]);

  const fetchPoll = async () => {
    try {
      setIsLoadingPoll(true);
      const poll = await PollService.getPollById(pollId);
      
      if (!poll) {
        toast.error('Poll not found');
        router.push('/dashboard');
        return;
      }
      
      // Check if user owns this poll
      if (poll.created_by !== user?.id) {
        toast.error('You can only edit your own polls');
        router.push('/dashboard');
        return;
      }
      
      // Convert poll data to form format
      const formData: CreatePollFormData = {
        title: poll.title,
        description: poll.description || undefined,
        options: poll.poll_options.map(option => option.text),
        expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
        allowMultipleVotes: poll.allow_multiple_votes,
        isAnonymous: poll.is_anonymous,
      };
      
      setInitialData(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load poll';
      toast.error(errorMessage);
      router.push('/dashboard');
    } finally {
      setIsLoadingPoll(false);
    }
  };

  const handleSubmit = async (data: CreatePollFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Update the poll
      await PollService.updatePoll(pollId, {
        title: data.title,
        description: data.description || null,
        expires_at: data.expiresAt ? data.expiresAt.toISOString() : null,
        allow_multiple_votes: data.allowMultipleVotes,
        is_anonymous: data.isAnonymous,
      }, user.id);

      toast.success('Poll updated successfully!');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update poll';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoadingPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
            <p className="mt-2 text-gray-600">
              Update your poll details and settings
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Note: You can update the poll details, but options cannot be modified after creation to preserve vote integrity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePollForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              initialData={initialData}
              isEditing={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
