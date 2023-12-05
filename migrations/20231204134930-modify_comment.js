'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Comments", "img", {
      type: Sequelize.JSONB,
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
