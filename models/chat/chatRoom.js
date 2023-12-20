const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  senderId: {
    type: String,  // Menggunakan String untuk UUID
    required: true,
  },
  receiverId: {
    type: String,  // Menggunakan String untuk UUID
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
