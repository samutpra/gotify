'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GotifyWebSocket, ReceivedMessage, WebSocketHook } from '@/lib/websocket';
import { deleteMessage as deleteMessageAPI, batchDeleteMessages as batchDeleteMessagesAPI } from '@/lib/gotify';

export function useGotifyWebSocket(): WebSocketHook {
  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const wsRef = useRef<GotifyWebSocket | null>(null);

  const handleMessage = useCallback((message: ReceivedMessage) => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      // Add new messages at the end (bottom) for traditional chat order
      return [...prev, message];
    });
  }, []);

  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
  }, []);

  const loadOldMessages = useCallback(async () => {
    const storedAuth = localStorage.getItem('gotify_auth');
    if (!storedAuth) {
      console.error('No authentication data found');
      return;
    }

    try {
      setIsLoadingHistory(true);
      const authData = JSON.parse(storedAuth);
      const { username, password } = authData.credentials;

      console.log('Loading old messages for user:', username);

      const response = await fetch(`/api/gotify/messages?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&limit=50`);

      console.log('API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);

        let messages = [];

        // Handle different possible response structures
        if (data.messages && Array.isArray(data.messages)) {
          messages = data.messages;
          console.log('Using data.messages array, length:', messages.length);
        } else if (Array.isArray(data)) {
          messages = data;
          console.log('Using data array directly, length:', messages.length);
        } else {
          console.log('Unexpected response structure:', data);
          console.log('Data type:', typeof data);
          console.log('Data keys:', Object.keys(data));
          return;
        }

        console.log(`Found ${messages.length} messages`);

        if (messages.length > 0) {
          // Sort messages by date (oldest first) for traditional chat order
          const sortedMessages = messages
            .sort((a: ReceivedMessage, b: ReceivedMessage) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          console.log('Setting messages:', sortedMessages);
          setMessages(sortedMessages);
          console.log(`Loaded ${sortedMessages.length} old messages`);
        } else {
          console.log('No messages found');
          setMessages([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to load old messages:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading old messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    const url = process.env.NEXT_PUBLIC_GOTIFY_URL;

    if (!url) {
      console.error('Gotify URL not configured');
      setConnectionStatus('error');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Get user credentials from localStorage
      const storedAuth = localStorage.getItem('gotify_auth');
      if (!storedAuth) {
        console.error('No authentication data found');
        setConnectionStatus('error');
        return;
      }

      const authData = JSON.parse(storedAuth);
      const { username, password } = authData.credentials;

      console.log('Connecting WebSocket for user:', username);

      // Get or create a client token
      let clientToken: string;

      try {
        console.log('Checking for existing clients...');

        // Try to get existing clients first
        const clientsResponse = await fetch(`/api/gotify/client?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);

        if (!clientsResponse.ok) {
          throw new Error(`Failed to fetch clients: ${clientsResponse.status}`);
        }

        const clients = await clientsResponse.json();
        console.log('Existing clients:', clients);

        // Look for existing web client
        const existingClient = clients.find((client: any) =>
          client.name && (
            client.name.includes('Gotify Web Client') ||
            client.name.includes('Web Client') ||
            client.name.includes('NextJS') ||
            client.name.includes('Browser')
          )
        );

        if (existingClient && existingClient.token) {
          clientToken = existingClient.token;
          console.log('Using existing client token:', existingClient.name);
        } else {
          console.log('No suitable existing client found, creating new one...');

          // Create a new client
          const createResponse = await fetch('/api/gotify/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Gotify Web Client - ${new Date().toISOString().split('T')[0]}`,
              username,
              password
            }),
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create client: ${createResponse.status} - ${errorText}`);
          }

          const newClient = await createResponse.json();

          if (!newClient.token) {
            throw new Error('Created client but no token received');
          }

          clientToken = newClient.token;
          console.log('Successfully created new client:', newClient.name, 'with token');
        }
      } catch (clientError) {
        console.error('Client management error:', clientError);
        setConnectionStatus('error');
        throw new Error(`Client setup failed: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`);
      }

      wsRef.current = new GotifyWebSocket(url, clientToken, handleMessage, handleStatusChange);
      wsRef.current.connect();
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [handleMessage, handleStatusChange]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await deleteMessageAPI(messageId);

      // Remove the message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, []);

  const batchDeleteMessages = useCallback(async (messageIds: number[]) => {
    try {
      const result = await batchDeleteMessagesAPI(messageIds);

      // Remove successfully deleted messages from local state
      if (result.deleted.length > 0) {
        setMessages(prev => prev.filter(msg => !result.deleted.includes(msg.id)));
      }

      return result;
    } catch (error) {
      console.error('Failed to batch delete messages:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Load old messages first, then auto-connect
    loadOldMessages().then(() => {
      connect();
    });

    return () => {
      disconnect();
    };
  }, [loadOldMessages, connect, disconnect]);

  return {
    messages,
    connectionStatus,
    isLoadingHistory,
    connect,
    disconnect,
    deleteMessage,
    batchDeleteMessages,
  };
}