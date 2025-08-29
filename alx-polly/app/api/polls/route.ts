import { NextRequest, NextResponse } from "next/server";
import { PollService } from "@/lib/services/poll-service";
import { getCurrentUser } from "@/lib/supabase";
import { CreatePollFormData } from "@/types";

// GET /api/polls - Get all polls
export async function GET(request: NextRequest) {
  try {
    const polls = await PollService.getActivePolls();

    // Transform the data to match your existing frontend expectations
    const transformedPolls = polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.poll_options.map((option) => ({
        id: option.id,
        text: option.text,
        votes: option.votes_count,
        pollId: poll.id,
      })),
      createdBy: poll.created_by,
      createdAt: new Date(poll.created_at),
      updatedAt: new Date(poll.updated_at),
      expiresAt: poll.expires_at ? new Date(poll.expires_at) : null,
      isActive: poll.is_active,
      allowMultipleVotes: poll.allow_multiple_votes,
      isAnonymous: poll.is_anonymous,
      totalVotes: poll.total_votes,
      qrCode: poll.qr_code_url,
    }));

    return NextResponse.json(transformedPolls, { status: 200 });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "You must be logged in to create a poll",
          redirectTo: "/auth/login",
        },
        { status: 401 }
      );
    }

    // Extract the token and verify the user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to create a poll",
          redirectTo: "/auth/login",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Basic validation
    if (!body.title || !body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: "Title and at least 2 options are required" },
        { status: 400 }
      );
    }

    // Validate options
    if (body.options.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 options allowed" },
        { status: 400 }
      );
    }

    // Create poll data
    const pollData: CreatePollFormData = {
      title: body.title,
      description: body.description || undefined,
      options: body.options,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      allowMultipleVotes: body.allowMultipleVotes || false,
      isAnonymous: body.isAnonymous !== false, // Default to true
    };

    // Create the poll using our service
    const newPoll = await PollService.createPoll(pollData, user.id);

    // Transform the response to match frontend expectations
    const transformedPoll = {
      id: newPoll.id,
      title: newPoll.title,
      description: newPoll.description,
      options: newPoll.poll_options.map((option) => ({
        id: option.id,
        text: option.text,
        votes: option.votes_count,
        pollId: newPoll.id,
      })),
      createdBy: newPoll.created_by,
      createdAt: new Date(newPoll.created_at),
      updatedAt: new Date(newPoll.updated_at),
      expiresAt: newPoll.expires_at ? new Date(newPoll.expires_at) : null,
      isActive: newPoll.is_active,
      allowMultipleVotes: newPoll.allow_multiple_votes,
      isAnonymous: newPoll.is_anonymous,
      totalVotes: newPoll.total_votes,
      qrCode: newPoll.qr_code_url,
    };

    return NextResponse.json(transformedPoll, { status: 201 });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create poll",
      },
      { status: 500 }
    );
  }
}
