'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phone_number: {
        type: Sequelize.STRING
      },
      new_phone_number: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      nim: {
        type: Sequelize.STRING
      },
      otp: {
        type: Sequelize.STRING
      },
      number_change_otp: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER
      },
      role: {
        type: Sequelize.ENUM({
          values: ['user', 'admin'],
        }),
        defaultValue: 'user',
      },
      last_otp_sent_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};