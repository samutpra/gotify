import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials by trying to get user info
    try {
      const response = await axios.get(`${GOTIFY_URL}/current/user`, {
        auth: {
          username,
          password,
        },
      });

      // If successful, return user info (without password)
      return NextResponse.json({
        success: true,
        user: {
          id: response.data.id,
          name: response.data.name,
          admin: response.data.admin,
        },
        credentials: {
          username,
          password, // In production, you'd want to handle this more securely
        }
      });
    } catch (authError) {
      if (axios.isAxiosError(authError) && authError.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
      throw authError;
    }
  } catch (error) {
    console.error('Login error:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: error.response?.data || error.message
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}