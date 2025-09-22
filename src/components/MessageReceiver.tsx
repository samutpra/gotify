'use client';

import { useGotifyWebSocket } from '@/hooks/useGotifyWebSocket';
import { ReceivedMessage } from '@/lib/websocket';
import { useEffect, useRef, useState } from 'react';

function ConnectionStatus({ status }: { status: string }) {
  const statusConfig = {
    connecting: { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Setting up connection...' },
    connected: { color: 'text-green-600', bg: 'bg-green-100', text: 'Connected' },
    disconnected: { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Disconnected' },
    error: { color: 'text-red-600', bg: 'bg-red-100', text: 'Connection Error' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-gray-500'}`} />
      {config.text}
    </div>
  );
}

function MessageItem({
  message,
  onDelete,
  isSelected,
  onSelect,
  selectionMode
}: {
  message: ReceivedMessage;
  onDelete: (messageId: number) => void;
  isSelected: boolean;
  onSelect: (messageId: number, selected: boolean) => void;
  selectionMode: boolean;
}) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


  return (
    <div className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
      {/* Selection Checkbox or Avatar */}
      {selectionMode ? (
        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(message.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5l-5-5h5v-12" />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">Gotify Server</span>
          <span className="text-xs text-gray-500">
            {formatTime(message.date)}
          </span>
        </div>

        {/* Message Bubble */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 group relative">
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed pr-8">{message.message}</p>

          {/* Delete Button - only show when not in selection mode */}
          {!selectionMode && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700"
              title="Delete message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageReceiver() {
  const { messages, connectionStatus, isLoadingHistory, connect, disconnect, deleteMessage, batchDeleteMessages } = useGotifyWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('MessageReceiver render:', {
    messagesCount: messages.length,
    connectionStatus,
    isLoadingHistory,
    firstMessage: messages[0]
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingHistory) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingHistory]);

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Could add toast notification here
    }
  };

  const handleSelectMessage = (messageId: number, selected: boolean) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      // Deselect all
      setSelectedMessages(new Set());
    } else {
      // Select all
      setSelectedMessages(new Set(messages.map(m => m.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedMessages.size === 0) return;

    try {
      setIsDeleting(true);
      const messageIds = Array.from(selectedMessages);
      const result = await batchDeleteMessages(messageIds);

      console.log(`Batch delete completed: ${result.deleted.length} deleted, ${result.failed.length} failed`);

      // Clear selection and exit selection mode
      setSelectedMessages(new Set());
      setSelectionMode(false);

      // Show summary if there were failures
      if (result.failed.length > 0) {
        console.warn(`Some messages could not be deleted:`, result.failed);
      }
    } catch (error) {
      console.error('Failed to batch delete messages:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMessages(new Set()); // Clear selection when toggling
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <ConnectionStatus status={connectionStatus} />
          <span className="text-sm text-gray-600">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          {isLoadingHistory && (
            <span className="text-xs text-blue-600">Loading...</span>
          )}
          {selectionMode && (
            <span className="text-xs text-blue-600">
              {selectedMessages.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Batch Actions */}
          {messages.length > 0 && (
            <>
              {selectionMode ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {selectedMessages.size === messages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedMessages.size > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center space-x-1"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete ({selectedMessages.size})</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={toggleSelectionMode}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Select</span>
                </button>
              )}
            </>
          )}

          {/* Connection Controls */}
          {connectionStatus === 'disconnected' && (
            <button
              onClick={connect}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors"
            >
              Connect
            </button>
          )}
          {connectionStatus === 'connected' && (
            <button
              onClick={disconnect}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium mb-2">Loading message history...</p>
            <p className="text-sm text-center">Fetching your previous messages</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 01-5.28-1.67l-3.72.72.72-3.72C2.03 14.29 3 11.26 3 8c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm text-center">
              {connectionStatus === 'disconnected'
                ? 'Click connect to start receiving live messages'
                : connectionStatus === 'connecting'
                ? 'Setting up client connection and WebSocket...'
                : connectionStatus === 'error'
                ? 'Connection failed. Check console for details.'
                : 'Messages will appear here when received'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <MessageItem
                key={`${message.id}-${message.date}`}
                message={message}
                onDelete={handleDeleteMessage}
                isSelected={selectedMessages.has(message.id)}
                onSelect={handleSelectMessage}
                selectionMode={selectionMode}
              />
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}