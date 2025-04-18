const mongoose = require('mongoose');

const randomChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
});

// Ensure we have exactly 2 participants per random chat
randomChatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Random chat must have exactly 2 participants'));
  }
  next();
});

const RandomChat = mongoose.model('RandomChat', randomChatSchema);

module.exports = RandomChat; 