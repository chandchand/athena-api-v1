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

exports.roomList = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const _roomList = await RoomChat.find({
      users: {
        $elemMatch: {
          $or: [{ userId: userId }, { partnerId: userId }],
        },
      },
    });

    const roomList = [];

    for (const room of _roomList) {
      const user = room.users.find((user) => user.userId === userId);
      const partnerId = user
        ? user.partnerId
        : room.users.find((user) => user.partnerId === userId).userId;

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
      };

      roomList.push(data);
    }
    resMsg.sendResponse(res, 200, true, "success", roomList);
    // console.log("roomlist = ", _roomList.users);
  } catch (err) {}
});