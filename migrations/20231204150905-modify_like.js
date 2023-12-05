'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Likes", "createdAt", {
      type: Sequelize.DATE,
      allowNull: true,
    }),
    await queryInterface.addColumn("Likes", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    })
    /**
     * Add altering commands here.
     *
     * Example:
    */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
