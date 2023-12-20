const ChatRoom = require('../models/chat/chatRoom');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
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

        resMsg.sendResponse(res, 200, true, 'success', { chat });
      } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
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
      }
    });
  });
};

module.exports = { setupSocket };
