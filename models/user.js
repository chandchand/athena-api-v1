const { v4: uuidv4 } = require('uuid');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Users = sequelize.define('Users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    new_phone_number: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nim: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
    },
    number_change_otp: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    role: {
      type: DataTypes.ENUM({
        values: ['user', 'admin'],
      }),
      defaultValue: 'user',
    },

    last_otp_sent_at: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    createdAt:{
      type: DataTypes.DATE,
      defaultValue: new Date(),
    },
    updatedAt:{
      type: DataTypes.DATE,
      defaultValue: new Date(),
    }
  }, {
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    hooks: {
      beforeUpdate: (user, options) => {
        if (user.changed('otp')) {
          user.last_otp_sent_at = new Date();
        }
      },
    },
  });

  Users.associate = (models) => {
    Users.hasMany(models.Posts, { foreignKey: 'userId', as: 'posts' });
    Users.hasMany(models.Likes, { foreignKey: 'userId', as: 'likes' });
    Users.hasMany(models.Comments, { foreignKey: 'userId', as: 'comments' });
    Users.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile' });
  };

  Users.associate = (models) => {
    Users.belongsToMany(models.Users, {
      through: 'Follows',  
      as: 'followers',    
      foreignKey: 'followingId',  
    });

    Users.belongsToMany(models.Users, {
      through: 'Follows',
      as: 'following',   
      foreignKey: 'followerId',  
    });
  };

  return Users;
  
};

