// socketIo.js
const ChatRoom = require('../models/chat/chatRoom');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { senderId, receiverId, message } = data;

        // Simpan pesan ke MongoDB
        const chat = await ChatRoom.create({
          senderId,
          receiverId,
          message,
        });

        // Kirim pesan ke penerima
        io.to(receiverId).emit('receiveMessage', { chat });
      } catch (err) {
        console.error('Error sending message:', err);
        // Handling error for socket.io event
        socket.emit('errorMessage', { error: 'Failed to send message' });
      }
    });

    socket.on('messageSeen', async (data) => {
      try {
        const { senderId, receiverId } = data;

        // Update status pesan yang telah dilihat di MongoDB
        await ChatRoom.updateMany(
          { senderId: receiverId, receiverId: senderId },
          { $set: { seen: true } }
        );

        // Kirim notifikasi ke pengirim bahwa pesan telah dilihat
        io.to(senderId).emit('messageSeen', { receiverId });
      } catch (err) {
        console.error('Error updating message seen status:', err);
        // Handling error for socket.io event
        socket.emit('errorMessage', { error: 'Failed to update message seen status' });
      }
    });
  });
}

module.exports = { setupSocket };
