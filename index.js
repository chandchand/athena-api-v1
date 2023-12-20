// app.js
const cors = require('cors')
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./models');
const connectDB = require('./config/mongoDB');
const ErrorHandler = require('./utils/errorHandlers');
const error = require('./middlewares/errorMiddleware');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const { setupSocket } = require('./utils/socketIo'); 

dotenv.config();

const app = express();

const server = http.createServer(app);
const io = socketIO(server, {
    cors:
    {
      origin: "*"
     }
});

setupSocket(io);
console.log(setupSocket(io));

const PORT = process.env.PORT || 8000;
app.use(morgan('dev'));

connectDB();

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
const chat = require('./routes/chatRoute');
const timeline = require('./routes/timelineRoute');

app.get("/api/", (req,res) => {
  res.send("Hello Word")
})

app.use('/api/auth', auth);
app.use('/api/user', user);
app.use('/api/chat', chat);
app.use('/api/timeline', timeline);
// app.use('/api/tasks', taskRoutes);
app.use('*',( req, res, next)=> { return next( new ErrorHandler("PAGE NOT FOUND", 404)) }), 
app.use(error.errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  // console.log(`Documentasi api dengan swagger: /api/api-docs`);
});
