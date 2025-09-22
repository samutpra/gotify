import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;

export async function POST(request: NextRequest) {
  try {
    const { name = 'Gotify Web Client', username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Create a client using basic auth
    const response = await axios.post(
      `${GOTIFY_URL}/client`,
      { name },
      {
        auth: {
          username,
          password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Failed to create Gotify client:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Failed to create client',
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get all clients
    const response = await axios.get(`${GOTIFY_URL}/client`, {
      auth: {
        username,
        password,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Failed to get Gotify clients:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Failed to get clients',
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