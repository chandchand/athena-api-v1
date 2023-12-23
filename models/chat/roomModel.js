const mongoose = require('mongoose');

const roomChat = new mongoose.Schema({
  participants: [
    {
      user: {
        type: String,  // UUID pengguna dari PostgreSQL
        required: true,
      },
      lastRead: {
        type: Date,
        default: null,
      },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const RoomChat = mongoose.model('RoomChat', roomChat);

module.exports = RoomChat;
