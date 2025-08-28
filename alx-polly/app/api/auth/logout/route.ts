import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const logoutResponse = {
      success: true,
      message: 'Logged out successfully',
    };
    
    return NextResponse.json(logoutResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
