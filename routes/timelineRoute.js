const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {isAuthenticated, authorizeRole} = require('../middlewares/authMiddleware')
const Timeline = require('../controllers/timelineController');

const storage = multer.diskStorage({}); 
const uploads = multer({ storage: storage })

const isUser = 'user';

router.route('/posts')
    .post(isAuthenticated, authorizeRole(isUser), uploads.single('img') ,Timeline.createPost)
    .get(isAuthenticated, authorizeRole(isUser), Timeline.getPosts)
    
router.route('/my_posts')
    .get(isAuthenticated, authorizeRole(isUser),Timeline.getMyPosts)

router.route('/posts/:id')
    .get(isAuthenticated, authorizeRole(isUser),Timeline.getOnePosts)

router.route('/like/:postId')
    .post(isAuthenticated, authorizeRole(isUser),Timeline.like)
router.route('/dislike/:postId')
    .delete(isAuthenticated, authorizeRole(isUser),Timeline.dislike)

router.route('/comment/:postId')
    .post(isAuthenticated, authorizeRole(isUser),uploads.single('img') ,Timeline.comment)
router.route('/del_comment/:id')
    .delete(isAuthenticated, authorizeRole(isUser),Timeline.deleteComment)

router.route('/search').get(isAuthenticated, authorizeRole(isUser),Timeline.searchUsers)
router.route('/follow/:id').post(isAuthenticated, authorizeRole(isUser),Timeline.follows)
router.route('/unfollow/:id').delete(isAuthenticated, authorizeRole(isUser),Timeline.unfollow)


module.exports = router;
