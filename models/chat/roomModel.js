const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomChatSchema = new Schema({
    users: [
        {
            userId: {
                type: String,
                required: true,
            },
            partnerId: {
                type: String,
                required: true,
            },
        },
    ],
    // Properti lain yang mungkin Anda butuhkan
});
// console.log(roomChatSchema);
const RoomChat = mongoose.model('RoomChat', roomChatSchema);

module.exports = RoomChat;
