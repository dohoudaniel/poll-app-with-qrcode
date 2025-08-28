import { NextRequest, NextResponse } from 'next/server';

// GET /api/polls/me - Get current user's polls
export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock user's polls (subset of all polls)
    const mockUserPolls = [
      {
        id: '1',
        title: 'What\'s your favorite programming language?',
        description: 'Help us understand the community preferences',
        options: [
          { id: '1', text: 'JavaScript', votes: 45, pollId: '1' },
          { id: '2', text: 'Python', votes: 38, pollId: '1' },
          { id: '3', text: 'TypeScript', votes: 32, pollId: '1' },
          { id: '4', text: 'Go', votes: 15, pollId: '1' },
        ],
        createdBy: 'current-user',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        expiresAt: new Date('2024-12-31'),
        isActive: true,
        allowMultipleVotes: false,
        isAnonymous: true,
        totalVotes: 130,
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3001/polls/1'
      },
      {
        id: '3',
        title: 'Office lunch preferences',
        description: 'What should we order for the team lunch?',
        options: [
          { id: '8', text: 'Pizza', votes: 25, pollId: '3' },
          { id: '9', text: 'Sushi', votes: 15, pollId: '3' },
          { id: '10', text: 'Sandwiches', votes: 10, pollId: '3' },
          { id: '11', text: 'Salads', votes: 8, pollId: '3' },
        ],
        createdBy: 'current-user',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        expiresAt: new Date('2024-01-20'),
        isActive: false,
        allowMultipleVotes: false,
        isAnonymous: true,
        totalVotes: 58,
      }
    ];
    
    return NextResponse.json(mockUserPolls, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user polls' },
      { status: 500 }
    );
  }
}
