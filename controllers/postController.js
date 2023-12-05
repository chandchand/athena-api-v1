const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const resMsg = require('../utils/resMsg')
const db = require ('../models')
const Profile = require("../models/profile")(db.sequelize)
const {sequelize, Users, Posts, Likes, Comments } = require("../models");
const cloudinary = require("../utils/cloudinary");
const { Op } = require("sequelize");

exports.createPost = catchAsyncErrors(async (req, res, next) => {
    const {content} = req.body
    const userId = req.user

    try {

        let imagePath = '';
        const uploadedImage = await cloudinary.uploader.upload(req.file.path, { // Perubahan di sini
          folder: "post",
        });
    
        imagePath = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url
        };
    

        const data = await Posts.create({
            userId: userId.id,
            img: imagePath,
            content,
            createdAt: new Date()
        })
        resMsg.sendResponse(res, 200, true, 'success', data);

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

exports.like = catchAsyncErrors(async (req, res, next) => {
    
    const postId = req.params.postId
    const userId = req.user

    try {

        const data = await Likes.create({
            userId: userId.id,
            postId: postId,
            createdAt: new Date()
        })
        resMsg.sendResponse(res, 200, true, 'success', data);

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

exports.dislike = catchAsyncErrors(async (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.user;
  
    try {
      // Temukan like yang sesuai berdasarkan postId dan userId
      const like = await Likes.findOne({
        where: {
          postId: postId,
          userId: userId.id,
        },
      });
  
      if (!like) {
        // Jika like tidak ditemukan, kirim respons bahwa postingan sudah tidak disukai
        return resMsg.sendResponse(res, 200, true, 'success', 'Post already disliked');
      }
  
      // Jika like ditemukan, hapus like
      await like.destroy();
  
      resMsg.sendResponse(res, 200, true, 'success', 'Disliked successfully');
    } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
    }
});
  

exports.comment = catchAsyncErrors(async (req, res, next) => {
    
    const postId = req.params.postId
    const userId = req.user
    const {text} = req.body

    try {
        
        let imagePath = '';

        // Periksa apakah pengguna mengunggah gambar
        if (req.file) {
            const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
                folder: "post/comment",
            });

            imagePath = {
                public_id: uploadedImage.public_id,
                url: uploadedImage.secure_url
            };
        }
        
        const data = await Comments.create({
            userId: userId.id,
            postId: postId,
            text,
            img: imagePath,
            createdAt: new Date()
        });

        resMsg.sendResponse(res, 200, true, 'success', data);
        

    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
})

exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    try {
      const comment = await Comments.findByPk(id);
  
        if (!comment) {
            return next(new ErrorHandler('Komentar tidak ditemukan', 404));
        }

        if (comment.userId !== req.user.id) {
            return next(new ErrorHandler('Anda tidak memiliki izin untuk menghapus komentar ini', 403));
        }
      
    await comment.destroy();
  
      resMsg.sendResponse(res, 200, true, 'success', 'Comment Deleted');
    } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
    }
});

