// routes/chatRoute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated, authorizeRole } = require('../middlewares/authMiddleware');
const Chat = require('../controllers/chatController');
const isUser = 'user';

router
  .route("/roomList")
  .get(isAuthenticated, authorizeRole(isUser), Chat.roomList);

module.exports = router;
