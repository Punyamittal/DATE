'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { AiOutlineClose, AiOutlineHeart } from 'react-icons/ai';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PotentialMatch {
  _id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
  gender: string;
}

interface MatchNotification {
  show: boolean;
  userName: string;
  userId: string;
}

const SwipeMatcher: React.FC = () => {
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState('');
  const [matchNotification, setMatchNotification] = useState<MatchNotification>({
    show: false,
    userName: '',
    userId: ''
  });
  
  const fetchPotentialMatches = useCallback(async () => {
    try {
      if (!fetchingMore) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const res = await axios.get(`${API_URL}/users/potential-matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // For a fresh fetch, replace the data
      // For fetching more, append to existing data
      if (fetchingMore && potentialMatches.length > 0) {
        // Filter out duplicates
        const existingIds = new Set(potentialMatches.map(match => match._id));
        const newMatches = res.data.filter((match: PotentialMatch) => !existingIds.has(match._id));
        
        setPotentialMatches(prev => [...prev, ...newMatches]);
      } else {
        setPotentialMatches(res.data);
        setCurrentIndex(0);
      }
    } catch (err: unknown) {
      console.error('Error fetching potential matches:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load potential matches';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [fetchingMore, potentialMatches]);
  
  useEffect(() => {
    fetchPotentialMatches();
  }, [fetchPotentialMatches]);
  
  const handleSwipeLeft = useCallback(async () => {
    if (!potentialMatches[currentIndex]) return;
    
    try {
      const userId = potentialMatches[currentIndex]._id;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.post(`${API_URL}/matches/swipe/left/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Move to next card
      setCurrentIndex(prev => prev + 1);
      setError('');
    } catch (err: unknown) {
      console.error('Swipe left error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to swipe left';
      setError(errorMessage);
    }
  }, [currentIndex, potentialMatches]);
  
  const handleSwipeRight = useCallback(async () => {
    if (!potentialMatches[currentIndex]) return;
    
    try {
      const userId = potentialMatches[currentIndex]._id;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const res = await axios.post(`${API_URL}/matches/swipe/right/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if it's a new match
      if (res.data.isNewMatch) {
        setMatchNotification({
          show: true,
          userName: potentialMatches[currentIndex].name,
          userId: userId
        });
        
        // Auto hide notification after 5 seconds
        setTimeout(() => {
          setMatchNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
      
      // Move to next card
      setCurrentIndex(prev => prev + 1);
      setError('');
    } catch (err: unknown) {
      console.error('Swipe right error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to swipe right';
      setError(errorMessage);
    }
  }, [currentIndex, potentialMatches]);
  
  // Load more profiles when almost at the end
  useEffect(() => {
    if (potentialMatches.length > 0 && currentIndex >= potentialMatches.length - 3 && !fetchingMore) {
      setFetchingMore(true);
      fetchPotentialMatches();
    }
  }, [currentIndex, potentialMatches.length, fetchPotentialMatches, fetchingMore]);
  
  const closeMatchNotification = useCallback(() => {
    setMatchNotification(prev => ({ ...prev, show: false }));
  }, []);
  
  const dismissError = useCallback(() => {
    setError('');
  }, []);
  
  if (loading && potentialMatches.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }
  
  if (potentialMatches.length === 0 || currentIndex >= potentialMatches.length) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold mb-4">No more matches available</h3>
        <p className="text-gray-600 mb-6">We&apos;ve run out of potential matches for you. Check back later!</p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            fetchPotentialMatches();
          }}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }
  
  const currentUser = potentialMatches[currentIndex];
  
  return (
    <div className="relative max-w-md mx-auto h-[70vh]">
      {/* Match notification */}
      {matchNotification.show && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 rounded-xl">
          <div className="bg-white p-6 rounded-xl text-center max-w-xs">
            <div className="mx-auto w-20 h-20 bg-pink-100 rounded-full mb-4 flex items-center justify-center">
              <AiOutlineHeart className="text-pink-500 text-4xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">It&apos;s a Match!</h3>
            <p className="mb-4">You and {matchNotification.userName} have liked each other.</p>
            <button
              onClick={closeMatchNotification}
              className="bg-indigo-600 text-white py-2 px-4 rounded-full hover:bg-indigo-700 w-full"
            >
              Continue Swiping
            </button>
          </div>
        </div>
      )}
      
      {/* Swipe card */}
      <div className="relative w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
        <div className="relative h-4/5 bg-gray-200">
          {currentUser.profilePicture ? (
            <Image 
              src={currentUser.profilePicture} 
              alt={currentUser.name}
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-indigo-100">
              <span className="text-8xl text-indigo-300">{currentUser.name.charAt(0)}</span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold">{currentUser.name}</h3>
            <span className="text-lg capitalize text-gray-500">{currentUser.gender}</span>
          </div>
          
          <p className="text-gray-700 mb-2 line-clamp-2">
            {currentUser.bio || 'No bio available.'}
          </p>
          
          {currentUser.interests && currentUser.interests.length > 0 && (
            <div className="flex flex-wrap">
              {currentUser.interests.slice(0, 3).map((interest, idx) => (
                <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {interest}
                </span>
              ))}
              {currentUser.interests.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">+{currentUser.interests.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Button controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-10">
        <button
          onClick={handleSwipeLeft}
          className="bg-white p-4 rounded-full shadow-lg hover:bg-red-50 transition-colors"
          disabled={loading}
        >
          <AiOutlineClose className="text-red-500 text-3xl" />
        </button>
        
        <button
          onClick={handleSwipeRight}
          className="bg-white p-4 rounded-full shadow-lg hover:bg-green-50 transition-colors"
          disabled={loading}
        >
          <AiOutlineHeart className="text-green-500 text-3xl" />
        </button>
      </div>
      
      {/* Loading indicator when fetching more */}
      {fetchingMore && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-700"></div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-0 right-0 mx-auto max-w-xs bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm text-center">
          {error}
          <button 
            className="absolute top-1 right-1 text-red-500" 
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default SwipeMatcher; 