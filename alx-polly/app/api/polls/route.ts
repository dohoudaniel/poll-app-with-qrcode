import { NextRequest, NextResponse } from 'next/server';

// Mock data for development
const mockPolls = [
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
    createdBy: 'user1',
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
    id: '2',
    title: 'Best time for team meetings?',
    description: 'Let\'s find a time that works for everyone',
    options: [
      { id: '5', text: '9:00 AM', votes: 12, pollId: '2' },
      { id: '6', text: '2:00 PM', votes: 18, pollId: '2' },
      { id: '7', text: '4:00 PM', votes: 8, pollId: '2' },
    ],
    createdBy: 'user2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    isActive: true,
    allowMultipleVotes: true,
    isAnonymous: false,
    totalVotes: 38,
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
    createdBy: 'user1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    expiresAt: new Date('2024-01-20'),
    isActive: false,
    allowMultipleVotes: false,
    isAnonymous: true,
    totalVotes: 58,
  }
];

// GET /api/polls - Get all polls
export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(mockPolls, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: 'Title and at least 2 options are required' },
        { status: 400 }
      );
    }

    // Create new poll (mock implementation)
    const newPoll = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description || '',
      options: body.options.map((text: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        text,
        votes: 0,
        pollId: Date.now().toString(),
      })),
      createdBy: 'current-user', // TODO: Get from auth
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      isActive: true,
      allowMultipleVotes: body.allowMultipleVotes || false,
      isAnonymous: body.isAnonymous !== false, // Default to true
      totalVotes: 0,
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    );
  }
}
