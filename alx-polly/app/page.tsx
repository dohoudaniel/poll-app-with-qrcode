"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Users, Vote, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  // Auto-redirect to polls page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/polls");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-primary">Polly</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create interactive polls, gather opinions, and make decisions
              together. Share polls instantly with QR codes and get real-time
              results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/polls">Browse Polls</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8"
              >
                <Link href="/polls/create">Create Poll</Link>
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Redirecting to polls in 3 seconds...
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Vote className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Easy Voting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple, intuitive voting interface with support for single or
                  multiple choice polls.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Real-time Results</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch results update live as votes come in with beautiful
                  progress bars and statistics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share polls instantly with QR codes, direct links, or social
                  media integration.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of users who are already creating and participating
              in polls.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/auth/register">Sign Up Free</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
