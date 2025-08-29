"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatePollForm } from "@/components/forms/create-poll-form";
import { CreatePollFormData } from "@/types";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { api } from "@/lib/api-client";

function CreatePollContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleCreatePoll = async (data: CreatePollFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Use the authenticated API client
      const result = await api.post("/api/polls", data);
      toast.success("Poll created successfully!");
      router.push("/polls");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create poll";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Poll
          </h1>
          <p className="text-gray-600">
            Ask questions, gather opinions, and make decisions together
          </p>
        </div>

        <CreatePollForm
          onSubmit={handleCreatePoll}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}

export default function CreatePollPage() {
  return (
    <ProtectedRoute>
      <CreatePollContent />
    </ProtectedRoute>
  );
}
