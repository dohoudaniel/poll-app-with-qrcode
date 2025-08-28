'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePollForm } from '@/components/forms/create-poll-form';
import { CreatePollFormData } from '@/types';
import { toast } from 'sonner';

export default function CreatePollPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleCreatePoll = async (data: CreatePollFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create poll');
      }

      const result = await response.json();
      
      toast.success('Poll created successfully!');
      
      // Redirect to the newly created poll
      router.push(`/polls/${result.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Poll
          </h1>
          <p className="text-gray-600">
            Ask questions, gather opinions, and make decisions together
          </p>
        </div>
        
        <CreatePollForm 
          onSubmit={handleCreatePoll}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
