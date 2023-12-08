const dotenv = require('dotenv');
dotenv.config();
const { v4: uuidv4 } = require('uuid');

const { DataTypes } = require('sequelize'); // Sesuaikan dengan path file Anda

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },

    avatar: {
      type: DataTypes.JSONB, // Menggunakan JSONB untuk menyimpan data avatar
      allowNull: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { // Define the foreign key constraint
        model: 'Users', // Reference the `Users` model
        key: 'id',
      },
    },

    email: {
      type: DataTypes.STRING,
    },

    gender: {
      type: DataTypes.ENUM({
        values: ['pria', 'wanita'],
      }),
    },

    bio: {
      type: DataTypes.TEXT,
    },
  }, {
    hooks: {
      beforeCreate: (profile) => {
        if (profile.avatar && profile.avatar.public_id) {
          profile.avatar.url = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/${profile.avatar.public_id}`;
        }
      },
      beforeUpdate: (profile) => {
        if (profile.changed('avatar') && profile.avatar && profile.avatar.public_id) {
          profile.avatar.url = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/${profile.avatar.public_id}`;
        }
      },
    },
  });

  Profile.associate = (models) => {
    // Associate Profile with followers
    Profile.belongsToMany(models.Users, {
      through: 'Follows',
      as: 'followers', // This should match the alias used in Users model
      foreignKey: 'followingId',
      otherKey: 'followerId', // Add this line to specify the other key
    });
  
    // Associate Profile with following
    Profile.belongsToMany(models.Users, {
      through: 'Follows',
      as: 'following', // This should match the alias used in Users model
      foreignKey: 'followerId',
      otherKey: 'followingId', // Add this line to specify the other key
    });
  };
  return Profile;
};
