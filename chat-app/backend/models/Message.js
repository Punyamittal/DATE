const mongoose = require('mongoose');

// Check if we're in in-memory mode (global.Message will be set if we are)
if (global.Message) {
  console.log('Using in-memory Message model');
  module.exports = global.Message;
} else {
  // Regular MongoDB model
  const messageSchema = new mongoose.Schema({
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  const Message = mongoose.model('Message', messageSchema);

  module.exports = Message;
} 