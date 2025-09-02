"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { EditPollFormData, PollOption } from "@/types";
import { Calendar, Clock, Users, Eye, EyeOff } from "lucide-react";

const editPollSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  expiresAt: z.string().optional(),
  allowMultipleVotes: z.boolean(),
  isAnonymous: z.boolean(),
  isActive: z.boolean(),
});

type EditPollFormFields = z.infer<typeof editPollSchema>;

interface EditPollFormProps {
  poll: EditPollFormData;
  onSubmit: (data: Partial<EditPollFormData>) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function EditPollForm({
  poll,
  onSubmit,
  isLoading = false,
  error,
}: EditPollFormProps) {
  const [formError, setFormError] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditPollFormFields>({
    resolver: zodResolver(editPollSchema),
    defaultValues: {
      title: poll.title,
      description: poll.description || "",
      expiresAt: poll.expiresAt ? poll.expiresAt.toISOString().split('T')[0] : "",
      allowMultipleVotes: poll.allowMultipleVotes,
      isAnonymous: poll.isAnonymous,
      isActive: poll.isActive,
    },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: EditPollFormFields) => {
    try {
      setFormError("");

      // Prepare form data for update
      const updateData: Partial<EditPollFormData> = {
        title: data.title,
        description: data.description,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        allowMultipleVotes: data.allowMultipleVotes,
        isAnonymous: data.isAnonymous,
        isActive: data.isActive,
      };

      await onSubmit(updateData);
    } catch (err) {
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTotalVotes = () => {
    return poll.options.reduce((total, option) => total + option.votes, 0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Edit Poll</CardTitle>
        <CardDescription>
          Update your poll settings. Note: Poll options cannot be modified to preserve vote integrity.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <Alert variant="destructive">
              <AlertDescription>{error || formError}</AlertDescription>
            </Alert>
          )}

          {/* Poll Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Created: {formatDate(poll.createdAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Total Votes: {getTotalVotes()}
            </div>
            {poll.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Expires: {formatDate(poll.expiresAt)}
              </div>
            )}
          </div>

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
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Current Options (Read-only) */}
          <div className="space-y-2">
            <Label>Current Poll Options</Label>
            <p className="text-sm text-muted-foreground">
              Options cannot be modified after poll creation to preserve vote integrity.
            </p>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="font-medium">{option.text}</span>
                  <Badge variant="secondary">
                    {option.votes} vote{option.votes !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              {...register("expiresAt")}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Poll Settings</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowMultipleVotes"
                  checked={watchedValues.allowMultipleVotes}
                  onCheckedChange={(checked) => setValue("allowMultipleVotes", !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="allowMultipleVotes" className="text-sm font-normal">
                  Allow multiple votes per user
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAnonymous"
                  checked={watchedValues.isAnonymous}
                  onCheckedChange={(checked) => setValue("isAnonymous", !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="isAnonymous" className="text-sm font-normal flex items-center gap-2">
                  {watchedValues.isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Anonymous voting
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watchedValues.isActive}
                  onCheckedChange={(checked) => setValue("isActive", !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="isActive" className="text-sm font-normal">
                  Poll is active (users can vote)
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Updating Poll..." : "Update Poll"}
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
