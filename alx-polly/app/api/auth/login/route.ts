import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication (accept any email/password for demo)
    const mockUser = {
      id: 'user-123',
      email: body.email,
      username: body.email.split('@')[0],
      firstName: 'Demo',
      lastName: 'User',
    };
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    const loginResponse = {
      success: true,
      message: 'Login successful',
      user: mockUser,
      token: mockToken,
    };
    
    return NextResponse.json(loginResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
