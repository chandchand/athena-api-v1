// db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('Koneksi MongoDB berhasil.');
  } catch (err) {
    console.error('Gagal terhubung ke MongoDB:', err.message);
    process.exit(1); // Keluar dari aplikasi jika terjadi kesalahan
  }
};

module.exports = connectDB;
