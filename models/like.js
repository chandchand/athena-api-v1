const { v4: uuidv4 } = require('uuid');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Likes = sequelize.define('Likes', {
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { // Define the foreign key constraint
        model: 'Posts', // Reference the `Users` model
        key: 'id',
      },
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

  Likes.associate = (models) => {
    Likes.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
    Likes.belongsTo(models.Posts, { foreignKey: 'postId', as: 'post' });
  };

  return Likes;
  
};

