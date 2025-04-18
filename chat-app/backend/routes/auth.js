const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');
const auth = require('../middleware/auth');

// Check if in development mode with no email config
const isDevMode = !process.env.EMAIL_USER || 
                  !process.env.EMAIL_PASS || 
                  process.env.EMAIL_USER === 'your-email@gmail.com' || 
                  process.env.EMAIL_PASS === 'your-email-app-password';

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender, lookingFor } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !gender || !lookingFor) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if email is a VIT student email
    if (!email.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({ message: 'Only VIT student emails (@vitstudent.ac.in) are allowed' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      gender,
      lookingFor,
      verificationToken,
      verificationTokenExpires: tokenExpires,
      // Auto-verify in development mode
      isVerified: isDevMode
    });
    
    await user.save();
    
    if (isDevMode) {
      console.log(`DEVELOPMENT MODE: User ${email} automatically verified. Token: ${verificationToken}`);
      console.log(`Verification URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);
      
      return res.status(201).json({ 
        message: 'Registration successful! DEV MODE: Your account is automatically verified.',
        devModeToken: verificationToken // Send token in development mode for testing
      });
    }
    
    // Send verification email in production mode
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      // Don't fail registration if email fails, just warn the user
      return res.status(201).json({ 
        message: 'Registration successful, but verification email could not be sent. Please contact support.',
        verificationIssue: true
      });
    }
    
    res.status(201).json({ 
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Find user with the token and check if it's not expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if email is a VIT student email
    if (!email.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({ message: 'Only VIT student emails (@vitstudent.ac.in) are allowed' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        unverified: true,
        // In dev mode, provide the token for easy testing
        devModeToken: isDevMode ? user.verificationToken : undefined
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_dev_secret',
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        interests: user.interests,
        gender: user.gender,
        lookingFor: user.lookingFor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationToken -verificationTokenExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 