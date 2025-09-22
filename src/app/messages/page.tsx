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
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gotify Messages</h1>
            <p className="text-gray-600">Send and receive notifications from your Gotify server</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              {user?.admin && (
                <p className="text-xs text-blue-600">Administrator</p>
              )}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Send Message</h2>
            <MessageForm />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Messages</h2>
            <MessageReceiver />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Connected to: {process.env.NEXT_PUBLIC_GOTIFY_URL}</p>
        </div>
      </div>
    </main>
  );
}