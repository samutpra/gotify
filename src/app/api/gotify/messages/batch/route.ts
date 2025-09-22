import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOTIFY_URL = process.env.NEXT_PUBLIC_GOTIFY_URL;

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageIds, username, password } = body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log(`Batch deleting ${messageIds.length} messages for user: ${username}`);

    const results = [];
    const errors = [];

    // Delete messages in parallel
    const deletePromises = messageIds.map(async (messageId) => {
      try {
        const response = await axios.delete(`${GOTIFY_URL}/message/${messageId}`, {
          auth: {
            username,
            password,
          },
        });

        return { messageId, success: true, status: response.status };
      } catch (error) {
        console.error(`Failed to delete message ${messageId}:`, error);

        if (axios.isAxiosError(error)) {
          return {
            messageId,
            success: false,
            error: error.response?.status === 404 ? 'Message not found' : 'Delete failed',
            status: error.response?.status || 500
          };
        }

        return {
          messageId,
          success: false,
          error: 'Unknown error',
          status: 500
        };
      }
    });

    const deleteResults = await Promise.all(deletePromises);

    // Separate successful and failed deletions
    const successful = deleteResults.filter(result => result.success);
    const failed = deleteResults.filter(result => !result.success);

    console.log(`Batch delete completed: ${successful.length} successful, ${failed.length} failed`);

    return NextResponse.json({
      success: true,
      deleted: successful.map(r => r.messageId),
      failed: failed.map(r => ({ messageId: r.messageId, error: r.error })),
      summary: {
        total: messageIds.length,
        successful: successful.length,
        failed: failed.length
      }
    });

  } catch (error) {
    console.error('Failed to batch delete messages from Gotify:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}