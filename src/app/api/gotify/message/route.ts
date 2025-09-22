import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;
const APP_TOKEN = process.env.NEXT_PUBLIC_GOTIFY_TOKEN;

// Simple in-memory cache to prevent duplicate requests
const recentRequests = new Map<string, number>();
const CACHE_DURATION = 5000; // 5 seconds

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      recentRequests.delete(key);
    }
  }
}, 10000); // Clean every 10 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, priority = 5, requestId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Check for duplicate request
    if (requestId) {
      const now = Date.now();
      const lastRequest = recentRequests.get(requestId);

      if (lastRequest && (now - lastRequest) < CACHE_DURATION) {
        return NextResponse.json(
          { error: 'Duplicate request detected' },
          { status: 409 }
        );
      }

      recentRequests.set(requestId, now);
    }

    const messageData = {
      title,
      message,
      priority
    };

    const response = await axios.post(`${GOTIFY_URL}/message`, messageData, {
      headers: {
        'X-Gotify-Key': APP_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Failed to send message to Gotify:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Failed to send message',
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