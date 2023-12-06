// middlewares/whatsappGatewayMiddleware.js
const axios = require('axios');
require('dotenv').config();

const sendOTP = async (phoneNumber, otpMessage) => {
  try {
    const response = await axios.post(process.env.WA_URL, {
      target: phoneNumber,
      message: otpMessage,
    }, {
      headers: {
        'Authorization': process.env.WA_TOKEN, // Ganti dengan token WhatsApp Gateway Anda
      },
    });

    // if (response.data.success) {
    //   console.log('OTP terkirim.');
    // } else {
    //   console.error('Gagal mengirim OTP.');
    // }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengirim OTP:', error.message);
  }
};

module.exports = { sendOTP };
