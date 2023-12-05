const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {isAuthenticated, authorizeRole} = require('../middlewares/authMiddleware')
const Post = require('../controllers/postController');

const storage = multer.diskStorage({}); 
const uploads = multer({ storage: storage })

const isUser = 'user';

router.route('/posts')
    .post(isAuthenticated, authorizeRole(isUser), uploads.single('img') ,Post.createPost)
    .get(isAuthenticated, authorizeRole(isUser), Post.getPosts)
    
router.route('/my_posts')
    .get(isAuthenticated, authorizeRole(isUser),Post.getMyPosts)

router.route('/posts/:id')
    .get(isAuthenticated, authorizeRole(isUser),Post.getOnePosts)

router.route('/like/:postId')
    .post(isAuthenticated, authorizeRole(isUser),Post.like)
router.route('/dislike/:postId')
    .delete(isAuthenticated, authorizeRole(isUser),Post.dislike)

router.route('/comment/:postId')
    .post(isAuthenticated, authorizeRole(isUser),uploads.single('img') ,Post.comment)
router.route('/del_comment/:id')
    .delete(isAuthenticated, authorizeRole(isUser),Post.deleteComment)


module.exports = router;
