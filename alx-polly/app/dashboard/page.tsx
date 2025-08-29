"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/types";
import { PollWithOptions } from "@/types/database";
import { filterPollsByStatus } from "@/utils/poll-utils";
import { toast } from "sonner";
import { Plus, BarChart3, Users, Clock, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { PollService } from "@/lib/services/poll-service";
import { ProtectedRoute } from "@/components/auth/protected-route";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPolls();
    }
  }, [user]);

  const fetchUserPolls = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const userPolls = await PollService.getUserPolls(user.id);
      setPolls(userPolls);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load your polls";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (
      !user ||
      !confirm(
        "Are you sure you want to delete this poll? This action cannot be undone."
      )
    )
      return;

    try {
      setDeletingPollId(pollId);
      await PollService.deletePoll(pollId, user.id);
      toast.success("Poll deleted successfully!");
      await fetchUserPolls(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete poll";
      toast.error(errorMessage);
    } finally {
      setDeletingPollId(null);
    }
  };

  const handleTogglePollStatus = async (pollId: string) => {
    if (!user) return;

    try {
      await PollService.togglePollStatus(pollId, user.id);
      toast.success("Poll status updated successfully!");
      await fetchUserPolls(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update poll status";
      toast.error(errorMessage);
    }
  };

  const getStats = () => {
    const activePolls = polls.filter((poll) => poll.is_active).length;
    const expiredPolls = polls.filter(
      (poll) => poll.expires_at && new Date(poll.expires_at) < new Date()
    ).length;
    const totalVotes = polls.reduce((sum, poll) => sum + poll.total_votes, 0);

    return {
      totalPolls: polls.length,
      activePolls,
      expiredPolls,
      totalVotes,
    };
  };

  const stats = getStats();

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your polls and track engagement
            </p>
          </div>

          <Button asChild>
            <Link href="/polls/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolls}</div>
              <p className="text-xs text-muted-foreground">
                Polls you&apos;ve created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Polls
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePolls}</div>
              <p className="text-xs text-muted-foreground">
                Currently accepting votes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                Across all your polls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expired Polls
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiredPolls}</div>
              <p className="text-xs text-muted-foreground">
                No longer accepting votes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity or Quick Actions */}
        {polls.length === 0 && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Polly!</CardTitle>
              <CardDescription>
                You haven&apos;t created any polls yet. Get started by creating
                your first poll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link href="/polls/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Poll
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/polls">Browse Public Polls</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Polls */}
        {polls.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Polls</h2>
            <div className="grid gap-6">
              {polls.map((poll) => (
                <Card key={poll.id} className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        {poll.description && (
                          <CardDescription className="mt-2">
                            {poll.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge
                          variant={poll.is_active ? "default" : "secondary"}
                        >
                          {poll.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {poll.expires_at &&
                          new Date(poll.expires_at) < new Date() && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Poll Options */}
                      <div className="space-y-2">
                        {poll.poll_options.map((option) => (
                          <div
                            key={option.id}
                            className="flex justify-between items-center p-3 bg-muted rounded-lg"
                          >
                            <span>{option.text}</span>
                            <Badge variant="outline">
                              {option.votes_count} votes
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Poll Stats */}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total votes: {poll.total_votes}</span>
                        <span>
                          Created:{" "}
                          {new Date(poll.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/polls/${poll.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/polls/${poll.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePollStatus(poll.id)}
                        >
                          {poll.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePoll(poll.id)}
                          disabled={deletingPollId === poll.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingPollId === poll.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
