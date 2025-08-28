import { NextRequest, NextResponse } from "next/server";

// POST /api/polls/[id]/vote - Submit a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Basic validation
    if (
      !body.optionIds ||
      !Array.isArray(body.optionIds) ||
      body.optionIds.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one option must be selected" },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock successful vote submission
    const voteResponse = {
      success: true,
      message: "Vote submitted successfully",
      pollId: id,
      optionIds: body.optionIds,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(voteResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
