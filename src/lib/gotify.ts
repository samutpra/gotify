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
    // Get user credentials from localStorage
    const storedAuth = localStorage.getItem('gotify_auth');
    if (!storedAuth) {
      throw new Error('No authentication data found');
    }

    const authData = JSON.parse(storedAuth);
    const { username, password } = authData.credentials;

    // Add unique request ID to prevent duplicates
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const response = await axios.post('/api/gotify/message', {
      title: messageData.title,
      message: messageData.message,
      priority: messageData.priority || 5,
      requestId, // Include request ID
      username,
      password,
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

export async function deleteMessage(messageId: number): Promise<void> {
  try {
    // Get user credentials from localStorage
    const storedAuth = localStorage.getItem('gotify_auth');
    if (!storedAuth) {
      throw new Error('No authentication data found');
    }

    const authData = JSON.parse(storedAuth);
    const { username, password } = authData.credentials;

    const response = await axios.delete(`/api/gotify/message?id=${messageId}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);

    if (!response.data.success) {
      throw new Error('Failed to delete message');
    }
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
}

export interface BatchDeleteResult {
  deleted: number[];
  failed: { messageId: number; error: string }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function batchDeleteMessages(messageIds: number[]): Promise<BatchDeleteResult> {
  try {
    // Get user credentials from localStorage
    const storedAuth = localStorage.getItem('gotify_auth');
    if (!storedAuth) {
      throw new Error('No authentication data found');
    }

    const authData = JSON.parse(storedAuth);
    const { username, password } = authData.credentials;

    const response = await axios.delete('/api/gotify/messages/batch', {
      data: {
        messageIds,
        username,
        password,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to batch delete messages:', error);
    throw error;
  }
}

// Note: getApplications and getMessages would need similar proxy routes
// if needed in the future due to CORS restrictions