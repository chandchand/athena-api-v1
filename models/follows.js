const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Follows = sequelize.define('Follows', {
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  return Follows;
};