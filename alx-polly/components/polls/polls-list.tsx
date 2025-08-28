'use client';

import { useState, useEffect } from 'react';
import { PollCard } from './poll-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Poll, PollStatus } from '@/types';
import { filterPollsByStatus, sortPollsByDate } from '@/utils/poll-utils';
import { Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

interface PollsListProps {
  polls: Poll[];
  onVote?: (pollId: string, optionIds: string[]) => Promise<void>;
  currentUserId?: string;
  userVotes?: Record<string, string[]>; // pollId -> optionIds
  showCreateButton?: boolean;
  isLoading?: boolean;
}

export function PollsList({ 
  polls, 
  onVote, 
  currentUserId, 
  userVotes = {},
  showCreateButton = true,
  isLoading = false
}: PollsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PollStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-voted'>('newest');
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>(polls);

  useEffect(() => {
    let filtered = [...polls];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(poll => 
        poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filterPollsByStatus(filtered, statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered = sortPollsByDate(filtered);
        break;
      case 'oldest':
        filtered = [...filtered].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'most-voted':
        filtered = [...filtered].sort((a, b) => b.totalVotes - a.totalVotes);
        break;
    }

    setFilteredPolls(filtered);
  }, [polls, searchTerm, statusFilter, sortBy]);

  const getStatusCounts = () => {
    const active = filterPollsByStatus(polls, 'active').length;
    const expired = filterPollsByStatus(polls, 'expired').length;
    const draft = filterPollsByStatus(polls, 'draft').length;
    
    return { active, expired, draft, total: polls.length };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Polls</h2>
          {showCreateButton && (
            <Button asChild>
              <Link href="/polls/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Link>
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Polls</h2>
          <p className="text-muted-foreground">
            {statusCounts.total} total polls
          </p>
        </div>
        
        {showCreateButton && (
          <Button asChild>
            <Link href="/polls/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Link>
          </Button>
        )}
      </div>

      {/* Status Overview */}
      <div className="flex gap-4">
        <Badge variant="default" className="px-3 py-1">
          Active: {statusCounts.active}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          Expired: {statusCounts.expired}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          Draft: {statusCounts.draft}
        </Badge>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most-voted">Most Voted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {filteredPolls.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No polls match your filters' 
                : 'No polls found'
              }
            </div>
            {showCreateButton && !searchTerm && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/polls/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Poll
                </Link>
              </Button>
            )}
          </div>
        ) : (
          filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={onVote}
              currentUserId={currentUserId}
              userVotes={userVotes[poll.id] || []}
            />
          ))
        )}
      </div>
    </div>
  );
}
