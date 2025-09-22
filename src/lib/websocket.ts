export interface ReceivedMessage {
  id: number;
  appid: number;
  message: string;
  title: string;
  priority: number;
  date: string;
}

export interface WebSocketHook {
  messages: ReceivedMessage[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isLoadingHistory: boolean;
  connect: () => void;
  disconnect: () => void;
  deleteMessage: (messageId: number) => Promise<void>;
  batchDeleteMessages: (messageIds: number[]) => Promise<{ deleted: number[]; failed: any[] }>;
}

export class GotifyWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private onMessage: (message: ReceivedMessage) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    url: string,
    token: string,
    onMessage: (message: ReceivedMessage) => void,
    onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ) {
    this.url = url;
    this.token = token;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.onStatusChange('connecting');

    // Convert HTTP URL to WebSocket URL - Gotify uses client token for WebSocket
    let wsUrl = this.url.replace(/^https?:\/\//, 'ws://');

    // For Gotify WebSocket, we need to use the client token, not app token
    // The URL format should be: ws://host:port/stream?token=CLIENT_TOKEN
    // Since we only have app token, let's try different approaches
    wsUrl += `/stream?token=${this.token}`;

    console.log('Attempting WebSocket connection to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.onStatusChange('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ReceivedMessage = JSON.parse(event.data);
          this.onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.onStatusChange('disconnected');

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onStatusChange('error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onStatusChange('error');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChange('disconnected');
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}