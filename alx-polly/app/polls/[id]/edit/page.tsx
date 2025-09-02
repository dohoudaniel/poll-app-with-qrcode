"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { EditPollForm } from "@/components/forms/edit-poll-form";
import { PollService } from "@/lib/services/poll-service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { EditPollFormData } from "@/types";
import { PollWithOptions } from "@/types/database";
import { api } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPoll, setIsLoadingPoll] = useState(true);
  const [error, setError] = useState<string>("");
  const [pollData, setPollData] = useState<EditPollFormData | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchPoll();
  }, [user, pollId, router]);

  const fetchPoll = async () => {
    try {
      setIsLoadingPoll(true);
      // Use authenticated API client to fetch poll details
      const poll = await api.get<PollWithOptions>(`/api/polls/${pollId}`);

      if (!poll) {
        toast.error("Poll not found");
        router.push("/dashboard");
        return;
      }

      // Check if user owns this poll
      if (poll.created_by !== user?.id) {
        toast.error("You can only edit your own polls");
        router.push("/dashboard");
        return;
      }

      // Convert poll data to EditPollFormData format
      const editData: EditPollFormData = {
        id: poll.id,
        title: poll.title,
        description: poll.description || undefined,
        options: poll.poll_options.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option.votes_count,
          pollId: poll.id,
        })),
        expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
        allowMultipleVotes: poll.allow_multiple_votes,
        isAnonymous: poll.is_anonymous,
        isActive: poll.is_active,
        createdAt: new Date(poll.created_at),
        updatedAt: new Date(poll.updated_at),
      };

      setPollData(editData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load poll";
      toast.error(errorMessage);
      router.push("/dashboard");
    } finally {
      setIsLoadingPoll(false);
    }
  };

  const handleSubmit = async (data: Partial<EditPollFormData>) => {
    if (!user || !pollData) return;

    setIsLoading(true);
    setError("");

    try {
      // Update the poll using authenticated API client
      await api.put(`/api/polls/${pollId}`, {
        title: data.title,
        description: data.description || null,
        expires_at: data.expiresAt ? data.expiresAt.toISOString() : null,
        allow_multiple_votes: data.allowMultipleVotes,
        is_anonymous: data.isAnonymous,
        is_active: data.isActive,
      });

      toast.success("Poll updated successfully!");
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update poll";
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

  if (!pollData) {
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

        <EditPollForm
          poll={pollData}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
