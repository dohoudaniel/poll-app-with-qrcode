import { NextRequest, NextResponse } from "next/server";

// Mock data (same as in polls/route.ts)
const mockPolls = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Help us understand the community preferences",
    options: [
      { id: "1", text: "JavaScript", votes: 45, pollId: "1" },
      { id: "2", text: "Python", votes: 38, pollId: "1" },
      { id: "3", text: "TypeScript", votes: 32, pollId: "1" },
      { id: "4", text: "Go", votes: 15, pollId: "1" },
    ],
    createdBy: "user1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    expiresAt: new Date("2024-12-31"),
    isActive: true,
    allowMultipleVotes: false,
    isAnonymous: true,
    totalVotes: 130,
    qrCode:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3001/polls/1",
  },
  {
    id: "2",
    title: "Best time for team meetings?",
    description: "Let's find a time that works for everyone",
    options: [
      { id: "5", text: "9:00 AM", votes: 12, pollId: "2" },
      { id: "6", text: "2:00 PM", votes: 18, pollId: "2" },
      { id: "7", text: "4:00 PM", votes: 8, pollId: "2" },
    ],
    createdBy: "user2",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    isActive: true,
    allowMultipleVotes: true,
    isAnonymous: false,
    totalVotes: 38,
  },
  {
    id: "3",
    title: "Office lunch preferences",
    description: "What should we order for the team lunch?",
    options: [
      { id: "8", text: "Pizza", votes: 25, pollId: "3" },
      { id: "9", text: "Sushi", votes: 15, pollId: "3" },
      { id: "10", text: "Sandwiches", votes: 10, pollId: "3" },
      { id: "11", text: "Salads", votes: 8, pollId: "3" },
    ],
    createdBy: "user1",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    expiresAt: new Date("2024-01-20"),
    isActive: false,
    allowMultipleVotes: false,
    isAnonymous: true,
    totalVotes: 58,
  },
];

// GET /api/polls/[id] - Get a specific poll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const poll = mockPolls.find((p) => p.id === id);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json(poll, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}
