'use client';

import { useState, useRef, useCallback } from 'react';
import { sendMessage, GotifyMessage } from '@/lib/gotify';

export default function MessageForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(5);
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
        title,
        message,
        priority,
      };

      await sendMessage(messageData, abortControllerRef.current.signal);

      // Only update UI if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        setTitle('');
        setMessage('');
        setPriority(5);
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
  }, [title, message, priority, isLoading]);

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Send Gotify Message</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter message title"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your message"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority (1-10)
          </label>
          <input
            id="priority"
            type="number"
            min="1"
            max="10"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } text-white transition-colors`}
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {status && (
        <div
          className={`mt-4 p-3 rounded-md ${
            status.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}