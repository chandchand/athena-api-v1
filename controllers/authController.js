// controllers/authController.js
const jwt = require('jsonwebtoken');
const catchAsyncErrors = require("../middlewares/catchAsyncError")
const { sendOTP } = require('../middlewares/whatsapp');
const db = require('../models');
const User = require('../models/user')(db.sequelize)
const ErrorHandler = require("../utils/errorHandlers")
const Profile = require("../models/profile")(db.sequelize)
const resMsg = require('../utils/resMsg');


const generateOTP = (lastOTPSentAt = null) => {
  const otpLength = 6; // Anda dapat menyesuaikan panjang OTP sesuai kebutuhan
  const digits = '0123456789';
  const currentTime = new Date();

  // Jika timestamp terakhir ada dan waktu yang berlalu kurang dari 1 menit, kembalikan OTP yang sama.
  if (lastOTPSentAt && currentTime - lastOTPSentAt < 60 * 1000) {
    return 'SamaOTP'; // Gantilah dengan nilai yang sesuai untuk menandakan pengiriman ulang dalam waktu singkat.
  }

  let OTP = '';

  for (let i = 0; i < otpLength; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  return OTP;
};


const resendOTP = async (user) => {
  try {
    const otp = generateOTP(); // Generate a new OTP
    const userName = user.name || 'user   ';

    user.otp = otp;
    user.last_otp_sent_at = new Date(); // Set timestamp for the new OTP

    await user.save();

    // Send OTP via WhatsApp Gateway using middleware
    const otpMessage = `Halo ${userName}, berikut kode OTP baru Anda: ${otp}`;
    await sendOTP(user.phone_number, otpMessage);

    console.log(otp);

    return true; // OTP resent successfully
  } catch (error) {
    console.error('Error resending OTP:', error);
    return false; // Failed to resend OTP
  }
};

exports.register = catchAsyncErrors(async (req, res, next) => {
  let transaction;
  try {
    transaction = await db.sequelize.transaction();
    const { phone_number, name, nim, role } = req.body;
    const existingUser = await User.findOne({where: { phone_number: phone_number }});

    if (existingUser) {
      // return res.status(400).json({ error: 'Nomor telepon sudah digunakan.' });
      resMsg.sendResponse(res, 400, false, 'Nomor telepon sudah digunakan');
      return next(new ErrorHandler('Nomor telepon sudah digunakan.', 400));
    }

    // Generate OTP
    const lastOTPSentAt = null; // Setel nilai timestamp terakhir menjadi null saat mendaftar.
    const otp = generateOTP(lastOTPSentAt); // Fungsi untuk menghasilkan OTP

    // Simpan timestamp terakhir OTP dikirimkan ke pengguna
    const user = await User.create({
      phone_number,
      name,
      nim,
      role,
      otp,
      last_otp_sent_at: new Date(), // Setel timestamp terakhir OTP dikirimkan ke pengguna.
      created_at: new Date(), // Set timestamp explicitly
    }, { transaction });

    const otpMessage = `Halo ${name} Terimakasih sudah mendaftar di Athena silahkan melakukan verifikasi OTP terlebih dahulu., kode OTP Anda adalah: ${otp}`;
    await sendOTP(phone_number, otpMessage);

    // Buat data user profile
    const profile = await Profile.create({
      userId: user.id, // Menggunakan id dari user yang baru dibuat
    }, { transaction });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan verifikasi dengan OTP.',
    });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
});

  

