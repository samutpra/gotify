'use client';

import { useState, useRef, useCallback } from 'react';
import { sendMessage, GotifyMessage } from '@/lib/gotify';

export default function MessageForm() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const submissionInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous submissions
    if (isLoading || submissionInProgress.current) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    submissionInProgress.current = true;
    setIsLoading(true);
    setStatus(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const messageData: GotifyMessage = {
        title: 'Message', // Default title since it's required by Gotify
        message,
        priority: 5, // Default normal priority
      };

      await sendMessage(messageData, abortControllerRef.current.signal);

      // Only update UI if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        setMessage('');
      }
    } catch (error) {
      // Only show error if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to send message'
        });
      }
    } finally {
      submissionInProgress.current = false;
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [message, isLoading]);

  return (
    <div className="relative max-w-4xl mx-auto p-4">
      {/* Animated red line above form */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse"></div>

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <div className="relative flex-1">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={2}
            className="w-full px-4 py-3 border border-red-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm bg-gray-800 placeholder-gray-400 text-gray-200"
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {/* Animated red line inside input */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-pulse delay-500"></div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 border ${
            isLoading || !message.trim()
              ? 'bg-gray-700 cursor-not-allowed text-gray-500 border-gray-600'
              : 'bg-red-900/50 hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 text-red-400 border-red-500/30'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Sending</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm">Send</span>
            </>
          )}
        </button>
      </form>

      {status && (
        <div
          className={`relative mt-3 p-3 rounded-lg text-sm border ${
            status.type === 'success'
              ? 'bg-green-900/50 text-green-400 border-green-500/30'
              : 'bg-red-900/50 text-red-400 border-red-500/30'
          }`}
        >
          {/* Animated line for status */}
          <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${
            status.type === 'success' ? 'via-green-500/50' : 'via-red-500/50'
          } to-transparent animate-pulse`}></div>

          <div className="flex items-center space-x-2">
            {status.type === 'success' ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}