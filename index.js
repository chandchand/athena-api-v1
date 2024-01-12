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

  socket.on('sendMessage', async ({ roomId, senderId, content }) => {
    console.log('Received sendMessage event:', { roomId, senderId, content });
    
    try {
      // Create an ObjectId from the provided roomId
      // Logic to save the message to MongoDB
      const roomObjectId = new mongoose.Types.ObjectId(roomId);
      const message = new Message({ room: roomObjectId, sender: senderId, content });
      // Emit the message to all members of the room
      
      await message.save();
      await RoomChat.updateOne({ _id: roomId }, { $set: { hasUnreadMessages: true } });
      
      io.to(roomId.toString()).emit('sendMessage', message);
      console.log("room id: ",roomId.toString());
      // io.emit('sendMessage', message);
      console.log('Mengirim newMessage event:', message);

      // Add this log to check the roomId
      console.log('Room ID in sendMessage handler:', roomId);
    } catch (error) {
      console.error('Error handling sendMessage event:', error);
    }
  });
  
  socket.on('join', async ({ userId, partnerId }) => {
    console.log('Received join event:', { userId, partnerId });
    try {
      const room = await findOrCreateRoom(userId, partnerId);
  
      io.to(socket.id).emit(room.newRoom ? 'roomCreated' : 'roomJoined', room.room._id);
  
      // Kirimkan pesan bergabung ke user tersebut saja
      socket.join(room.room._id.toString());
      console.log("roomID joined: ",room.room._id.toString());
  
      const allMessages = await getAllMessages(room.room._id, userId, partnerId);
      io.to(socket.id).emit('messages', allMessages);
      // console.log("all", allMessages);
    } catch (error) {
      console.error('Error handling join event:', error);
    }
  });

  socket.on("roomList", async (userId) => {
    console.log("get userId on event roomList:", userId);

    try {
      const _roomList = await RoomChat.find({
        users: {
          $elemMatch: {
            $or: [{ userId: userId }, { partnerId: userId }],
          },
        },
      });

      const roomList = [];

      for (const room of _roomList) {
        const latestMessage = await Message.findOne({ room: room._id })
          .sort({ createdAt: -1 })
          .limit(1);

        const user = room.users.find((user) => user.userId === userId);
        const partnerId = user
          ? user.partnerId
          : room.users.find((user) => user.partnerId === userId).userId;

        const roomData = {
          _id: room._id,
          latestMessage: latestMessage
            ? {
                content: latestMessage.content,
                sender: latestMessage.sender.toString(),
                seen: latestMessage.seen,
                createdAt: new Date(latestMessage.createdAt).getTime(),
              }
            : null,
          userId: userId,
          partnerId: partnerId,
        };
        roomList.push(roomData);
      }

      io.emit("roomList", roomList);
      console.log("received ID roomList event", userId.toString());
      console.log("received roomList event", roomList);
    } catch (error) {
      console.error("Error handling roomList event:", error);
    }
  });
  


  async function findOrCreateRoom(userId, partnerId) {
      // Sort userId and partnerId to ensure consistent order
      const sortedIds = [userId, partnerId].sort();
      const room = await RoomChat.findOne({
          users: { $elemMatch: { userId: sortedIds[0], partnerId: sortedIds[1] } },
      });

      if (!room) {
          const newRoom = new RoomChat({ users: [{ userId: sortedIds[0], partnerId: sortedIds[1] }] });
          await newRoom.save();
          return { room: newRoom, newRoom: true };
      }

      return { room, newRoom: false };
  }

  async function getAllMessages(roomId, userId, partnerId) {
      return Message.find({
          room: roomId,
          $or: [
              { sender: userId },
              { sender: partnerId },
          ],
      }).populate('sender');
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
