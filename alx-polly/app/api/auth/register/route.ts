import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/register - User registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.email || !body.password || !body.username) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock user creation
    const mockUser = {
      id: 'user-' + Date.now(),
      email: body.email,
      username: body.username,
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      createdAt: new Date().toISOString(),
    };
    
    const registerResponse = {
      success: true,
      message: 'Account created successfully',
      user: mockUser,
    };
    
    return NextResponse.json(registerResponse, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
