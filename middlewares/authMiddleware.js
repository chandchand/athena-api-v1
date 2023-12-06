const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../models')
const User = require('../models/user')(db.sequelize); 
const ErrorHandler = require("../utils/errorHandlers")

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      // Token ditemukan di header Authorization dengan metode Bearer
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Token ditemukan di cookie
      token = req.cookies.token;
    } else if (req.headers['x-access-token']) {
      // Token ditemukan di header x-access-token
      token = req.headers['x-access-token'];
    }

    if (!token) {
      console.error('Token tidak ditemukan');
      return next(new ErrorHandler('Harap login terlebih dahulu', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || 'r3blu3110923');
    console.log(decoded);
    req.user = await User.findOne({ where: { id: decoded.id } });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler('Autentikasi gagal', 401));
  }
};

exports.authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Anda tidak diizinkan untuk mengakses ini' });
    }

    next();
  };
};


