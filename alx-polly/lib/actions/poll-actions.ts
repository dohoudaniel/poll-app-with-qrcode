"use server";

import { revalidatePath } from "next/cache";
import { PollService } from "../services/poll-service";
import { handleServerActionError } from "../errors/error-handler";
import { CreatePollFormData, EditPollFormData } from "@/types";

/**
 * Server action to create a new poll
 */
export async function createPollAction(
  formData: CreatePollFormData,
  userId: string
): Promise<{ success: boolean; pollId?: string; error?: string }> {
  try {
    const poll = await PollService.createPoll(formData, userId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/polls");

    return { success: true, pollId: poll.id };
  } catch (error) {
    const errorResponse = handleServerActionError(error);
    return errorResponse;
  }
}

/**
 * Server action to update an existing poll
 */
export async function updatePollAction(
  pollId: string,
  formData: Partial<EditPollFormData>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await PollService.updatePoll(pollId, formData, userId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/polls/${pollId}`);
    revalidatePath(`/polls/${pollId}/edit`);

    return { success: true };
  } catch (error) {
    const errorResponse = handleServerActionError(error);
    return errorResponse;
  }
}

/**
 * Server action to delete a poll
 */
export async function deletePollAction(
  pollId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await PollService.deletePoll(pollId, userId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/polls");

    return { success: true };
  } catch (error) {
    const errorResponse = handleServerActionError(error);
    return errorResponse;
  }
}

/**
 * Server action to toggle poll active status
 */
export async function togglePollStatusAction(
  pollId: string,
  userId: string
): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
  try {
    const result = await PollService.togglePollStatus(pollId, userId);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/polls/${pollId}`);

    return { success: true, isActive: result.isActive };
  } catch (error) {
    const errorResponse = handleServerActionError(error);
    return errorResponse;
  }
}

/**
 * Server action to submit a vote
 */
export async function submitVoteAction(
  pollId: string,
  optionIds: string[],
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await PollService.submitVote(pollId, optionIds, userId);

    // Revalidate relevant paths
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/polls");

    return { success: true };
  } catch (error) {
    const errorResponse = handleServerActionError(error);
    return errorResponse;
  }
}
