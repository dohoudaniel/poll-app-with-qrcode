/**
 * Working tests for poll actions with proper mocking
 */

// Mock the modules before importing
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock PollService
jest.mock("../../../lib/services/poll-service", () => ({
  PollService: {
    createPoll: jest.fn(),
    updatePoll: jest.fn(),
    deletePoll: jest.fn(),
    togglePollStatus: jest.fn(),
    submitVote: jest.fn(),
  },
}));

// Mock error handler
jest.mock("../../../lib/errors/error-handler", () => ({
  handleServerActionError: jest.fn(),
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
import { PollService } from "../../../lib/services/poll-service";
import { handleServerActionError } from "../../../lib/errors/error-handler";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const mockPollService = PollService as jest.Mocked<typeof PollService>;
const mockHandleServerActionError =
  handleServerActionError as jest.MockedFunction<
    typeof handleServerActionError
  >;

describe("Poll Actions - Working Tests", () => {
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

    it("should validate required fields", async () => {
      const invalidData = { ...validPollData, title: "" };

      const result = await createPollAction(invalidData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Poll title is required");
    });

    it("should validate minimum options", async () => {
      const invalidData = { ...validPollData, options: ["Only one option"] };

      const result = await createPollAction(invalidData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("At least 2 options are required");
    });

    it("should validate maximum options", async () => {
      const invalidData = {
        ...validPollData,
        options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
      };

      const result = await createPollAction(invalidData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum 10 options allowed");
    });

    it("should create poll successfully with valid data", async () => {
      const mockPoll = { id: mockPollId, title: "Test Poll" };

      // Mock successful poll creation
      mockSupabaseFrom
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockPoll, error: null }),
            }),
          }),
        })
        // Mock successful options creation
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        });

      const result = await createPollAction(validPollData, mockUserId);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe(mockPollId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });

    it("should handle database errors gracefully", async () => {
      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const result = await createPollAction(validPollData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create poll: Database error");
    });
  });

  describe("updatePollAction", () => {
    const updateData = {
      title: "Updated Poll Title",
      description: "Updated description",
      isActive: false,
    };

    it("should validate poll ownership", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { created_by: "different-user" },
              error: null,
            }),
          }),
        }),
      });

      const result = await updatePollAction(mockPollId, updateData, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("You can only edit your own polls");
    });

    it("should validate empty title", async () => {
      // First mock the ownership check to pass
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { created_by: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const invalidData = { ...updateData, title: "   " };

      const result = await updatePollAction(
        mockPollId,
        invalidData,
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Poll title cannot be empty");
    });

    it("should update poll successfully", async () => {
      mockSupabaseFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { created_by: mockUserId },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const result = await updatePollAction(mockPollId, updateData, mockUserId);

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}`);
    });
  });

  describe("deletePollAction", () => {
    it("should validate poll ownership", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { created_by: "different-user" },
              error: null,
            }),
          }),
        }),
      });

      const result = await deletePollAction(mockPollId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("You can only delete your own polls");
    });

    it("should delete poll successfully", async () => {
      mockSupabaseFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { created_by: mockUserId },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const result = await deletePollAction(mockPollId, mockUserId);

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/polls");
    });
  });

  describe("togglePollStatusAction", () => {
    it("should toggle poll status successfully", async () => {
      mockSupabaseFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { created_by: mockUserId, is_active: true },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const result = await togglePollStatusAction(mockPollId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false); // Should be toggled from true to false
    });
  });

  describe("submitVoteAction", () => {
    const optionIds = ["option-1", "option-2"];

    it("should validate empty options", async () => {
      const result = await submitVoteAction(mockPollId, [], mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("At least one option must be selected");
    });

    it("should validate poll is active", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                allow_multiple_votes: true,
                is_active: false,
                expires_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await submitVoteAction(mockPollId, optionIds, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("This poll is not active");
    });

    it("should validate poll expiration", async () => {
      const expiredDate = new Date("2020-01-01").toISOString();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                allow_multiple_votes: true,
                is_active: true,
                expires_at: expiredDate,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await submitVoteAction(mockPollId, optionIds, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("This poll has expired");
    });

    it("should validate multiple votes setting", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                allow_multiple_votes: false,
                is_active: true,
                expires_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await submitVoteAction(mockPollId, optionIds, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("This poll only allows one vote per user");
    });
  });
});
