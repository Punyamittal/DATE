const mongoose = require('mongoose');

// Check if we're in in-memory mode (global.Match will be set if we are)
if (global.Match) {
  console.log('Using in-memory Match model');
  module.exports = global.Match;
} else {
  // Regular MongoDB model
  const matchSchema = new mongoose.Schema({
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    user1SwipedRight: {
      type: Boolean,
      default: true
    },
    user2SwipedRight: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Ensure unique matches between users
  matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

  const Match = mongoose.model('Match', matchSchema);

  module.exports = Match;
}