exports.login = catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone_number } = req.body;
    const user = await User.findOne({ where: { phone_number:phone_number } });

    if (!user) {
      // return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      resMsg.sendResponse(res, 400, false, 'Pengguna tidak ditemukan');
      return next(new ErrorHandler('Pengguna tidak ditemukan.', 404));
    }
    
    if (user.status === 0) {
      resMsg.sendResponse(res, 400, false, 'Account anda belum di aktivasi');
      return next(new ErrorHandler('Account anda belum di aktivasi', 400));
    }

    // Periksa apakah user telah meminta OTP dalam batas waktu yang ditentukan (misalnya, 1 menit).
    const currentTime = new Date();
    if (user.last_otp_sent_at && currentTime - user.last_otp_sent_at < 60 * 300){
      // return res.status(400).json({ error: 'Anda telah meminta OTP terlalu sering. Silakan coba lagi nanti.' });
      resMsg.sendResponse(res, 400, false, 'Anda telah meminta OTP terlalu sering. Silahkan coba lagi nanti');
      return next(new ErrorHandler( 'Anda telah meminta OTP terlalu sering. Silakan coba lagi nanti.', 400));
    }

    // Generate OTP
    const otp = generateOTP(); // Fungsi untuk menghasilkan OTP
    const userName = user.name || 'User';
    user.otp = otp;
    user.last_otp_sent_at = new Date(); // Setel timestamp terakhir OTP dikirimkan ke pengguna.

    await user.save();

    // Kirim OTP melalui WhatsApp Gateway menggunakan middleware
    const otpMessage = `Halo ${userName} Selamat Datang, untuk melakukan login berikut kode OTP Anda adalah: ${otp}`;
    await sendOTP(phone_number, otpMessage);
    console.log(otp);

    res.status(200).json({ 
      success: true,
      message: 'OTP telah berhasil dikirim.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Verifikasi OTP saat pengguna mencoba login
exports.verifyOTP = catchAsyncErrors(async (req, res, next) => {
    try {
      const { phone_number, otp } = req.body;
      const user = await User.findOne({ where: { phone_number: phone_number } });
  
      if (!user) {
        // return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        resMsg.sendResponse(res, 400, false, 'Pengguna tidak ditemukan');
        return next(new ErrorHandler('Pengguna tidak ditemukan.', 404));
      }
      
      if (user.status === 0){
          
        if (user.otp !== otp) {
          // return res.status(401).json({ error: 'OTP salah.' });
          return next(new ErrorHandler('OTP salah.', 401));
        }
        user.otp = null;
        user.status = 1;
        await user.save();  

        const token = jwt.sign({ phone_number: user.phone_number, _id: user._id, role: user.role }, process.env.JWT_SECRET || 'r3blu3110923', {
          expiresIn: '24h',
        });
        res.status(200).json(
          { message: "Selamat Datang Di Reblue anda berhasil aktivasi account anda", token});

      } else {

        if (user.otp !== otp) {
          // return res.status(401).json({ error: 'OTP salah.' });
          resMsg.sendResponse(res, 400, false, 'OTP salah.');
          return next(new ErrorHandler('OTP salah.', 401));
        }
        user.otp = null;
        await user.save();
    
        // Generate token JWT
        const token = jwt.sign({ phone_number: user.phone_number, id: user.id, role: user.role }, process.env.JWT_SECRET || 'r3blu3110923', {
          expiresIn: '24h',
        });
    
        res.status(200).json(
          { message: "Selamat Datang Di Reblue anda berhasil masuk", token});
          
      }   
      console.log(user);
      // Setel otp menjadi null setelah berhasil verifikasi
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// Resend OTP
exports.resendOTP = catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone_number } = req.body;
    const user = await User.findOne({ where: { phone_number:phone_number } });

    if (!user) {
      resMsg.sendResponse(res, 400, false, 'Pengguna tidak ditemukan');
      return next(new ErrorHandler('Pengguna tidak ditemukan.', 404));
    }

    // Check if the user is already verified
    if (user.status === 1) {
      resMsg.sendResponse(res, 400, false, 'Nomor Anda sudah terverifikasi');
      return next(new ErrorHandler('Nomor Anda sudah terverifikasi.', 400));
    }

    // Resend OTP
    const isOTPSent = await resendOTP(user);

    if (isOTPSent) {
      res.status(200).json({
        success: true,
        message: 'OTP berhasil dikirim ulang. Silakan cek pesan WhatsApp Anda.',
      });
    } else {
      resMsg.sendResponse(res, 500, false, 'Gagal mengirim ulang OTP. Coba lagi nanti.');
      return next(new ErrorHandler('Gagal mengirim ulang OTP. Coba lagi nanti.', 500));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  