import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;

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
    const { title, message, priority = 5, requestId, username, password } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
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

    // Get or create user's application token
    let userAppToken: string;

    try {
      // First, try to get existing applications for the user
      const appsResponse = await axios.get(`${GOTIFY_URL}/application`, {
        auth: {
          username,
          password,
        },
      });

      const apps = appsResponse.data;
      console.log(`User ${username} has ${apps.length} applications`);

      // Look for an existing web app
      let existingApp = apps.find((app: any) =>
        app.name && (
          app.name.includes('Web App') ||
          app.name.includes('Web Client') ||
          app.name.includes('Message App')
        )
      );

      if (existingApp && existingApp.token) {
        userAppToken = existingApp.token;
        console.log(`Using existing app token for ${username}: ${existingApp.name}`);
      } else {
        console.log(`Creating new application for ${username}...`);

        // Create a new application
        const createAppResponse = await axios.post(`${GOTIFY_URL}/application`, {
          name: `${username} Web App`,
          description: `Web application for ${username}`,
        }, {
          auth: {
            username,
            password,
          },
        });

        userAppToken = createAppResponse.data.token;
        console.log(`Created new app for ${username}: ${createAppResponse.data.name}`);
      }
    } catch (appError) {
      console.error(`Failed to get/create application for ${username}:`, appError);
      return NextResponse.json(
        { error: 'Failed to setup user application' },
        { status: 500 }
      );
    }

    const messageData = {
      title,
      message,
      priority
    };

    const response = await axios.post(`${GOTIFY_URL}/message`, messageData, {
      headers: {
        'X-Gotify-Key': userAppToken,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log(`Deleting message ${messageId} for user: ${username}`);

    // Delete message from Gotify server using basic auth
    const response = await axios.delete(`${GOTIFY_URL}/message/${messageId}`, {
      auth: {
        username,
        password,
      },
    });

    console.log('Gotify delete response status:', response.status);

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Failed to delete message from Gotify:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error: 'Failed to delete message',
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