require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const prisma = require('./src/shared/config/prisma');
const { startPassExpiryCron } = require('./src/shared/cron/passExpiry');
const { connectRedis } = require('./src/shared/config/redis');

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true }
});

// Socket.IO authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join user's personal room for notifications
  socket.join(socket.user.id);
  
  // Join society room for broadcast notices
  if (socket.user.societyId) {
    socket.join(`society_${socket.user.societyId}`);
  }
  
  console.log(`[Socket] User ${socket.user.id} connected`);

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${socket.user.id} disconnected`);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected via Prisma');

    await connectRedis();

    // Start cron jobs
    startPassExpiryCron();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`SocietyOS API running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
};

start();