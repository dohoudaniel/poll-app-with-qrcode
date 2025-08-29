"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreatePollFormData } from "@/types";
import { validatePollOptions } from "@/utils/poll-utils";
import { Plus, X, Calendar } from "lucide-react";

const createPollSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options required"),
  expiresAt: z.string().optional(),
  allowMultipleVotes: z.boolean(),
  isAnonymous: z.boolean(),
});

type CreatePollFormFields = z.infer<typeof createPollSchema>;

interface CreatePollFormProps {
  onSubmit: (data: CreatePollFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  initialData?: CreatePollFormData;
  isEditing?: boolean;
}

export function CreatePollForm({
  onSubmit,
  isLoading = false,
  error,
  initialData,
  isEditing = false,
}: CreatePollFormProps) {
  const [formError, setFormError] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreatePollFormFields>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      options: initialData?.options || ["", ""],
      expiresAt: initialData?.expiresAt,
      allowMultipleVotes: initialData?.allowMultipleVotes || false,
      isAnonymous:
        initialData?.isAnonymous !== undefined ? initialData.isAnonymous : true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");

  const handleFormSubmit = async (data: CreatePollFormFields) => {
    try {
      setFormError("");

      // Filter out empty options
      const filteredOptions = data.options.filter((option) => option.trim());

      // Validate options
      const validation = validatePollOptions(filteredOptions);
      if (!validation.isValid) {
        setFormError(validation.error!);
        return;
      }

      // Prepare form data
      const formData: CreatePollFormData = {
        title: data.title,
        description: data.description,
        options: filteredOptions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        allowMultipleVotes: data.allowMultipleVotes,
        isAnonymous: data.isAnonymous,
      };

      await onSubmit(formData);
    } catch (err) {
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append("");
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create New Poll</CardTitle>
        <CardDescription>
          Create a poll to gather opinions and make decisions together
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <Alert variant="destructive">
              <AlertDescription>{error || formError}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              placeholder="What's your question?"
              {...register("title")}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more context to your poll..."
              rows={3}
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poll Options *</Label>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={fields.length >= 10 || isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            {isEditing && (
              <p className="text-sm text-muted-foreground">
                Options cannot be modified after poll creation to preserve vote
                integrity.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      {...register(`options.${index}`)}
                      disabled={isLoading || isEditing}
                    />
                    {errors.options?.[index] && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.options[index]?.message}
                      </p>
                    )}
                  </div>

                  {fields.length > 2 && !isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="text-sm text-red-500">{errors.options.message}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="expiresAt"
                type="datetime-local"
                className="pl-10"
                {...register("expiresAt")}
                disabled={isLoading}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {errors.expiresAt && (
              <p className="text-sm text-red-500">{errors.expiresAt.message}</p>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Poll Settings</Label>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowMultipleVotes"
                  {...register("allowMultipleVotes")}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="allowMultipleVotes"
                  className="text-sm font-normal"
                >
                  Allow multiple votes per person
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAnonymous"
                  {...register("isAnonymous")}
                  disabled={isLoading}
                />
                <Label htmlFor="isAnonymous" className="text-sm font-normal">
                  Anonymous voting (recommended)
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Updating Poll..."
                  : "Creating Poll..."
                : isEditing
                ? "Update Poll"
                : "Create Poll"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
