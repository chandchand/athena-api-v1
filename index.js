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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
      origin: "*"
     }
});

const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinOrCreateRoom', async ({ userId, otherUserId }) => {
    try {
      // Cari atau buat ruang obrolan
      const roomId = getOrCreateRoomId(userId, otherUserId);

      // Bergabung ke ruang obrolan
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);

      // Kirim histori chat jika ada
      const chatHistory = getChatHistory(roomId);
      socket.emit('chatHistory', { roomId, chatHistory });
    } catch (error) {
      console.error('Error joining or creating room:', error);
    }
  });

  socket.on('sendMessage', (data) => {
    // Pastikan ruang obrolan sudah ada
    RoomChat.findById(data.roomId)
      .then((room) => {
        if (!room) {
          throw new Error(`Room not found: ${data.roomId}`);
        }

        // Simpan pesan ke database
        const newMessage = new Message({
          roomId: data.roomId,
          sender: data.sender,
          message: data.message,
        });

        return newMessage.save();
      })
      .then((savedMessage) => {
        // Tambahkan informasi seenBy pada pesan
        const seenByInfo = {
          user: data.sender,
          seenAt: savedMessage.createdAt,
        };

        // Kirim pesan ke ruang obrolan
        io.to(data.roomId).emit('receiveMessage', { ...savedMessage.toObject(), seenBy: [seenByInfo] });
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // ... (tindakan saat user disconnect, misalnya update status online/offline)
  });
});

function getOrCreateRoomId(userId, otherUserId) {
  // Sorting agar ID ruang obrolan tetap sama tidak peduli siapa yang pertama kali mengunjungi
  const sortedUserIds = [userId, otherUserId].sort();
  const roomId = sortedUserIds.join('_');

  if (!activeRooms.has(roomId)) {
    // Jika ruang obrolan belum ada, buat ruang obrolan baru
    activeRooms.set(roomId, { participants: [userId, otherUserId], chatHistory: [] });
  }

  return roomId;
}

function getChatHistory(roomId) {
  return activeRooms.get(roomId)?.chatHistory || [];
}


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
