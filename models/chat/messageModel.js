const mongoose = require('mongoose');

const message = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomChat',
    required: true,
  },
  sender: {
    type: String,  // UUID pengguna dari PostgreSQL
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  seenBy: [
    {
      user: {
        type: String,  // UUID pengguna
        required: true,
      },
      seenAt: {
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

const Message = mongoose.model('Message', message);

module.exports = Message;
