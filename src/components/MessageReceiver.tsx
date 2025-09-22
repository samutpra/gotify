'use client';

import { useGotifyWebSocket } from '@/hooks/useGotifyWebSocket';
import { ReceivedMessage } from '@/lib/websocket';

function ConnectionStatus({ status }: { status: string }) {
  const statusConfig = {
    connecting: { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Connecting...' },
    connected: { color: 'text-green-600', bg: 'bg-green-100', text: 'Connected' },
    disconnected: { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Disconnected' },
    error: { color: 'text-red-600', bg: 'bg-red-100', text: 'Connection Error' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`} />
      {config.text}
    </div>
  );
}

function MessageItem({ message }: { message: ReceivedMessage }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'border-red-500 bg-red-50';
    if (priority >= 5) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  return (
    <div className={`border-l-4 p-4 mb-3 rounded-r-lg shadow-sm ${getPriorityColor(message.priority)}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{message.title}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            Priority: {message.priority}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(message.date)}
          </span>
        </div>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
    </div>
  );
}

export default function MessageReceiver() {
  const { messages, connectionStatus, connect, disconnect } = useGotifyWebSocket();

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Live Messages</h2>
        <div className="flex items-center space-x-4">
          <ConnectionStatus status={connectionStatus} />
          <div className="space-x-2">
            <button
              onClick={connect}
              disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
              className={`px-4 py-2 rounded-md font-medium text-sm ${
                connectionStatus === 'connected' || connectionStatus === 'connecting'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              Connect
            </button>
            <button
              onClick={disconnect}
              disabled={connectionStatus === 'disconnected'}
              className={`px-4 py-2 rounded-md font-medium text-sm ${
                connectionStatus === 'disconnected'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
              }`}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages received yet.</p>
            {connectionStatus === 'disconnected' && (
              <p className="text-sm mt-2">Click "Connect" to start receiving live messages.</p>
            )}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <MessageItem key={`${message.id}-${message.date}`} message={message} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 border-t pt-4">
        <p>Total messages received: {messages.length}</p>
        <p>WebSocket URL: {process.env.NEXT_PUBLIC_GOTIFY_URL?.replace(/^https?:\/\//, 'ws://')}/stream</p>
      </div>
    </div>
  );
}