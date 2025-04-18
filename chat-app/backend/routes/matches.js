const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Swipe right (like) on a user
router.post('/swipe/right/:userId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId;
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if there's already a match where current user is user2
    const existingMatchAsUser2 = await Match.findOne({
      user1: targetUserId,
      user2: currentUser._id
    });
    
    if (existingMatchAsUser2) {
      // Other user already swiped right on current user
      existingMatchAsUser2.user2SwipedRight = true;
      
      // If both users swiped right, it's a match!
      if (existingMatchAsUser2.user1SwipedRight) {
        existingMatchAsUser2.status = 'accepted';
      }
      
      await existingMatchAsUser2.save();
      
      return res.status(200).json({
        match: existingMatchAsUser2,
        isNewMatch: existingMatchAsUser2.status === 'accepted'
      });
    }
    
    // Check if there's already a match where current user is user1
    const existingMatchAsUser1 = await Match.findOne({
      user1: currentUser._id,
      user2: targetUserId
    });
    
    if (existingMatchAsUser1) {
      // Current user already swiped on this user before
      return res.status(400).json({ message: 'You already swiped on this user' });
    }
    
    // Create a new pending match
    const newMatch = new Match({
      user1: currentUser._id,
      user2: targetUserId,
      user1SwipedRight: true,
      status: 'pending'
    });
    
    await newMatch.save();
    
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Swipe right error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Swipe left (pass) on a user
router.post('/swipe/left/:userId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId;
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if there's already a match where current user is user2
    const existingMatchAsUser2 = await Match.findOne({
      user1: targetUserId,
      user2: currentUser._id
    });
    
    if (existingMatchAsUser2) {
      // Other user already swiped right, but current user swiped left
      existingMatchAsUser2.user2SwipedRight = false;
      existingMatchAsUser2.status = 'rejected';
      await existingMatchAsUser2.save();
      
      return res.status(200).json({ match: existingMatchAsUser2 });
    }
    
    // Check if there's already a match where current user is user1
    const existingMatchAsUser1 = await Match.findOne({
      user1: currentUser._id,
      user2: targetUserId
    });
    
    if (existingMatchAsUser1) {
      // Current user already swiped on this user before
      return res.status(400).json({ message: 'You already swiped on this user' });
    }
    
    // Create a new rejected match
    const newMatch = new Match({
      user1: currentUser._id,
      user2: targetUserId,
      user1SwipedRight: false,
      status: 'rejected'
    });
    
    await newMatch.save();
    
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Swipe left error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new match request (legacy/backward compatibility)
router.post('/:userId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId;
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if there's already a match between these users
    const existingMatch = await Match.findOne({
      $or: [
        { user1: currentUser._id, user2: targetUserId },
        { user1: targetUserId, user2: currentUser._id }
      ]
    });
    
    if (existingMatch) {
      return res.status(400).json({ message: 'Match already exists between these users' });
    }
    
    // Create a new match
    const newMatch = new Match({
      user1: currentUser._id,
      user2: targetUserId,
      status: 'pending',
      user1SwipedRight: true
    });
    
    await newMatch.save();
    
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to a match request (accept/reject)
router.put('/:matchId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const currentUser = req.user;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }
    
    // Find the match
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if the current user is the recipient of the match request
    if (match.user2.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this match' });
    }
    
    // Update match status and swipe
    match.status = status;
    match.user2SwipedRight = status === 'accepted';
    await match.save();
    
    res.json(match);
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all matches for the current user
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find all matches where the current user is involved
    const matches = await Match.find({
      $or: [
        { user1: currentUser._id },
        { user2: currentUser._id }
      ]
    }).populate('user1 user2', '-password -verificationToken -verificationTokenExpires');
    
    // Format matches for the client
    const formattedMatches = matches.map(match => {
      const isInitiator = match.user1._id.toString() === currentUser._id.toString();
      const otherUser = isInitiator ? match.user2 : match.user1;
      
      return {
        matchId: match._id,
        status: match.status,
        createdAt: match.createdAt,
        isInitiator,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          profilePicture: otherUser.profilePicture,
          bio: otherUser.bio,
          interests: otherUser.interests,
          gender: otherUser.gender
        },
        // Include swipe info
        userSwipedRight: isInitiator ? match.user1SwipedRight : match.user2SwipedRight,
        otherUserSwipedRight: isInitiator ? match.user2SwipedRight : match.user1SwipedRight
      };
    });
    
    res.json(formattedMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get match details
router.get('/:matchId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find the match
    const match = await Match.findById(req.params.matchId)
      .populate('user1 user2', '-password -verificationToken -verificationTokenExpires');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if the current user is part of this match
    if (match.user1._id.toString() !== currentUser._id.toString() && 
        match.user2._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this match' });
    }
    
    const isInitiator = match.user1._id.toString() === currentUser._id.toString();
    const otherUser = isInitiator ? match.user2 : match.user1;
    
    const matchDetails = {
      matchId: match._id,
      status: match.status,
      createdAt: match.createdAt,
      isInitiator,
      user: {
        id: otherUser._id,
        name: otherUser.name,
        profilePicture: otherUser.profilePicture,
        bio: otherUser.bio,
        interests: otherUser.interests,
        gender: otherUser.gender
      },
      // Include swipe info
      userSwipedRight: isInitiator ? match.user1SwipedRight : match.user2SwipedRight,
      otherUserSwipedRight: isInitiator ? match.user2SwipedRight : match.user1SwipedRight
    };
    
    res.json(matchDetails);
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;