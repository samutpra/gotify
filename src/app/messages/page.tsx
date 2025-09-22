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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-cyan-500 mx-auto mb-6"></div>
          <p className="text-gray-200 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <main className="h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated red lines background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse delay-1000"></div>
        <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-red-500 to-transparent animate-pulse delay-500"></div>
        <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-red-500 to-transparent animate-pulse delay-1500"></div>

        {/* Moving red line animation */}
        <div className="absolute top-1/2 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse duration-2000"></div>
        <div className="absolute left-1/2 h-full w-px bg-gradient-to-b from-transparent via-red-500/50 to-transparent animate-pulse duration-2000 delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gray-900 border-b border-red-500/30 px-6 py-4 flex justify-between items-center">
        {/* Animated red line under header */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border border-red-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 01-5.28-1.67l-3.72.72.72-3.72C2.03 14.29 3 11.26 3 8c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Gotify Chat</h1>
            <p className="text-sm text-gray-400">Connected to {process.env.NEXT_PUBLIC_GOTIFY_URL}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right bg-gray-800/50 border border-red-500/30 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            {user?.admin && (
              <p className="text-xs text-red-400">Administrator</p>
            )}
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors border border-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <MessageReceiver />
        </div>

        {/* Message Input */}
        <div className="relative border-t border-red-500/30 bg-gray-900">
          {/* Animated red line above input */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
          <MessageForm />
        </div>
      </div>
    </main>
  );
}