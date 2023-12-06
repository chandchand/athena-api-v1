const { v4: uuidv4 } = require('uuid');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Posts = sequelize.define('Posts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { // Define the foreign key constraint
        model: 'Users', // Reference the `Users` model
        key: 'id',
      },
    },
    img: {
      type: DataTypes.JSONB, // Menggunakan JSONB untuk menyimpan data avatar
      allowNull: true,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
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
  });

  Posts.associate = (models) => {
    Posts.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
    Posts.hasMany(models.Likes, { foreignKey: 'postId', as: 'likes' });
    Posts.hasMany(models.Comments, { foreignKey: 'postId', as: 'comments' });
  };

  return Posts;
  
};

