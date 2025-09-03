/**
 * Tests for refactored poll actions using service layer
 */

// Mock the modules before importing
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock PollService
const mockCreatePoll = jest.fn();
const mockUpdatePoll = jest.fn();
const mockDeletePoll = jest.fn();
const mockTogglePollStatus = jest.fn();
const mockSubmitVote = jest.fn();

jest.mock("../../../lib/services/poll-service", () => ({
  PollService: {
    createPoll: mockCreatePoll,
    updatePoll: mockUpdatePoll,
    deletePoll: mockDeletePoll,
    togglePollStatus: mockTogglePollStatus,
    submitVote: mockSubmitVote,
  },
}));

// Mock error handler
const mockHandleServerActionError = jest.fn();
jest.mock("../../../lib/errors/error-handler", () => ({
  handleServerActionError: mockHandleServerActionError,
}));

// Now import the functions to test
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  togglePollStatusAction,
  submitVoteAction,
} from "../../../lib/actions/poll-actions";
import { revalidatePath } from "next/cache";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe("Poll Actions - Refactored Tests", () => {
  const mockUserId = "user-123";
  const mockPollId = "poll-456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPollAction", () => {
    const validPollData = {
      title: "Test Poll",
      description: "Test Description",
      options: ["Option 1", "Option 2", "Option 3"],
      expiresAt: new Date("2024-12-31"),
      allowMultipleVotes: false,
      isAnonymous: true,
    };

    it("should create poll successfully", async () => {
      const mockPoll = { id: mockPollId, title: "Test Poll" };
      mockCreatePoll.mockResolvedValue(mockPoll);

      const result = await createPollAction(validPollData, mockUserId);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe(mockPollId);
      expect(mockCreatePoll).toHaveBeenCalledWith(validPollData, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockCreatePoll.mockRejectedValue(error);
      mockHandleServerActionError.mockReturnValue({
        success: false,
        error: "Service error",
      });

      const result = await createPollAction(validPollData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Service error");
      expect(mockHandleServerActionError).toHaveBeenCalledWith(error);
    });
  });

  describe("updatePollAction", () => {
    const updateData = {
      title: "Updated Poll Title",
      description: "Updated description",
      isActive: false,
    };

    it("should update poll successfully", async () => {
      mockUpdatePoll.mockResolvedValue({ id: mockPollId, ...updateData });

      const result = await updatePollAction(mockPollId, updateData, mockUserId);

      expect(result.success).toBe(true);
      expect(mockUpdatePoll).toHaveBeenCalledWith(mockPollId, updateData, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}/edit`);
    });

    it("should handle service errors", async () => {
      const error = new Error("Update failed");
      mockUpdatePoll.mockRejectedValue(error);
      mockHandleServerActionError.mockReturnValue({
        success: false,
        error: "Update failed",
      });

      const result = await updatePollAction(mockPollId, updateData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
      expect(mockHandleServerActionError).toHaveBeenCalledWith(error);
    });
  });

  describe("deletePollAction", () => {
    it("should delete poll successfully", async () => {
      mockDeletePoll.mockResolvedValue(undefined);

      const result = await deletePollAction(mockPollId, mockUserId);

      expect(result.success).toBe(true);
      expect(mockDeletePoll).toHaveBeenCalledWith(mockPollId, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle service errors", async () => {
      const error = new Error("Delete failed");
      mockDeletePoll.mockRejectedValue(error);
      mockHandleServerActionError.mockReturnValue({
        success: false,
        error: "Delete failed",
      });

      const result = await deletePollAction(mockPollId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
      expect(mockHandleServerActionError).toHaveBeenCalledWith(error);
    });
  });

  describe("togglePollStatusAction", () => {
    it("should toggle poll status successfully", async () => {
      const mockResult = {
        poll: { id: mockPollId, is_active: false },
        isActive: false,
      };
      mockTogglePollStatus.mockResolvedValue(mockResult);

      const result = await togglePollStatusAction(mockPollId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(mockTogglePollStatus).toHaveBeenCalledWith(mockPollId, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}`);
    });

    it("should handle service errors", async () => {
      const error = new Error("Toggle failed");
      mockTogglePollStatus.mockRejectedValue(error);
      mockHandleServerActionError.mockReturnValue({
        success: false,
        error: "Toggle failed",
      });

      const result = await togglePollStatusAction(mockPollId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Toggle failed");
      expect(mockHandleServerActionError).toHaveBeenCalledWith(error);
    });
  });

  describe("submitVoteAction", () => {
    const optionIds = ["option-1", "option-2"];

    it("should submit vote successfully", async () => {
      mockSubmitVote.mockResolvedValue(undefined);

      const result = await submitVoteAction(mockPollId, optionIds, mockUserId);

      expect(result.success).toBe(true);
      expect(mockSubmitVote).toHaveBeenCalledWith(mockPollId, optionIds, mockUserId);
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle service errors", async () => {
      const error = new Error("Vote failed");
      mockSubmitVote.mockRejectedValue(error);
      mockHandleServerActionError.mockReturnValue({
        success: false,
        error: "Vote failed",
      });

      const result = await submitVoteAction(mockPollId, optionIds, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Vote failed");
      expect(mockHandleServerActionError).toHaveBeenCalledWith(error);
    });
  });

  describe("Integration", () => {
    it("should handle all actions in sequence", async () => {
      const pollData = {
        title: "Integration Test Poll",
        description: "Testing integration",
        options: ["Option A", "Option B"],
        allowMultipleVotes: false,
        isAnonymous: true,
      };

      // Create poll
      mockCreatePoll.mockResolvedValue({ id: mockPollId });
      const createResult = await createPollAction(pollData, mockUserId);
      expect(createResult.success).toBe(true);

      // Update poll
      mockUpdatePoll.mockResolvedValue({ id: mockPollId });
      const updateResult = await updatePollAction(
        mockPollId,
        { title: "Updated Title" },
        mockUserId
      );
      expect(updateResult.success).toBe(true);

      // Toggle status
      mockTogglePollStatus.mockResolvedValue({
        poll: { id: mockPollId },
        isActive: false,
      });
      const toggleResult = await togglePollStatusAction(mockPollId, mockUserId);
      expect(toggleResult.success).toBe(true);

      // Submit vote
      mockSubmitVote.mockResolvedValue(undefined);
      const voteResult = await submitVoteAction(mockPollId, ["option-1"], mockUserId);
      expect(voteResult.success).toBe(true);

      // Delete poll
      mockDeletePoll.mockResolvedValue(undefined);
      const deleteResult = await deletePollAction(mockPollId, mockUserId);
      expect(deleteResult.success).toBe(true);

      // Verify all services were called
      expect(mockCreatePoll).toHaveBeenCalled();
      expect(mockUpdatePoll).toHaveBeenCalled();
      expect(mockTogglePollStatus).toHaveBeenCalled();
      expect(mockSubmitVote).toHaveBeenCalled();
      expect(mockDeletePoll).toHaveBeenCalled();
    });
  });
});
