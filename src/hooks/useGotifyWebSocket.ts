'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GotifyWebSocket, ReceivedMessage, WebSocketHook } from '@/lib/websocket';

export function useGotifyWebSocket(): WebSocketHook {
  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<GotifyWebSocket | null>(null);

  const handleMessage = useCallback((message: ReceivedMessage) => {
    setMessages(prev => [message, ...prev]);
  }, []);

  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
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

      // First, try to get or create a client token
      let clientToken: string;

      try {
        // Try to get existing clients first
        const clientsResponse = await fetch(`/api/gotify/client?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
        const clients = await clientsResponse.json();

        // Look for existing web client
        const existingClient = clients.find((client: any) =>
          client.name.includes('Gotify Web Client') || client.name.includes('Web Client')
        );

        if (existingClient) {
          clientToken = existingClient.token;
          console.log('Using existing client token');
        } else {
          throw new Error('No existing client found');
        }
      } catch {
        // Create a new client if none exists
        console.log('Creating new client...');
        const createResponse = await fetch('/api/gotify/client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Gotify Web Client',
            username,
            password
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create client');
        }

        const newClient = await createResponse.json();
        clientToken = newClient.token;
        console.log('Created new client token');
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

  useEffect(() => {
    // Auto-connect on mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    messages,
    connectionStatus,
    connect,
    disconnect,
  };
}