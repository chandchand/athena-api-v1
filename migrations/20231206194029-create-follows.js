'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      followerId: {
        type: Sequelize.UUID
      },
      followingId: {
        type: Sequelize.UUID
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Follows');
  }
};