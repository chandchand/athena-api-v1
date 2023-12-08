// app.js
const cors = require('cors')
const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/config'); // Import konfigurasi koneksi basis data
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./models');
const ErrorHandler = require('./utils/errorHandlers');
const error = require('./middlewares/errorMiddleware');
const morgan = require('morgan');
// const swaggerJSDoc = require("swagger-jsdoc");
// const swaggerUI = require("swagger-ui-express");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
app.use(morgan('dev'));

// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi : '3.0.0', 
//     info: {
//       title: 'API BACKEND Reblue.id',
//       description: 'Dokumentasi API Reblue.id',
//       version: '1.0.0',
//     },
//     servers:[{
//       url: "http://localhost:3001/api/" 
//     },{
//       url: "https://api.reblue.id/api/" 
//     }]
//   },
//   apis: ['./swagger.yaml'], // Sesuaikan dengan path ke file yang berisi definisi rute Anda
// };

// const specs = swaggerJSDoc(swaggerOptions);

// app.use('/api/api-docs', swaggerUI.serve, swaggerUI.setup(specs));

// Hubungkan ke basis data
// connectDB.testConnection();

db.sequelize.sync({ force: false, logging: (msg) => console.log(`[${db.sequelize.config.environment}] ${msg}`) })
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(cors())

const auth = require('./routes/authRoute');
const user = require('./routes/userRoute');
const timeline = require('./routes/timelineRoute');

app.use('/home', 'Halooo test deploy')
app.use('/api/auth', auth);
app.use('/api/user', user);
app.use('/api/timeline', timeline);
// app.use('/api/tasks', taskRoutes);
app.use('*',( req, res, next)=> { return next( new ErrorHandler("PAGE NOT FOUND", 404)) }), 
app.use(error.errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  // console.log(`Documentasi api dengan swagger: /api/api-docs`);
});
