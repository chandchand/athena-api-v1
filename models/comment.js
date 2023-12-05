const { v4: uuidv4 } = require('uuid');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comments = sequelize.define('Comments', {
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
    img: {
      type: DataTypes.JSONB, // Menggunakan JSONB untuk menyimpan data avatar
      allowNull: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: true,
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

  Comments.associate = (models) => {
    Comments.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
    Comments.belongsTo(models.Posts, { foreignKey: 'postId', as: 'post' });
  };

  return Comments;
  
};

