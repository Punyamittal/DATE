'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import SwipeMatcher from '../components/dashboard/SwipeMatcher';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
        
        {/* Tabs navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discover'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('discover')}
            >
              Discover
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('matches')}
            >
              Matches
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'groups'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('groups')}
            >
              Group Chats
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'random'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('random')}
            >
              Random Chat
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div>
          {activeTab === 'discover' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Find Your Match</h2>
              <SwipeMatcher />
            </div>
          )}
          
          {activeTab === 'matches' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Matches</h2>
              <p className="text-gray-600">Match list will be implemented here</p>
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <p className="text-gray-600">Chat with your matches</p>
            </div>
          )}
          
          {activeTab === 'groups' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Group Chats</h2>
              <p className="text-gray-600">Join group discussions with other users</p>
            </div>
          )}
          
          {activeTab === 'random' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Random Chat</h2>
              <p className="text-gray-600">Chat with random users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 