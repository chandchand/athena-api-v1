const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const { sendOTP } = require('../middlewares/whatsapp');
const { sendEmail } = require('../middlewares/mailer');
const db = require ('../models')
const {Profile, Users} = require("../models")
const resMsg = require('../utils/resMsg')
const cloudinary = require("../utils/cloudinary");
const { Op } = require("sequelize");
const Chat = require("../models/chat/chatRoom")
const io = require('socket.io')();

const sendMessageToUser = (userId, eventName, data) => {
  io.to(userId).emit(eventName, data);
};

exports.getAllChat = catchAsyncErrors(async(req, res, next) => {
    const senderId = req.user.id

    try {
        const chats = await Chat.aggregate([
            {
              $match: {
                $or: [{ senderId: userId }, { receiverId: userId }],
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $group: {
                _id: {
                  $cond: {
                    if: { $eq: ['$senderId', userId] },
                    then: '$receiverId',
                    else: '$senderId',
                  },
                },
                chat: { $first: '$$ROOT' },
              },
            },
            {
              $replaceRoot: { newRoot: '$chat' },
            },
        ]);
        // Mengambil avatar dari tabel User PostgreSQL
        const senderData = await Users.findByPk(senderId, {
            attributes: ['name', 'avatar'],
        });
        // Menyusun respons dengan menyertakan avatar
        const data = {
          chats: chats.map(chat => ({
            _id: chat._id,
            senderId: chat.senderId,
            receiverId: chat.receiverId,
            message: chat.message,
            createdAt: chat.createdAt,
            // Menambahkan avatar ke dalam data chat
            avatar: senderData ? senderData.avatar : null,
            name: senderData ? senderData.name : null,
          })),
        };
        resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})


exports.sendChat = catchAsyncErrors(async (req, res, next) => {
  const receiverId = req.params.id;
  const senderId = req.user.id;
  const { message } = req.body;

  try {
    // Kirim pesan melalui Socket.IO
    sendMessageToUser(receiverId, 'receiveChat', { senderId, receiverId, message });

    resMsg.sendResponse(res, 200, true, 'success', { senderId, receiverId, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler('Kesalahan Server.', 500));
  }
});

exports.getChat = catchAsyncErrors(async(req, res, next) => {
    const receiverId = req.params.id;
    const senderId = req.user.id;

    try {
        const chats = await Chat.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
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
                senderId: chat.senderId,
                receiverId: chat.receiverId,
                message: chat.message,
                createdAt: chat.createdAt,
            })),
            user_data:{
              name: senderData ? senderData.name : null,
              avatar: senderData ? senderData.avatar : null,
            }
        };

        resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
});