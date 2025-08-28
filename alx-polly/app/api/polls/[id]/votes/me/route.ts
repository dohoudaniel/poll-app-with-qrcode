import { NextRequest, NextResponse } from 'next/server';

// GET /api/polls/[id]/votes/me - Get current user's votes for a specific poll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock user votes for specific polls
    const mockUserVotesForPoll: Record<string, string[]> = {
      '1': ['2'], // User voted for Python in poll 1
      '2': ['6', '7'], // User voted for 2:00 PM and 4:00 PM in poll 2 (multiple choice)
      '3': [], // User hasn't voted in poll 3
    };
    
    const userVotes = mockUserVotesForPoll[id] || [];
    
    const response = {
      pollId: id,
      optionIds: userVotes,
      hasVoted: userVotes.length > 0,
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user votes for poll' },
      { status: 500 }
    );
  }
}
