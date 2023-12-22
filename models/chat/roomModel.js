const mongoose = require('mongoose');

const roomChat = new mongoose.Schema({
  participants: [
    {
      type: String,  // Menggunakan String untuk UUID
      required: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const RoomChat = mongoose.model('RoomChat', roomChat);

module.exports = RoomChat;
