// utils/socketUtils.js
const socketio = require('socket.io');
const Chat = require('../models/chat/chatRoom');

module.exports = (server) => {
  const io = socketio(server, { path: '/socket.io/chat' });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });

    socket.on('sendChat', async (data) => {
      try {
        const newChat = new Chat(data);
        await newChat.save();
        io.emit('receiveChat', newChat); // Mengirim pesan ke semua klien yang terhubung
      } catch (error) {
        console.error('Error sending chat:', error.message);
      }
    });
  });

  return io;
};
