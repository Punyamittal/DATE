const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if we're in in-memory mode (global.User will be set if we are)
if (global.User) {
  console.log('Using in-memory User model');
  module.exports = global.User;
} else {
  // Regular MongoDB model
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@vitstudent\.ac\.in$/, 'Please enter a valid VIT email address']
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    profilePicture: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    interests: [{
      type: String
    }],
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    lookingFor: {
      type: String,
      enum: ['male', 'female', 'both', 'other'],
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Hash the password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Method to check if the password is correct
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  const User = mongoose.model('User', userSchema);

  module.exports = User;
} 