exports.getPosts = catchAsyncErrors(async (req, res, next) => {
    try {
        const posts = await Posts.findAll({
            include: [
                {
                    model: Users, // Asosiasi dengan User
                    as: 'user',
                    attributes: ['name'],
                    include: [
                        {
                          model: Profile,
                          as: 'profile',
                          attributes: ['avatar'],
                        },
                    ], 
                },
                {
                    model: Likes,
                    as: 'likes',
                    attributes: ['userId'],
                },
                {
                    model: Comments,
                    as: 'comments',
                    attributes: ['userId', 'text'],
                    include: [
                        {
                            model: Users,
                            as: 'user',
                            attributes: ['id', 'name'],
                            include: [
                                {
                                  model: Profile,
                                  as: 'profile',
                                  attributes: ['avatar'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    
        // Manipulasi hasil query
        const data = posts.map(post => {
            return {
                id: post.id,
                userId: post.userId,
                img: post.img.url, // Ambil url dari objek img
                content: post.content,
                uploadTime: new Date(post.createdAt).getTime(),
                user: post.user.name,
                avatar: post.user.profile.avatar ? post.user.profile.avatar.url : null,
                likeCount: post.likes.length, // Hitung jumlah likes
                comments: post.comments.length
            };
        });
    
        resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
    
});

exports.getMyPosts = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user;
    try {
        // Pastikan userId memiliki nilai dan userId.id memiliki nilai
        if (!userId || !userId.id) {
            return resMsg.sendResponse(res, 400, false, 'User ID tidak valid', null);
        }

        const posts = await Posts.findAll({
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['name'],
                    include: [
                        {
                          model: Profile,
                          as: 'profile',
                          attributes: ['avatar'],
                        },
                    ], 
                },
                {
                    model: Likes,
                    as: 'likes',
                    attributes: ['userId'],
                },
                {
                    model: Comments,
                    as: 'comments',
                    attributes: ['userId', 'text'],
                    include: [
                        {
                            model: Users,
                            as: 'user',
                            attributes: ['id', 'name'],
                        },
                    ],
                },
            ],
            where: { userId: userId.id }
        });

        // Jika user tidak memiliki postingan
        if (!posts.length) {
            return resMsg.sendResponse(res, 200, true, 'success', []);
        }

        const data = posts.map(post => {
            return {
                id: post.id,
                userId: post.userId,
                img: post.img.url,
                content: post.content,
                uploadTime: new Date(post.createdAt).getTime(),
                user: post.user.name,
                avatar: post.user.profile.avatar ? post.user.profile.avatar.url : null,
                likeCount: post.likes.length,
                comments: post.comments.length
            };
        });

        resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }
});


// exports.getOnePosts = catchAsyncErrors(async (req, res, next) => {
//     const id = req.params.id
//     try {
//         const data = await Posts.findOne({
//             include: [
//                 {
//                     model: Users, // Asosiasi dengan User
//                     as: 'user',
//                     attributes: ['name'],
//                     include: [
//                         {
//                           model: Profile, // Menyertakan model Profile
//                           as: 'profile',
//                           attributes: ['avatar'], // Pilih atribut yang ingin diambil
//                         },
//                       ], // Pilih atribut yang ingin diambil
//                 },
//                 {
//                     model: Likes,
//                     as: 'likes',
//                     attributes: ['userId'],
//                 },
//                 {
//                     model: Comments,
//                     as: 'comments',
//                     attributes: ['userId', 'text','img'],
//                     include: [
//                         {
//                             model: Users,
//                             as: 'user',
//                             attributes: ['id', 'name'], // Pilih atribut yang ingin diambil
//                         },
//                     ],
//                 },
//             ],
//             where: {id: id}
//         });
//         resMsg.sendResponse(res, 200, true, 'success', data);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//         return next(new ErrorHandler('Kesalahan Server.', 500));
//     }
// });

exports.getOnePosts = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    try {
      const posts = await Posts.findOne({
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['name'],
            include: [
              {
                model: Profile,
                as: 'profile',
                attributes: ['avatar'],
              },
            ],
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['userId'],
          },
          {
            model: Comments,
            as: 'comments',
            attributes: ['id','userId', 'text', 'img'],
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'name'],
                include: [
                    {
                      model: Profile,
                      as: 'profile',
                      attributes: ['avatar'],
                    },
                  ],
              },
            ],
          },
        ],
        where: { id: id },
      });

      const data = {
        id: posts.id,
        userId: posts.userId,
        imgContent: posts.img.url,
        content: posts.content,
        uploadTime: new Date(posts.createdAt).getTime(),
        name: posts.user.name,
        avatar: posts.user.profile ? posts.user.profile.avatar.url : null,
        likes: posts.likes.map(like => ({ userId: like.userId })),
        likeCount: posts.likes.length,
        comments: posts.comments.map(comment => ({
            id: comment.id,
            userId: comment.userId,
            text: comment.text,
            img: comment.img ?  comment.img.url  : null,
            user: {
                id: comment.user.id,
                name: comment.user.name,
                avatar: posts.user.profile ? posts.user.profile.avatar.url : null,
            },
        })),
        commentCount: posts.comments.length,
      };
  
      resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
      res.status(500).json({ error: err.message });
      return next(new ErrorHandler('Kesalahan Server.', 500));
    }
  });
  

