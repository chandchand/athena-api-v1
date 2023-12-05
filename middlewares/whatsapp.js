// middlewares/whatsappGatewayMiddleware.js
const axios = require('axios');

const sendOTP = async (phoneNumber, otpMessage) => {
  try {
    const response = await axios.post('https://api.fonnte.com/send', {
      target: phoneNumber,
      message: otpMessage,
    }, {
      headers: {
        'Authorization': 'vwfMJ5dra0I9SYzVBbcy', // Ganti dengan token WhatsApp Gateway Anda
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
