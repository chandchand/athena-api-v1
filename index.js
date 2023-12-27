const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIO = require('socket.io');
const db = require('./models');
const connectDB = require('./config/mongoDB');
const ErrorHandler = require('./utils/errorHandlers');
const error = require('./middlewares/errorMiddleware');
const morgan = require('morgan');
const RoomChat = require('./models/chat/roomModel'); // Import model MongoDB
const Message = require('./models/chat/messageModel'); // Import model MongoDB
const mongoose = require('mongoose');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
      origin: "*"
     }
});
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', (data) => {
    console.log('Received join event:', data);
    try {
      // Ganti logika ini sesuai kebutuhan Anda
      // Contoh: Mencari atau membuat ruangan (room)
      const room = findOrCreateRoom(data.roomId);

      // Bergabung ke room
      socket.join(room.roomId);

      // Emit ke client yang bersangkutan bahwa room telah dibuat atau di-join
      io.to(socket.id).emit(room.newRoom ? 'roomCreated' : 'roomJoined', room.roomId);

      // Ambil semua pesan dalam room dan kirimkan ke client yang baru join
      const allMessages = getAllMessages(room.roomId);
      io.to(socket.id).emit('messages', allMessages);
    } catch (error) {
      console.error('Error handling join event:', error);
    }
  });

  // Fungsi untuk mencari atau membuat room baru
  function findOrCreateRoom(roomId) {
    // Ganti logika ini sesuai kebutuhan Anda
    // Contoh: Mencari atau membuat ruangan (room)
    const existingRoom = io.sockets.adapter.rooms.get(roomId);
    
    if (!existingRoom) {
      // Jika room belum ada, buat room baru
      return { roomId, newRoom: true };
    }

    // Jika room sudah ada, kirimkan informasi bahwa room telah di-join
    return { roomId, newRoom: false };
  }

  // Fungsi untuk mendapatkan semua pesan dalam room
  function getAllMessages(roomId) {
    // Ganti logika ini sesuai kebutuhan Anda
    // Contoh: Mengambil semua pesan dari database berdasarkan roomId
    return Message.find({ room: roomId }).populate('sender');
  }

  socket.on('sendMessage', (data) => {
    console.log('Received sendMessage event:', data);

    try {
      // Ganti logika ini sesuai kebutuhan Anda
      // Contoh: Menyimpan pesan ke database
      const message = saveMessage(data.roomId, data.senderId, data.content);

      // Emit pesan ke semua anggota room
      io.to(data.roomId).emit('newMessage', message);

      // Tambahkan log untuk memeriksa roomId
      console.log('Room ID in sendMessage handler:', data.roomId);
    } catch (error) {
      console.error('Error handling sendMessage event:', error);
    }
  });

  // Fungsi untuk menyimpan pesan ke database
  function saveMessage(roomId, senderId, content) {
    // Ganti logika ini sesuai kebutuhan Anda
    // Contoh: Menyimpan pesan ke database
    const message = new Message({ room: roomId, sender: senderId, content });
    message.save();
    return message;
  }

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


const PORT = process.env.PORT || 8000;

app.use(morgan('dev'));
connectDB();

db.sequelize.sync({ force: false, logging: (msg) => console.log(`[${db.sequelize.config.environment}] ${msg}`) })
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const auth = require('./routes/authRoute');
const user = require('./routes/userRoute');
const chat = require('./routes/chatRoute');
const timeline = require('./routes/timelineRoute');
const { log } = require('console');

app.get("/api/", (req,res) => {
  res.send("Hello Word");
});

app.use('/api/auth', auth);
app.use('/api/user', user);
app.use('/api/chat', chat);
app.use('/api/timeline', timeline);

app.use('*',( req, res, next)=> { return next(new ErrorHandler("PAGE NOT FOUND", 404)); });
app.use(error.errorMiddleware);

server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
