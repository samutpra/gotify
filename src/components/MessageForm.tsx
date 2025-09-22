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
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            isLoading || !message.trim()
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          className={`mt-3 p-2 rounded-lg text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}