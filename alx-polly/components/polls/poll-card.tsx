'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Poll, PollOption } from '@/types';
import { 
  calculateVotePercentage, 
  getPollStatus, 
  isPollVotable, 
  formatPollDate,
  getTimeRemaining 
} from '@/utils/poll-utils';
import { Clock, Users, Share2, BarChart3 } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionIds: string[]) => Promise<void>;
  showResults?: boolean;
  currentUserId?: string;
  userVotes?: string[]; // Option IDs the user has voted for
}

export function PollCard({ 
  poll, 
  onVote, 
  showResults = false, 
  currentUserId,
  userVotes = []
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(userVotes.length > 0);

  const pollStatus = getPollStatus(poll);
  const isVotable = isPollVotable(poll) && !hasVoted;
  const canShowResults = showResults || hasVoted || pollStatus !== 'active';

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, optionId]
          : prev.filter(id => id !== optionId)
      );
    } else {
      setSelectedOptions(checked ? [optionId] : []);
    }
  };

  const handleVote = async () => {
    if (!onVote || selectedOptions.length === 0) return;

    setIsVoting(true);
    try {
      await onVote(poll.id, selectedOptions);
      setHasVoted(true);
    } catch (error) {
      console.error('Voting failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/polls/${poll.id}`;
    if (navigator.share) {
      await navigator.share({
        title: poll.title,
        text: poll.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      // TODO: Show toast notification
    }
  };

  const getStatusBadgeVariant = () => {
    switch (pollStatus) {
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'draft': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="mt-1">{poll.description}</CardDescription>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant()}>
            {pollStatus.charAt(0).toUpperCase() + pollStatus.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{poll.totalVotes} votes</span>
          </div>
          
          {poll.expiresAt && pollStatus === 'active' && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{getTimeRemaining(poll.expiresAt)}</span>
            </div>
          )}
          
          <span>{formatPollDate(poll.createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isVotable && !canShowResults ? (
          // Voting interface
          <div className="space-y-3">
            {poll.allowMultipleVotes ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select one or more options:
                </p>
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => 
                        handleOptionChange(option.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0] || ''}
                onValueChange={(value) => setSelectedOptions([value])}
              >
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        ) : (
          // Results interface
          <div className="space-y-3">
            {poll.options.map((option) => {
              const percentage = calculateVotePercentage(option, poll.totalVotes);
              const isUserVote = userVotes.includes(option.id);
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isUserVote ? 'font-medium' : ''}`}>
                      {option.text}
                      {isUserVote && <span className="text-primary ml-1">✓</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.votes} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {isVotable && (
            <Button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              size="sm"
            >
              {isVoting ? 'Voting...' : 'Vote'}
            </Button>
          )}
          
          {canShowResults && (
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Results
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
