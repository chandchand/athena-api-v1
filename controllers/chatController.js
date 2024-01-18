const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const { sendOTP } = require('../middlewares/whatsapp');
const { sendEmail } = require('../middlewares/mailer');
const db = require ('../models')
const {Profile, Users} = require("../models")
const resMsg = require('../utils/resMsg')
const cloudinary = require("../utils/cloudinary");
const { Op } = require("sequelize");
const RoomChat = require("../models/chat/roomModel");
const Message = require("../models/chat/messageModel");
const emitLatestMessage = require("../index");
const mongoose = require("mongoose");

exports.roomList = catchAsyncErrors(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    const _roomList = await RoomChat.find({
      users: {
        $elemMatch: {
          $or: [{ userId: userId }, { partnerId: userId }],
        },
      },
    }).session(session);

    if (!_roomList.length) {
      await session.commitTransaction();
      session.endSession();
      resMsg.sendResponse(res, 404, true, "no data roomlist");
      return;
    }

    const roomList = [];

    for (const room of _roomList) {
      const user = room.users.find((user) => user.userId === userId);
      const partnerId = user
        ? user.partnerId
        : room.users.find((user) => user.partnerId === userId).userId;

      const latestMessage = await Message.findOne({ room: room._id })
        .sort({ createdAt: -1 })
        .populate("sender")
        .session(session);

      const formattedLatestMessage = latestMessage
        ? {
            _id: latestMessage._id,
            room: latestMessage.room,
            sender: latestMessage.sender,
            content: latestMessage.content,
            seen: latestMessage.seen,
            createdAt: latestMessage.createdAt,
            time: latestMessage.createdAt.toLocaleTimeString(),
          }
        : null;

      const partnerData = await Profile.findOne({
        where: {
          userId: partnerId,
        },
        include: {
          model: Users,
          attributes: ["name", "phone_number"],
        },
      });

      const data = {
        roomId: room._id,
        userId: userId,
        partnerName: partnerData.User.name,
        partnerUsername: partnerData.username ? partnerData.username : null,
        partnerAvatar: partnerData.avatar ? partnerData.avatar.url : null,
        latestMessage: formattedLatestMessage,
      };

      roomList.push(data);
    }
    await session.commitTransaction();
    session.endSession();
    resMsg.sendResponse(res, 200, true, "success", roomList);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});