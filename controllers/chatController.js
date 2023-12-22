const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const { sendOTP } = require('../middlewares/whatsapp');
const { sendEmail } = require('../middlewares/mailer');
const db = require ('../models')
const {Profile, Users} = require("../models")
const resMsg = require('../utils/resMsg')
const cloudinary = require("../utils/cloudinary");
const { Op } = require("sequelize");
const Room = require("../models/chat/roomModel")
const Message = require("../models/chat/messageModel")
const io = require('socket.io')();

const sendMessageToUser = (userId, eventName, data) => {
  io.to(userId).emit(eventName, data);
};

// ...

exports.getAllChat = catchAsyncErrors(async(req, res, next) => {
  const userId = req.user.id;

  try {
      const chats = await Message.aggregate([
          {
            $match: {
              'sender': userId,
            },
          },
          {
            $group: {
              _id: '$roomId',
              chat: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: { newRoot: '$chat' },
          },
          {
            $sort: { createdAt: -1 },
          },
      ]);

      const senderData = await Users.findOne({
        where: { id: receiverId },
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            attributes: ['avatar'],
            where: { userId: receiverId },
            required: true,
          },
        ],
      });

      const data = {
        chats: chats.map(chat => ({
          _id: chat._id,
          senderId: chat.sender,
          receiverId: chat.participants.find(id => id !== userId),
          message: chat.message,
          createdAt: chat.createdAt,
        })),
        user:{
          name: senderData ? senderData.name : null,
          avatar: senderData ? senderData.Profile.avatar : null,
        }
      };

      resMsg.sendResponse(res, 200, true, 'success', data);
  } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
  }
});

exports.getChat = catchAsyncErrors(async(req, res, next) => {
  const receiverId = req.params.id;
  const senderId = req.user.id;

  try {
      const chats = await Message.find({
          $or: [
              { sender: senderId, 'participants': receiverId },
              { sender: receiverId, 'participants': senderId },
          ]
      }).sort({ createdAt: 'asc' });

      const senderData = await Users.findOne({
        where: { id: receiverId },
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            attributes: ['avatar'],
            where: { userId: receiverId },
            required: true,
          },
        ],
      });

      const data = {
          chats: chats.map((chat) => ({
              _id: chat._id,
              senderId: chat.sender,
              receiverId: chat.participants.find(id => id !== senderId),
              message: chat.message,
              createdAt: chat.createdAt,
          })),
          user:{
            name: senderData ? senderData.name : null,
            avatar: senderData ? senderData.Profile.avatar : null,
          }
      };

      resMsg.sendResponse(res, 200, true, 'success', data);
  } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
  }
});

exports.sendChat = catchAsyncErrors(async (req, res, next) => {
  const receiverId = req.params.id;
  const senderId = req.user.id;
  const { message } = req.body;

  try {
    // Cari atau buat ruang obrolan antara pengirim dan penerima
    let roomChat = await Room.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!roomChat) {
      roomChat = await Room.create({
        participants: [senderId, receiverId],
      });
    }

    // Simpan pesan ke MongoDB
    const chat = await Message.create({
      roomId: roomChat._id,
      sender: senderId,
      message: message,
    });

    // Kirim pesan ke penerima
    io.to(receiverId).emit('receiveMessage', { senderId, message });

    resMsg.sendResponse(res, 200, true, 'success', { senderId, receiverId, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler('Kesalahan Server.', 500));
  }
});