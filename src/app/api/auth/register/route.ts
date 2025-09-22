import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;
const ADMIN_USERNAME = process.env.GOTIFY_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.GOTIFY_ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin credentials not configured on server' },
        { status: 500 }
      );
    }

    // Create new user using admin credentials
    try {
      const response = await axios.post(
        `${GOTIFY_URL}/user`,
        {
          name: username,
          pass: password,
          admin: false, // New users are not admin by default
        },
        {
          auth: {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Return success without sensitive data
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: response.data.id,
          name: response.data.name,
          admin: response.data.admin,
        }
      });
    } catch (authError) {
      if (axios.isAxiosError(authError)) {
        if (authError.response?.status === 401) {
          return NextResponse.json(
            { error: 'Invalid admin credentials' },
            { status: 401 }
          );
        }
        if (authError.response?.status === 400) {
          const errorMsg = authError.response.data?.error || 'User creation failed';
          return NextResponse.json(
            { error: errorMsg },
            { status: 400 }
          );
        }
      }
      throw authError;
    }
  } catch (error) {
    console.error('Registration error:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Registration failed',
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