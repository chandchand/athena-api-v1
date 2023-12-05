// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Kirim OTP saat registrasi
router.post('/register', authController.register);

router.post('/resendOtp', authController.resendOTP);

// Kirim ulang OTP saat login
router.post('/login', authController.login);

// Verifikasi OTP
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;
