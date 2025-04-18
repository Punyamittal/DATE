const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// Send a message to a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const currentUser = req.user;
    const recipientId = req.params.userId;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Check if there's a match between these users and it's accepted
    const match = await Match.findOne({
      $or: [
        { user1: currentUser._id, user2: recipientId },
        { user1: recipientId, user2: currentUser._id }
      ],
      status: 'accepted'
    });
    
    if (!match) {
      return res.status(403).json({ message: 'You can only message users you have matched with' });
    }
    
    // Create a new message
    const newMessage = new Message({
      sender: currentUser._id,
      recipient: recipientId,
      content
    });
    
    await newMessage.save();
    
    // Emit the message to the recipient via socket.io (will be implemented later)
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get conversation with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const otherUserId = req.params.userId;
    
    // Get messages between the two users, ordered by creation time
    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUser._id }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { sender: otherUserId, recipient: currentUser._id, read: false },
      { $set: { read: true } }
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all conversations for the current user
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find all users that the current user has exchanged messages with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUser._id },
            { recipient: currentUser._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUser._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$recipient', currentUser._id] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          userDetails: {
            _id: 1,
            name: 1,
            profilePicture: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;