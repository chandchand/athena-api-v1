const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {isAuthenticated, authorizeRole} = require('../middlewares/authMiddleware')
const Profile = require('../controllers/profileController');

const storage = multer.diskStorage({}); 
const uploads = multer({ storage: storage })

const isUser = 'user';
const isAdmin = 'admin';

router.get('/profile',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.getMyProfile)
router.get('/profile/:id',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.getProfile)
router.get('/:userId',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.getConnections)

router.post('/send_change_otp',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.sendOtpChangeNumber)
router.post('/send_mail',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.sendOtpMailChangeNumber)

router.post('/verify_change',isAuthenticated, authorizeRole(isUser,isAdmin), Profile.verifyChangeNumber)

router.put('/avatar', isAuthenticated, authorizeRole(isUser,isAdmin), uploads.single('avatar'), Profile.uploadAvatar);
router.delete('/avatar', isAuthenticated, authorizeRole(isUser,isAdmin), Profile.deleteAvatar);
router.put('/bio_data', isAuthenticated, authorizeRole(isUser,isAdmin), Profile.updateBiodata);

// router.route('/location')
//     .post(isAuthenticated, authorizeRole(isUser),location.create)
//     .get(isAuthenticated, authorizeRole(isUser),location.getAll)

// router.route('/location/:id')
//     .get(isAuthenticated, authorizeRole(isUser),location.getOne)
//     .put(isAuthenticated, authorizeRole(isUser),location.update)
//     .delete(isAuthenticated, authorizeRole(isUser),location.delete)


module.exports = router;
