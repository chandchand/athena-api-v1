const catchAsyncErrors = require("../middlewares/catchAsyncError")
const ErrorHandler = require("../utils/errorHandlers")
const resMsg = require('../utils/resMsg')
const db = require ('../models')
const Profile = require("../models/profile")(db.sequelize)
const {Users, Posts, Likes, Comments, Follows } = require("../models");
const cloudinary = require("../utils/cloudinary");
const { Op, Sequelize } = require("sequelize");

exports.searchUsers = catchAsyncErrors(async (req, res, next) => {
  const { keywords } = req.query;

  try {
    if (!keywords) {
      resMsg.sendResponse(res, 400, false, `Keywords dipelukan`, null);
    }

    const data = await Users.findAll({
      where: {
        name: {
          [Op.iLike]: `%${keywords}%`,
        },
      },
      attributes: ["id", "name"],
      include: [
        {
          model: Profile,
          attributes: ["avatar", "username"],
        },
      ],
    });

    if (data.length === 0) {
      resMsg.sendResponse(
        res,
        404,
        false,
        `Tidak ada data pencarian terhadap ${keywords}`,
        null
      );
    } else {
      const userData = data.map((user) => ({
        id: user.id,
        name: user.name,
        avatar: user.Profile.avatar ? user.Profile.avatar.url : null, // Check if Profile exists
        username: user.Profile ? user.Profile.username : null, // Add "username" attribute if it exists
      }));

      resMsg.sendResponse(res, 200, true, "success", userData);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.follows = catchAsyncErrors(async (req, res, next) => {
  const followerId = req.user.id;
  const followingId = req.params.id;

  try {
    const findUser = await Users.findByPk(followingId);

    if (!findUser) {
      resMsg.sendResponse(
        res,
        200,
        true,
        `User dengan nama ${findUser.name} tidak ada`,
        data
      );
      return next(
        new ErrorHandler(`User dengan nama ${findUser.name} tidak ada`, 404)
      );
    }

    const data = Follows.create({
      followerId: followerId,
      followingId: followingId,
    });

    resMsg.sendResponse(
      res,
      200,
      true,
      `Anda mengikuti ${findUser.name}`,
      data
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.unfollow = catchAsyncErrors(async (req, res, next) => {
  const followerId = req.user.id;
  const followingId = req.params.id;

  try {
    const findUser = await Users.findByPk(followingId);

    if (!findUser) {
      resMsg.sendResponse(
        res,
        200,
        true,
        `User dengan nama ${findUser.name} tidak ada`,
        data
      );
      return next(
        new ErrorHandler(`User dengan nama ${findUser.name} tidak ada`, 404)
      );
    }

    const followEntry = await Follows.findOne({
      where: {
        followerId: followerId,
        followingId: followingId,
      },
    });

    if (!followEntry) {
      return res
        .status(404)
        .json({ error: "Tidak ada entri follow yang ditemukan" });
    }

    await followEntry.destroy();

    resMsg.sendResponse(
      res,
      200,
      true,
      `Anda Tidak mengikuti ${findUser.name}`
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.createPost = catchAsyncErrors(async (req, res, next) => {
  const { content } = req.body;
  const userId = req.user;

  try {
    let imagePath = "";

    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        // Perubahan di sini
        folder: "post",
      });

      imagePath = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    const data = await Posts.create({
      userId: userId.id,
      img: imagePath,
      content,
      createdAt: new Date(),
    });
    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.editPost = catchAsyncErrors(async (req, res, next) => {
  const { content } = req.body;
  const id = req.params.id;

  try {
    let imagePath = "";

    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "post",
      });

      imagePath = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    console.log(content);
    console.log(id);
    // Periksa apakah post dengan ID tersebut ada
    const existingPost = await Posts.findByPk(id);

    if (!existingPost) {
      return res.status(404).json({ error: "Post tidak ditemukan" });
    }

    // Lakukan update post
    const data = await existingPost.update({
      img: imagePath || existingPost.img, // Gunakan gambar lama jika tidak ada gambar baru
      content,
      // Tidak perlu mengatur createdAt secara manual
    });

    resMsg.sendResponse(res, 200, true, "success edit post", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.deletePost = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;

  try {
    // Temukan postingan yang akan dihapus
    const postToDelete = await Posts.findByPk(id);

    if (!postToDelete) {
      return res.status(404).json({ error: "Postingan tidak ditemukan" });
    }

    // Hapus semua komentar terkait dengan postingan
    await Comments.destroy({
      where: { postId: postToDelete.id },
    });

    // Hapus semua likes terkait dengan postingan
    await Likes.destroy({
      where: { postId: postToDelete.id },
    });

    // Hapus postingan itu sendiri
    await postToDelete.destroy();
    resMsg.sendResponse(res, 200, true, "success data deleted");
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.like = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    const existingLike = await Likes.findOne({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingLike) {
      return resMsg.sendResponse(
        res,
        200,
        true,
        "success",
        "Post already liked by you"
      );
    }

    const data = await Likes.create({
      userId: userId,
      postId: postId,
      createdAt: new Date(),
    });
    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

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
      return resMsg.sendResponse(
        res,
        200,
        true,
        "success",
        "Post already disliked"
      );
    }

    // Jika like ditemukan, hapus like
    await like.destroy();

    resMsg.sendResponse(res, 200, true, "success", "Disliked successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.comment = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.user;
  const { text } = req.body;

  try {
    let imagePath = "";

    // Periksa apakah pengguna mengunggah gambar
    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "post/comment",
      });

      imagePath = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    const data = await Comments.create({
      userId: userId.id,
      postId: postId,
      text,
      img: imagePath,
      createdAt: new Date(),
    });

    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  try {
    const comment = await Comments.findByPk(id);

    if (!comment) {
      return next(new ErrorHandler("Komentar tidak ditemukan", 404));
    }

    if (comment.userId !== req.user.id) {
      return next(
        new ErrorHandler(
          "Anda tidak memiliki izin untuk menghapus komentar ini",
          403
        )
      );
    }

    await comment.destroy();

    resMsg.sendResponse(res, 200, true, "success", "Comment Deleted");
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.getPosts = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  try {
    followingUsers = await Follows.findAll({
      where: { followerId: userId },
      attributes: ["followingId"],
    });

    const userAndFollowingIds = [
      ...followingUsers.map((user) => user.followingId),
      userId,
    ];

    const randomThreshold = Math.floor(Math.random() * 20) + 1
    console.log("random number ", randomThreshold);

    const posts = await Posts.findAll({
      where: {
        [Op.or]: [
          { userId: userAndFollowingIds },
          Sequelize.literal(
            `(SELECT COUNT(*) FROM "Likes" WHERE "Likes"."postId" = "Posts"."id") >= ${randomThreshold}`
          ),
        ],
      },
      include: [
        {
          model: Users, // Asosiasi dengan User
          as: "user",
          attributes: ["name"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["avatar", "username"],
            },
          ],
        },
        {
          model: Likes,
          as: "likes",
          attributes: ["userId"],
        },
        {
          model: Comments,
          as: "comments",
          attributes: ["userId", "text"],
          include: [
            {
              model: Users,
              as: "user",
              attributes: ["id", "name"],
              include: [
                {
                  model: Profile,
                  as: "profile",
                  attributes: ["avatar"],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // const filteredPosts = posts.filter((post) => post.likes.length >= 1);

    const data = posts.map((post) => {
      const isLiked = post.likes.some((like) => like.userId === userId);
      const isMy = post.userId === userId;
      return {
        id: post.id,
        userId: post.userId,
        img: post.img.url, // Ambil url dari objek img
        content: post.content,
        uploadTime: new Date(post.createdAt).getTime(),
        name: post.user.name,
        username: post.user.profile.username,
        avatar: post.user.profile.avatar ? post.user.profile.avatar.url : null,
        likeCount: post.likes.length, // Hitung jumlah likes
        comments: post.comments.length,
        isLiked: isLiked,
        isMyPost: isMy,
      };
    });

    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.getAllPostsById = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  try {
    // Pastikan userId memiliki nilai dan userId.id memiliki nilai
    if (!userId) {
      return resMsg.sendResponse(res, 400, false, "User ID tidak valid", null);
    }

    const posts = await Posts.findAll({
      include: [
        {
          model: Users,
          as: "user",
          attributes: ["name"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["avatar", "username"],
            },
          ],
        },
        {
          model: Likes,
          as: "likes",
          attributes: ["userId"],
        },
        {
          model: Comments,
          as: "comments",
          attributes: ["userId", "text"],
          include: [
            {
              model: Users,
              as: "user",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      where: { userId: userId },
    });

    // Jika user tidak memiliki postingan
    if (!posts.length) {
      return resMsg.sendResponse(res, 200, true, "success", []);
    }

    const data = posts.map((post) => {
      const isLiked = post.likes.some((like) => like.userId === userId);
      const isMy = post.userId === userId;
      return {
        id: post.id,
        userId: post.userId,
        img: post.img.url,
        content: post.content,
        uploadTime: new Date(post.createdAt).getTime(),
        name: post.user.name,
        username: post.user.profile.username,
        avatar: post.user.profile.avatar ? post.user.profile.avatar.url : null,
        likeCount: post.likes.length,
        comments: post.comments.length,
        isLiked: isLiked,
        isMyPost: isMy,
      };
    });

    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});

exports.getMyPosts = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user.id;
    try {
        // Pastikan userId memiliki nilai dan userId.id memiliki nilai
        if (!userId) {
            return resMsg.sendResponse(res, 400, false, 'User ID tidak valid', null);
        }

        const posts = await Posts.findAll({
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['name',],
                    include: [
                        {
                          model: Profile,
                          as: 'profile',
                          attributes: ['avatar','username'],
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
            where: { userId: userId }
        });

        // Jika user tidak memiliki postingan
        if (!posts.length) {
            return resMsg.sendResponse(res, 200, true, 'success', []);
        }

        const data = posts.map(post => {
            const isLiked = post.likes.some(like => like.userId === userId)
            const isMy = post.userId === userId; 
            return {
                id: post.id,
                userId: post.userId,
                img: post.img.url,
                content: post.content,
                uploadTime: new Date(post.createdAt).getTime(),
                name: post.user.name,
                username: post.user.profile.username,
                avatar: post.user.profile.avatar ? post.user.profile.avatar.url : null,
                likeCount: post.likes.length,
                comments: post.comments.length,
                isLiked: isLiked,
                isMyPost: isMy,
            };
        });

        resMsg.sendResponse(res, 200, true, 'success', data);
    } catch (err) {
        res.status(500).json({ error: err.message });
        return next(new ErrorHandler('Kesalahan Server.', 500));
    }

});

exports.getOnePosts = catchAsyncErrors(async (req, res, next) => {
    const _userId = req.user.id;
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
                attributes: ['avatar','username'],
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
                      attributes: ['avatar','username'],
                    },
                  ],
              },
            ],
          },
        ],
        where: { id: id },
      });

    // Dapatkan pengikut pengguna saat ini
    const currentUserFollowers = await Follows.findAll({
      where: { followerId: _userId },
    });

    // Periksa apakah pengguna yang melakukan posting ada di dalam daftar pengikut
    const isUserFollowed = currentUserFollowers.some(
      (follower) => follower.followingId === posts.userId
    );

    const data = {
      id: posts.id,
      userId: posts.userId,
      imgContent: posts.img ? posts.img.url : null,
      content: posts.content,
      uploadTime: new Date(posts.createdAt).getTime(),
      name: posts.user.name,
      username: posts.user.profile.username,
      avatar: posts.user.profile.avatar ? posts.user.profile.avatar.url : null,
      likes: posts.likes.map((like) => ({ userId: like.userId })),
      likeCount: posts.likes.length,
      comments: posts.comments.map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        text: comment.text,
        img: comment.img ? comment.img.url : null,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          username: comment.user.profile.username,
          avatar: comment.user.profile.avatar
            ? comment.user.profile.avatar.url
            : null,
        },
      })),
      commentCount: posts.comments.length,
      isLiked: posts.likes.some((like) => like.userId === _userId),
      isMyPost: posts.userId === _userId,
      isFollowed: isUserFollowed,
    };
    // Jika bukan postingan pengguna sendiri, lanjutkan dengan respons normal
    resMsg.sendResponse(res, 200, true, "success", data);
  } catch (err) {
    res.status(500).json({ error: err.message });
    return next(new ErrorHandler("Kesalahan Server.", 500));
  }
});
  


