const express = require('express');
const router = express.Router();
const GroupChat = require('../models/GroupChat');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new group chat
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPublic, members } = req.body;
    const currentUser = req.user;
    
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    // Create member array with the creator
    let groupMembers = [currentUser._id];
    
    // Add other members if provided
    if (members && Array.isArray(members) && members.length > 0) {
      // Validate members exist
      const existingMembers = await User.find({
        _id: { $in: members },
        isVerified: true
      });
      
      const validMemberIds = existingMembers.map(m => m._id.toString());
      
      // Add valid members to the group
      groupMembers = [...new Set([...groupMembers, ...validMemberIds])];
    }
    
    const newGroupChat = new GroupChat({
      name,
      description: description || '',
      creator: currentUser._id,
      members: groupMembers,
      isPublic: isPublic === undefined ? true : isPublic
    });
    
    await newGroupChat.save();
    
    // Populate creator and members for response
    const populatedGroup = await GroupChat.findById(newGroupChat._id)
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');
    
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all group chats for current user
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find all groups where the user is a member
    const userGroups = await GroupChat.find({
      members: currentUser._id
    })
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(userGroups);
  } catch (error) {
    console.error('Get group chats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get public group chats (for discovery)
router.get('/discover', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Find public groups where the user is NOT a member
    const publicGroups = await GroupChat.find({
      isPublic: true,
      members: { $ne: currentUser._id }
    })
      .populate('creator', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(publicGroups);
  } catch (error) {
    console.error('Discover group chats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific group chat
router.get('/:groupId', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { groupId } = req.params;
    
    const groupChat = await GroupChat.findById(groupId)
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');
    
    if (!groupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    // Check if user is a member of this group
    if (!groupChat.members.some(member => member._id.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    
    res.json(groupChat);
  } catch (error) {
    console.error('Get group chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to group
router.post('/:groupId/members', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find group and check if current user is creator or member
    const groupChat = await GroupChat.findById(groupId);
    
    if (!groupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    const isCreator = groupChat.creator.toString() === currentUser._id.toString();
    const isMember = groupChat.members.some(m => m.toString() === currentUser._id.toString());
    
    if (!isCreator && !isMember) {
      return res.status(403).json({ message: 'You are not authorized to add members to this group' });
    }
    
    // Check if user is already a member
    if (groupChat.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add member to group
    groupChat.members.push(userId);
    await groupChat.save();
    
    // Return updated group
    const updatedGroup = await GroupChat.findById(groupId)
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Add group member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave group
router.delete('/:groupId/members/me', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { groupId } = req.params;
    
    // Find group
    const groupChat = await GroupChat.findById(groupId);
    
    if (!groupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    // Check if user is a member
    if (!groupChat.members.some(m => m.toString() === currentUser._id.toString())) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }
    
    // If user is the creator, assign a new creator if there are other members
    if (groupChat.creator.toString() === currentUser._id.toString()) {
      // Filter out the current user
      const otherMembers = groupChat.members.filter(m => m.toString() !== currentUser._id.toString());
      
      if (otherMembers.length > 0) {
        // Assign the first other member as the new creator
        groupChat.creator = otherMembers[0];
      } else {
        // If no other members, delete the group
        await GroupChat.findByIdAndDelete(groupId);
        return res.json({ message: 'Group deleted as you were the last member' });
      }
    }
    
    // Remove current user from members
    groupChat.members = groupChat.members.filter(m => m.toString() !== currentUser._id.toString());
    await groupChat.save();
    
    res.json({ message: 'You have left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to group
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { groupId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Find group and check if user is a member
    const groupChat = await GroupChat.findById(groupId);
    
    if (!groupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    if (!groupChat.members.some(m => m.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    
    // Create new message
    const newMessage = new GroupMessage({
      groupChatId: groupId,
      sender: currentUser._id,
      content,
      readBy: [currentUser._id] // Mark as read by sender
    });
    
    await newMessage.save();
    
    // Populate sender info
    const populatedMessage = await GroupMessage.findById(newMessage._id)
      .populate('sender', 'name profilePicture');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a group
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { groupId } = req.params;
    
    // Find group and check if user is a member
    const groupChat = await GroupChat.findById(groupId);
    
    if (!groupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
    
    if (!groupChat.members.some(m => m.toString() === currentUser._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    
    // Get messages for this group
    const messages = await GroupMessage.find({ groupChatId: groupId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 });
    
    // Mark messages as read by current user
    await GroupMessage.updateMany(
      { 
        groupChatId: groupId,
        sender: { $ne: currentUser._id },
        readBy: { $ne: currentUser._id }
      },
      { $addToSet: { readBy: currentUser._id } }
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 