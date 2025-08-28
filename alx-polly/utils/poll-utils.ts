import { Poll, PollOption, PollStatus } from '@/types';

/**
 * Calculate the percentage of votes for a poll option
 */
export function calculateVotePercentage(option: PollOption, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((option.votes / totalVotes) * 100);
}

/**
 * Get the poll status based on current date and expiration
 */
export function getPollStatus(poll: Poll): PollStatus {
  if (!poll.isActive) return 'draft';
  if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
    return 'expired';
  }
  return 'active';
}

/**
 * Check if a poll is votable
 */
export function isPollVotable(poll: Poll): boolean {
  const status = getPollStatus(poll);
  return status === 'active';
}

/**
 * Get the winning option(s) from a poll
 */
export function getWinningOptions(poll: Poll): PollOption[] {
  if (poll.options.length === 0) return [];
  
  const maxVotes = Math.max(...poll.options.map(option => option.votes));
  return poll.options.filter(option => option.votes === maxVotes);
}

/**
 * Format poll creation date for display
 */
export function formatPollDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Generate a shareable poll URL
 */
export function generatePollUrl(pollId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/polls/${pollId}`;
  }
  return `/polls/${pollId}`;
}

/**
 * Validate poll options
 */
export function validatePollOptions(options: string[]): { isValid: boolean; error?: string } {
  if (options.length < 2) {
    return { isValid: false, error: 'Poll must have at least 2 options' };
  }
  
  if (options.length > 10) {
    return { isValid: false, error: 'Poll cannot have more than 10 options' };
  }
  
  const uniqueOptions = new Set(options.filter(opt => opt.trim()));
  if (uniqueOptions.size !== options.length) {
    return { isValid: false, error: 'All options must be unique and non-empty' };
  }
  
  return { isValid: true };
}

/**
 * Sort polls by creation date (newest first)
 */
export function sortPollsByDate(polls: Poll[]): Poll[] {
  return [...polls].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Filter polls by status
 */
export function filterPollsByStatus(polls: Poll[], status: PollStatus): Poll[] {
  return polls.filter(poll => getPollStatus(poll) === status);
}

/**
 * Calculate time remaining for a poll
 */
export function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
