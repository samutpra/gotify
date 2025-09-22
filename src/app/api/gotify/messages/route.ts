import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const limit = searchParams.get('limit') || '50'; // Default to 50 messages

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching messages for user: ${username} from ${GOTIFY_URL}/message`);

    // Fetch messages from Gotify server using basic auth
    const response = await axios.get(`${GOTIFY_URL}/message`, {
      auth: {
        username,
        password,
      },
      params: {
        limit: parseInt(limit),
      },
    });

    console.log('Gotify API response status:', response.status);
    console.log('Gotify API response:', response.data);

    // Gotify returns messages in a specific format, handle both possible structures
    const messages = response.data.messages || response.data || [];

    return NextResponse.json({
      messages: messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Failed to fetch messages from Gotify:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: 'Failed to fetch messages',
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