'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-logout after component mounts
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      // TODO: Replace with actual API call to invalidate session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear local storage
      localStorage.removeItem('authToken');
      
      toast.success('You have been logged out successfully');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local storage and redirect even if API call fails
      localStorage.removeItem('authToken');
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Logged Out</CardTitle>
          <CardDescription>
            You have been successfully logged out of your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for using Polly! You will be redirected to the home page shortly.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              Go to Home Page
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Sign In Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
