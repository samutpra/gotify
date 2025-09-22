'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MessageForm from '@/components/MessageForm';
import MessageReceiver from '@/components/MessageReceiver';

export default function MessagesPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <main className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 01-5.28-1.67l-3.72.72.72-3.72C2.03 14.29 3 11.26 3 8c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gotify Chat</h1>
            <p className="text-sm text-gray-500">Connected to {process.env.NEXT_PUBLIC_GOTIFY_URL}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            {user?.admin && (
              <p className="text-xs text-blue-600">Administrator</p>
            )}
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <MessageReceiver />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <MessageForm />
        </div>
      </div>
    </main>
  );
}