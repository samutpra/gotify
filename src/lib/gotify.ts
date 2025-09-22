import axios from 'axios';

export interface GotifyMessage {
  title: string;
  message: string;
  priority?: number;
}

export interface GotifyResponse {
  id: number;
  appid: number;
  message: string;
  title: string;
  priority: number;
  date: string;
}

export async function sendMessage(messageData: GotifyMessage, signal?: AbortSignal): Promise<GotifyResponse> {
  try {
    // Add unique request ID to prevent duplicates
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const response = await axios.post('/api/gotify/message', {
      title: messageData.title,
      message: messageData.message,
      priority: messageData.priority || 5,
      requestId, // Include request ID
    }, {
      signal, // Pass abort signal
    });

    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('Request cancelled');
    }
    console.error('Failed to send message:', error);
    throw error;
  }
}

// Note: getApplications and getMessages would need similar proxy routes
// if needed in the future due to CORS restrictions