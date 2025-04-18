const express = require('express');
const router = express.Router();
const RandomChat = require('../models/RandomChat');
const RandomMessage = require('../models/RandomMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Queue for users waiting for a random chat
let waitingUsers = [];

// Join random chat queue
router.post('/queue', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Check if user is already in the queue
    if (waitingUsers.some(u => u.userId.toString() === currentUser._id.toString())) {
      return res.status(400).json({ message: 'You are already in the queue' });
    }
    
    // Check if user already has an active random chat
    const existingChat = await RandomChat.findOne({
      participants: currentUser._id,
      status: 'active'
    });
    
    if (existingChat) {
      return res.status(400).json({ message: 'You already have an active random chat' });
    }
    
    // Add user to waiting queue with preferences
    waitingUsers.push({
      userId: currentUser._id,
      gender: currentUser.gender,
      joinedAt: new Date()
    });
    
    res.json({ message: 'Added to random chat queue', queuePosition: waitingUsers.length });
  } catch (error) {
    console.error('Join random chat queue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave random chat queue
router.delete('/queue', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Remove user from waiting queue
    waitingUsers = waitingUsers.filter(u => u.userId.toString() !== currentUser._id.toString());
    
    res.json({ message: 'Removed from random chat queue' });
  } catch (error) {
    console.error('Leave random chat queue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get queue status
router.get('/queue/status', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Check if user is in the queue
    const queuePosition = waitingUsers.findIndex(u => u.userId.toString() === currentUser._id.toString());
    
    if (queuePosition === -1) {
      return res.json({ inQueue: false });
    }
    
    res.json({
      inQueue: true,
      queuePosition: queuePosition + 1,
      queueLength: waitingUsers.length,
      waitTime: waitingUsers.length * 5 // Estimated wait time in seconds
    });
  } catch (error) {
    console.error('Check queue status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Match users in queue
router.post('/match', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Check if user is in the queue
    const userIndex = waitingUsers.findIndex(u => u.userId.toString() === currentUser._id.toString());
    
    if (userIndex === -1) {
      return res.status(400).json({ message: 'You are not in the queue' });
    }
    
    // Remove current user from queue
    const currentUserData = waitingUsers.splice(userIndex, 1)[0];
    
    // Find a match (opposite gender if possible)
    let matchIndex = -1;
    
    // First try to match with opposite gender
    if (currentUserData.gender === 'male') {
      matchIndex = waitingUsers.findIndex(u => u.gender === 'female');
    } else if (currentUserData.gender === 'female') {
      matchIndex = waitingUsers.findIndex(u => u.gender === 'male');
    }
    
    // If no opposite gender match, match with anyone
    if (matchIndex === -1) {
      matchIndex = 0; // Just take the first waiting user
    }
    
    // If no one else is in the queue
    if (matchIndex === -1 || waitingUsers.length === 0) {
      // Put the user back in queue
      waitingUsers.push(currentUserData);
      return res.status(404).json({ message: 'No matches available. Please try again later.' });
    }
    
    // Remove matched user from queue
    const matchedUserData = waitingUsers.splice(matchIndex, 1)[0];
    
    // Create a new random chat
    const newRandomChat = new RandomChat({
      participants: [currentUserData.userId, matchedUserData.userId],
      status: 'active'
    });
    
    await newRandomChat.save();
    
    // Populate participants for the response
    const populatedChat = await RandomChat.findById(newRandomChat._id)
      .populate('participants', 'name gender');
    
    res.status(201).json({
      message: 'Match found!',
      chat: populatedChat
    });
  } catch (error) {
    console.error('Match random chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active random chat
router.get('/active', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find active random chat
    const activeChat = await RandomChat.findOne({
      participants: currentUser._id,
      status: 'active'
    }).populate('participants', 'name gender profilePicture');
    
    if (!activeChat) {
      return res.status(404).json({ message: 'No active random chat found' });
    }
    
    res.json(activeChat);
  } catch (error) {
    console.error('Get active random chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End random chat
router.put('/:chatId/end', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { chatId } = req.params;
    
    // Find the chat
    const randomChat = await RandomChat.findById(chatId);
    
    if (!randomChat) {
      return res.status(404).json({ message: 'Random chat not found' });
    }
    
    // Check if user is a participant
    if (!randomChat.participants.some(p => p.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    
    // End the chat
    randomChat.status = 'ended';
    randomChat.endedAt = new Date();
    await randomChat.save();
    
    res.json({ message: 'Random chat ended' });
  } catch (error) {
    console.error('End random chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message in random chat
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { chatId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Find the chat
    const randomChat = await RandomChat.findById(chatId);
    
    if (!randomChat) {
      return res.status(404).json({ message: 'Random chat not found' });
    }
    
    // Check if chat is active
    if (randomChat.status !== 'active') {
      return res.status(400).json({ message: 'This chat has ended' });
    }
    
    // Check if user is a participant
    if (!randomChat.participants.some(p => p.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    
    // Create new message
    const newMessage = new RandomMessage({
      chatId,
      sender: currentUser._id,
      content
    });
    
    await newMessage.save();
    
    // Populate sender info
    const populatedMessage = await RandomMessage.findById(newMessage._id)
      .populate('sender', 'name');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send random chat message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a random chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { chatId } = req.params;
    
    // Find the chat
    const randomChat = await RandomChat.findById(chatId);
    
    if (!randomChat) {
      return res.status(404).json({ message: 'Random chat not found' });
    }
    
    // Check if user is a participant
    if (!randomChat.participants.some(p => p.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    
    // Get messages
    const messages = await RandomMessage.find({ chatId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    
    // Mark messages as read
    await RandomMessage.updateMany(
      { chatId, sender: { $ne: currentUser._id }, read: false },
      { $set: { read: true } }
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get random chat messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 