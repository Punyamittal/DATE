const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, interests, profilePicture, lookingFor } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (bio) updates.bio = bio;
    if (interests) updates.interests = interests;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (lookingFor) updates.lookingFor = lookingFor;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password -verificationToken -verificationTokenExpires');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get potential matches (strictly male-female matching)
router.get('/potential-matches', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // If user is male, show only females, and vice versa
    let genderFilter;
    if (currentUser.gender === 'male') {
      genderFilter = 'female';
    } else if (currentUser.gender === 'female') {
      genderFilter = 'male';
    } else {
      // For 'other' gender, use their lookingFor preference
      genderFilter = currentUser.lookingFor === 'both' ? 
        { $in: ['male', 'female', 'other'] } : currentUser.lookingFor;
    }
    
    // Find users of the opposite gender
    const potentialMatches = await User.find({
      _id: { $ne: currentUser._id },
      isVerified: true,
      gender: genderFilter,
      $or: [
        { lookingFor: currentUser.gender },
        { lookingFor: 'both' }
      ]
    }).select('-password -verificationToken -verificationTokenExpires');
    
    // Get existing matches to filter out
    const existingMatches = await Match.find({
      $or: [
        { user1: currentUser._id },
        { user2: currentUser._id }
      ]
    });
    
    // Filter out users that already have a match with the current user
    const matchedUserIds = existingMatches.map(match => {
      return match.user1.toString() === currentUser._id.toString() ? match.user2.toString() : match.user1.toString();
    });
    
    const filteredMatches = potentialMatches.filter(user => !matchedUserIds.includes(user._id.toString()));
    
    res.json(filteredMatches);
  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search for users
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUser = req.user;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for users by name or interests
    const users = await User.find({
      _id: { $ne: currentUser._id },
      isVerified: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { interests: { $in: [new RegExp(query, 'i')] } }
      ]
    }).select('-password -verificationToken -verificationTokenExpires');
    
    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific user profile (for viewing matches)
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -verificationToken -verificationTokenExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 