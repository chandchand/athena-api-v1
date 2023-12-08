require('dotenv').config();

// module.exports = {
//   development: {
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     dialect: 'postgres',
//     environment: 'development', 
//     production: process.env.DATABASE_URL
//   },
//   // production: {
//   //   // Konfigurasi produksi (jika diperlukan)
//   //   username: process.env.DB_PROD_USERNAME,
//   //   password: process.env.DB_PROD_PASSWORD,
//   //   database: process.env.DB_PROD_NAME,
//   //   host: process.env.DB_PROD_HOST,
//   //   dialect: 'postgres',
//   //   environment: 'production', // Tambahkan properti environment
//   // },
// };

module.exports = {

  development: {
 
    username: process.env.DB_USERNAME,
 
    password: process.env.DB_PASSWORD,
 
    database: process.env.DB_NAME,
 
    host: process.env.DB_HOST,
 
    dialect: 'postgres',
 
    environment: 'development',
 
  },
 
  production: process.env.DATABASE_URL,
};