const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIO = require('socket.io');
const { setupSocket } = require('./utils/socketIo');
const db = require('./models');
const connectDB = require('./config/mongoDB');
const ErrorHandler = require('./utils/errorHandlers');
const error = require('./middlewares/errorMiddleware');
const morgan = require('morgan');
const ChatRoom = require('./models/chat/chatRoom'); // Import model MongoDB

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
      origin: "*"
     }
});

// Setup Socket.IO
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
      io.to(receiverId).emit('receiveMessage', { senderId, message });
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
