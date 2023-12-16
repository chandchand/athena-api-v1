// routes/chatRoute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated, authorizeRole } = require('../middlewares/authMiddleware');
const Chat = require('../controllers/chatController');
const isUser = 'user';

router.route('/:id')
    .post(isAuthenticated, authorizeRole(isUser), Chat.sendChat)
    .get(isAuthenticated, authorizeRole(isUser), Chat.getChat);

router.route('/roomChat')
    .get(isAuthenticated, authorizeRole(isUser), Chat.getAllChat);

module.exports = router;
