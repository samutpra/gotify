'use client';

import { useGotifyWebSocket } from '@/hooks/useGotifyWebSocket';
import { ReceivedMessage } from '@/lib/websocket';
import { useEffect, useRef, useState } from 'react';

function ConnectionStatus({ status }: { status: string }) {
  const statusConfig = {
    connecting: {
      color: 'text-yellow-400',
      bg: 'bg-gray-800 border border-yellow-500/30',
      text: 'Connecting...',
      dot: 'bg-yellow-500'
    },
    connected: {
      color: 'text-green-400',
      bg: 'bg-gray-800 border border-green-500/30',
      text: 'Connected',
      dot: 'bg-green-500'
    },
    disconnected: {
      color: 'text-gray-400',
      bg: 'bg-gray-800 border border-gray-500/30',
      text: 'Disconnected',
      dot: 'bg-gray-500'
    },
    error: {
      color: 'text-red-400',
      bg: 'bg-gray-800 border border-red-500/30',
      text: 'Error',
      dot: 'bg-red-500'
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${config.color} ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${config.dot} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
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
    <div className={`relative flex items-start space-x-3 p-4 hover:bg-gray-800/50 transition-colors duration-200 ${isSelected ? 'bg-gray-800/70 border-l-2 border-red-500' : ''} my-1 border-b border-gray-800/50`}>
      {/* Animated red line for each message */}
      <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-red-500/30 to-transparent animate-pulse delay-300"></div>

      {/* Selection Checkbox or Avatar */}
      {selectionMode ? (
        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(message.id, e.target.checked)}
            className="w-4 h-4 text-red-500 bg-gray-800 border-red-500/50 rounded focus:ring-red-500 focus:ring-2"
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-red-500/50">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5l-5-5h5v-12" />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-medium text-gray-200 text-sm">Gotify Server</span>
          <span className="text-xs text-gray-500">
            {formatTime(message.date)}
          </span>
        </div>

        {/* Message Bubble - Dark with Red Accent */}
        <div className="relative bg-gray-800 border-l-4 border-red-500 p-3 group hover:bg-gray-700/80 transition-colors duration-200 rounded-r-md">
          {/* Animated red line inside message */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-red-500/50 to-transparent animate-pulse"></div>

          <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed pr-8">{message.message}</p>

          {/* Delete Button - only show when not in selection mode */}
          {!selectionMode && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-red-900/50 text-red-400 hover:text-red-300"
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
    <div className="h-full flex flex-col bg-black">
      {/* Chat Header */}
      <div className="relative flex justify-between items-center p-6 border-b border-red-500/30 bg-gray-900">
        {/* Animated red line under header */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>

        <div className="flex items-center space-x-4">
          <ConnectionStatus status={connectionStatus} />
          <span className="text-sm text-gray-200 font-medium bg-gray-800 border border-red-500/30 px-3 py-1 rounded-md">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          {isLoadingHistory && (
            <span className="text-xs text-yellow-400 bg-gray-800 border border-yellow-500/30 px-3 py-1 rounded-md animate-pulse">Loading...</span>
          )}
          {selectionMode && (
            <span className="text-xs text-red-400 bg-gray-800 border border-red-500/30 px-3 py-1 rounded-md">
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
                    className="px-3 py-1 text-xs bg-gray-800 text-red-400 rounded hover:bg-gray-700 transition-colors font-medium border border-red-500/30"
                  >
                    {selectedMessages.size === messages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedMessages.size > 0 && (
                    <button
                      onClick={handleBatchDelete}
                      disabled={isDeleting}
                      className="px-3 py-1 text-xs bg-red-900/50 text-red-400 rounded hover:bg-red-800/50 disabled:opacity-50 transition-colors font-medium flex items-center space-x-1 border border-red-500/30"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
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
                    className="px-3 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors font-medium border border-gray-500/30"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="px-3 py-1 text-xs bg-gray-800 text-red-400 rounded hover:bg-gray-700 transition-colors font-medium flex items-center space-x-1 border border-red-500/30"
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
              className="px-4 py-2 bg-green-900/50 text-green-400 rounded hover:bg-green-800/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors font-medium border border-green-500/30"
            >
              Connect
            </button>
          )}
          {connectionStatus === 'connected' && (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-900/50 text-red-400 rounded hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors font-medium border border-red-500/30"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto bg-black">
        {/* Animated red lines in messages area */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse delay-500"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse delay-1500"></div>
        </div>

        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-200 p-8">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin mb-6"></div>
            <p className="text-xl font-medium mb-3 text-gray-200">Loading message history...</p>
            <p className="text-sm text-center text-gray-500 bg-gray-800 border border-red-500/30 px-4 py-2 rounded-md">Fetching your previous messages</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-200 p-8">
            <div className="w-20 h-20 bg-gray-800 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 01-5.28-1.67l-3.72.72.72-3.72C2.03 14.29 3 11.26 3 8c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xl font-medium mb-3 text-gray-200">No messages yet</p>
            <p className="text-sm text-center text-gray-500 bg-gray-800 border border-red-500/30 px-6 py-3 rounded-md max-w-md">
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
          <div className="space-y-1 p-2">
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