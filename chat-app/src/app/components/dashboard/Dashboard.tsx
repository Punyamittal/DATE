'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PotentialMatch {
  _id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
  gender: string;
}

interface UserMatch {
  matchId: string;
  status: string;
  isInitiator: boolean;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
    bio?: string;
    interests?: string[];
    gender: string;
  };
  createdAt: string;
}

const Dashboard = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [userMatches, setUserMatches] = useState<UserMatch[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchPotentialMatches();
      fetchUserMatches();
    }
  }, [isAuthenticated]);
  
  const fetchPotentialMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await axios.get(`${API_URL}/users/potential-matches`);
      setPotentialMatches(res.data);
      setLoadingMatches(false);
    } catch (err: any) {
      console.error('Error fetching potential matches:', err);
      setError(err.response?.data?.message || 'Failed to load potential matches');
      setLoadingMatches(false);
    }
  };
  
  const fetchUserMatches = async () => {
    try {
      const res = await axios.get(`${API_URL}/matches`);
      setUserMatches(res.data);
    } catch (err: any) {
      console.error('Error fetching user matches:', err);
    }
  };
  
  const createMatch = async (userId: string) => {
    try {
      await axios.post(`${API_URL}/matches/${userId}`);
      
      // Remove the matched user from potential matches
      setPotentialMatches(prev => prev.filter(match => match._id !== userId));
      
      // Refresh user matches
      fetchUserMatches();
    } catch (err: any) {
      console.error('Error creating match:', err);
      setError(err.response?.data?.message || 'Failed to create match');
    }
  };
  
  const respondToMatch = async (matchId: string, status: 'accepted' | 'rejected') => {
    try {
      await axios.put(`${API_URL}/matches/${matchId}`, { status });
      
      // Update local match status
      setUserMatches(prev => 
        prev.map(match => 
          match.matchId === matchId ? { ...match, status } : match
        )
      );
    } catch (err: any) {
      console.error('Error responding to match:', err);
      setError(err.response?.data?.message || 'Failed to respond to match');
    }
  };
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">VIT Dating App</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.name}</span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="max-w-7xl mx-auto mt-6 px-4">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 ${activeTab === 'discover' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'matches' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto mt-6 px-4 pb-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <button className="absolute top-0 right-0 mt-2 mr-2" onClick={() => setError('')}>
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}
        
        {activeTab === 'discover' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Discover Potential Matches</h2>
            
            {loadingMatches ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
              </div>
            ) : potentialMatches.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600">No potential matches found at the moment. Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {potentialMatches.map((match) => (
                  <div key={match._id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-48 bg-gray-200 relative">
                      {match.profilePicture ? (
                        <Image 
                          src={match.profilePicture} 
                          alt={match.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-indigo-100">
                          <span className="text-5xl text-indigo-300">{match.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{match.name}</h3>
                        <span className="text-sm text-gray-500 capitalize">{match.gender}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {match.bio || 'No bio available.'}
                      </p>
                      {match.interests && match.interests.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.interests.map((interest, idx) => (
                              <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => createMatch(match._id)}
                        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
                      >
                        Like
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'matches' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Matches</h2>
            
            {userMatches.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600">You don't have any matches yet. Start by liking profiles in the Discover tab!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userMatches.map((match) => (
                  <div key={match.matchId} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-48 bg-gray-200 relative">
                      {match.user.profilePicture ? (
                        <Image 
                          src={match.user.profilePicture} 
                          alt={match.user.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-indigo-100">
                          <span className="text-5xl text-indigo-300">{match.user.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{match.user.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          match.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          match.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {match.user.bio || 'No bio available.'}
                      </p>
                      {match.user.interests && match.user.interests.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.user.interests.map((interest, idx) => (
                              <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {!match.isInitiator && match.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => respondToMatch(match.matchId, 'accepted')}
                            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => respondToMatch(match.matchId, 'rejected')}
                            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {match.status === 'accepted' && (
                        <button
                          onClick={() => router.push(`/messages/${match.user.id}`)}
                          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors mt-2"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{user?.gender}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Looking For</p>
                  <p className="font-medium capitalize">
                    {user?.lookingFor === 'both' ? 'Men & Women' : 
                      user?.lookingFor === 'male' ? 'Men' : 
                      user?.lookingFor === 'female' ? 'Women' : 'Other'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="font-medium">{user?.bio || 'No bio yet'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Interests</p>
                  {user?.interests && user.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.interests.map((interest, idx) => (
                        <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">No interests added yet</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 