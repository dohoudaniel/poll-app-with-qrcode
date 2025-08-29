"use client";

import { LoginForm } from "@/components/auth/login-form";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Polly
            </h1>
            <p className="text-gray-600">
              Sign in to create and participate in polls
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
