'use client';

import React, { useState, memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';

interface PotentialMatch {
  _id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
  gender: string;
}

interface SwipeCardProps {
  user: PotentialMatch;
  removeCard: () => void;
  onSwipeLeft: (userId: string) => void;
  onSwipeRight: (userId: string) => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ user, removeCard, onSwipeLeft, onSwipeRight }) => {
  const [swipeComplete, setSwipeComplete] = useState(false);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Status indicators
  const likeOpacity = useTransform(x, [0, 100, 150], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-150, -100, 0], [1, 0.5, 0]);
  
  const dragEndHandler = () => {
    const xVal = x.get();
    
    if (xVal > 150) {
      // Swiped right - like
      setSwipeComplete(true);
      onSwipeRight(user._id);
      removeCard();
    } else if (xVal < -150) {
      // Swiped left - pass
      setSwipeComplete(true);
      onSwipeLeft(user._id);
      removeCard();
    }
  };
  
  return (
    <motion.div
      className="absolute top-0 w-full h-full"
      style={{
        x,
        rotate,
        opacity,
        pointerEvents: swipeComplete ? 'none' : 'auto'
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={dragEndHandler}
    >
      <div className="relative w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
        <div className="relative h-4/5 bg-gray-200">
          {user.profilePicture ? (
            <Image 
              src={user.profilePicture} 
              alt={user.name}
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-indigo-100">
              <span className="text-8xl text-indigo-300">{user.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Like badge */}
          <motion.div
            className="absolute top-10 right-10 bg-green-500 text-white px-6 py-2 rounded-full text-2xl font-bold border-4 border-white transform rotate-12"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          
          {/* Nope badge */}
          <motion.div
            className="absolute top-10 left-10 bg-red-500 text-white px-6 py-2 rounded-full text-2xl font-bold border-4 border-white transform -rotate-12"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>
        </div>
        
        <div className="p-5 h-1/5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <span className="text-lg capitalize text-gray-500">{user.gender}</span>
          </div>
          
          <p className="text-gray-700 line-clamp-2">
            {user.bio || 'No bio available.'}
          </p>
          
          {user.interests && user.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap">
              {user.interests.slice(0, 3).map((interest, idx) => (
                <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                  {interest}
                </span>
              ))}
              {user.interests.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">+{user.interests.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(SwipeCard); 