import { NextRequest, NextResponse } from 'next/server';

// GET /api/votes/me - Get current user's votes
export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock user votes data (pollId -> optionIds)
    const mockUserVotes = {
      '1': ['2'], // User voted for Python in poll 1
      '2': ['6', '7'], // User voted for 2:00 PM and 4:00 PM in poll 2 (multiple choice)
      // User hasn't voted in poll 3
    };
    
    return NextResponse.json(mockUserVotes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user votes' },
      { status: 500 }
    );
  }
}
