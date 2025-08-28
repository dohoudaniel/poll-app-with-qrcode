'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PollsList } from '@/components/polls/polls-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/types';
import { filterPollsByStatus } from '@/utils/poll-utils';
import { toast } from 'sonner';
import { Plus, BarChart3, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { supabaseClient } from '@/lib/supabase';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else {
      fetchUserPolls();
      fetchUserVotes();
    }
  }, [user, router]);

  const fetchUserPolls = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient
        .from('polls')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error('Failed to fetch your polls');
      }
      
      setPolls(data as Poll[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load your polls';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabaseClient
        .from('votes')
        .select('poll_id, selected_options')
        .eq('user_id', user.id);

      if (error) {
        throw new Error('Failed to fetch user votes');
      }

      const votesData = data.reduce((acc, vote) => {
        acc[vote.poll_id] = vote.selected_options;
        return acc;
      }, {} as Record<string, string[]>);
      
      setUserVotes(votesData);
    } catch (err) {
      console.error('Failed to fetch user votes:', err);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    if (!user) return;
    try {
      const { error } = await supabaseClient
        .from('votes')
        .upsert({ poll_id: pollId, user_id: user.id, selected_options: optionIds }, { onConflict: 'poll_id, user_id' });

      if (error) {
        throw new Error('Failed to submit vote');
      }

      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionIds
      }));
      
      // Refresh polls
      await fetchUserPolls();
      
      toast.success('Vote submitted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getStats = () => {
    const activePolls = filterPollsByStatus(polls, 'active').length;
    const expiredPolls = filterPollsByStatus(polls, 'expired').length;
    const totalVotes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);
    
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
                Polls you've created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
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
              <CardTitle className="text-sm font-medium">Expired Polls</CardTitle>
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
                You haven't created any polls yet. Get started by creating your first poll.
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
                  <Link href="/polls">
                    Browse Public Polls
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Polls */}
        {polls.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Polls</h2>
            <PollsList
              polls={polls}
              onVote={handleVote}
              userVotes={userVotes}
              isLoading={isLoading}
              showCreateButton={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
