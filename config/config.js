require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    
  },
  production: {
    // Konfigurasi produksi (jika diperlukan)
  },
};

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  // Konfigurasi basis data Anda
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: console.log,
});

global.sequelize = sequelize;