const mongoose = require('mongoose');

const message = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomChat',
    required: true,
  },
  sender: {
    type: String,  // UUID pengguna dari PostgreSQL
    required: true,
  },
  content: String,
  seen: { 
    type: Boolean, 
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', message);

module.exports = Message;
