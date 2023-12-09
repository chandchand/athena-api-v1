const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const { sendOTP } = require('../middlewares/whatsapp');
const { sendEmail } = require('../middlewares/mailer');
const db = require ('../models')
const {Profile, Users} = require("../models")
const resMsg = require('../utils/resMsg')
const cloudinary = require("../utils/cloudinary");
const { Op } = require("sequelize");

Users.hasOne(Profile, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  hooks: true,
});


Profile.belongsTo(Users, {
  foreignKey: 'userId',
});

exports.uploadAvatar = catchAsyncErrors(async(req, res, next)=>{
    
    const user_id = req.user.id;
    try {
        let avatar = '';

        const uploadedImage = await cloudinary.uploader.upload(req.file.path, { // Perubahan di sini
          folder: "avatar",
        });
    
        avatar = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url
        };
        const data = await Profile.update({
          avatar: avatar},
          {where: {
            userId: user_id
          }},{new: true});

        resMsg.sendResponse(res, 200, true, 'success', data);

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

exports.updateBiodata = catchAsyncErrors(async(req, res, next)=>{
    
    const {email, gender, bio} = req.body
    const user_id = req.user;

    if (gender !== "pria" && gender !== "wanita") {
      resMsg.sendResponse(res, 406, false, 'Error Validasi Gender Pria atau Wanita');
    }

    try {
        const data = await Profile.update({
            email: email,
            gender: gender,
            bio: bio
          },{
            where: {
            userId: user_id.id}
          },{new: true});

        resMsg.sendResponse(res, 200, true, 'success', data);

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

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

exports.sendOtpChangeNumber = catchAsyncErrors(async(req, res, next)=>{
    
    const {phone_number} = req.body
    const user_id = req.user;

    try {
        const existingUser = await User.findOne({ phone_number });

        if (existingUser) {
          // return res.status(400).json({ error: 'Nomor telepon sudah digunakan.' });
          resMsg.sendResponse(res, 400, false, 'Nomor telepon sudah digunakan');
          return next(new ErrorHandler('Nomor telepon sudah digunakan.', 400));
        }

        const verificationCode = generateOTP();

        const user = await User.findById(user_id)
        user.number_change_otp = verificationCode
        user.new_phone_number = phone_number;
        await user.save();

        const otpMessage = `Halo ${user.name}, untuk mengonfirmasi perubahan nomor telepon Anda, kode OTP adalah: ${verificationCode}`;
        console.log(verificationCode);
        await sendOTP(phone_number, otpMessage);
        resMsg.sendResponse(res, 200, true, 'success', data);

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

exports.sendOtpMailChangeNumber = catchAsyncErrors(async (req, res, next) => {
    const { phone_number } = req.body;
    const user_id = req.user;
  
    try {
      // 1. Cek apakah nomor telepon baru sudah digunakan oleh pengguna lain
      const existingUser = await User.findOne({ phone_number });
  
      if (existingUser) {
        resMsg.sendResponse(res, 400, false, 'Nomor telepon baru sudah digunakan');
        return next(new ErrorHandler('Nomor telepon baru sudah digunakan.', 400));
      }
  
      // 2. Generate OTP untuk verifikasi nomor telepon baru
      const verificationCode = generateOTP();
  
      // 3. Simpan verification code dan nomor telepon baru ke dalam profil pengguna
      const user = await User.findById(user_id);
      const emailUser = await Profile.findOne({user_id});
      user.number_change_otp = verificationCode;
      user.new_phone_number = phone_number; // Tambahkan atribut untuk menyimpan nomor telepon baru
      await user.save();

      if (!emailUser.email) {
        resMsg.sendResponse(res, 400, false, 'Silahkan Isi email pribadi anda terlebih dahulu atau email anda tidak valid');
        return next(new ErrorHandler('Silahkan Isi email pribadi anda terlebih dahulu atau email anda tidak valid', 400));
      }
      // 4. Kirim OTP melalui Email menggunakan Nodemailer
      const emailSubject = 'Verifikasi Perubahan Nomor Telepon';
      const emailBody = `Halo ${user.name}, untuk mengonfirmasi perubahan nomor telepon Anda, kode OTP adalah: ${verificationCode}`;
      
      await sendEmail(emailUser.email, emailSubject, emailBody);
  
      resMsg.sendResponse(res, 200, true, 'Kode OTP dikirimkan untuk verifikasi perubahan nomor telepon');
    } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
    }
  });

exports.verifyChangeNumber = catchAsyncErrors(async (req, res, next) => {
    
    const {otp} = req.body;
    const user_id = req.user;

    try {

      const user = await User.findById(user_id);

      if (!user || user.number_change_otp !== otp) {
        resMsg.sendResponse(res, 400, false, 'Kode OTP tidak valid');
        return next(new ErrorHandler('Kode OTP tidak valid', 400));
      }

      user.phone_number = user.new_phone_number;
      user.new_phone_number = null;
      user.phone_change_verification_code = null;
      await user.save();

      resMsg.sendResponse(res, 200, true, 'Nomor telepon berhasil diperbarui');
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

exports.getProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const profile = await Profile.findOne({
      where: {
        userId: user_id,
      },
      include: {
        model: Users,
        attributes: ['nim', 'name', 'phone_number'], // Specify the desired fields
        include: [
          {
            model: Users,
            as: 'followers',
            attributes: ['id', 'name'], // Specify the desired fields for followers
          },
          {
            model: Users,
            as: 'following',
            attributes: ['id', 'name'], // Specify the desired fields for following
          },
        ],
      },
    });

    if (!profile) {
      return next(new ErrorHandler('Tidak Ada Data.', 404));
    }
    const data = {
      id: profile.id,
      userId: profile.userId,
      avatar: profile.avatar.url,
      nim: profile.User.nim,
      name: profile.User.name,
      phone: profile.User.phone_number,
      followers: profile.User.followers.length,
      following: profile.User.following.length,
    };

    resMsg.sendResponse(res, 200, true, 'success', data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler('Kesalahan Server.', 500));
  }
});

exports.getConnections = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const relation = req.query.relation; // Get the relation query parameter

    const profile = await Profile.findOne({
      where: {
        userId: userId,
      },
      include: {
        model: Users,
        attributes: ['nim', 'name', 'phone_number'], // Specify the desired fields
        include: [
          {
            model: Users,
            as: relation,
            attributes: ['id', 'name'],
          },
        ],
      },
    });

    if (!profile) {
      return next(new ErrorHandler('Profile not found.', 404));
    }

    const connections = profile.User[relation].map(({ id, name }) => ({ id, name }));
    
    if (relation === 'followers') {
      const data = {
        followers: connections
      };

      resMsg.sendResponse(res, 200, true, 'success', data);
    }else if (relation === 'following') {
      const data = {
        following: connections
      };
      
      resMsg.sendResponse(res, 200, true, 'success', data);
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler('Server Error.', 500));
  }
});
