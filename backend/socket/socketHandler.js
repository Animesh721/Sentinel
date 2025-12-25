import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketIO = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.user.organization})`);

    // Join organization room for multi-tenant isolation
    socket.join(socket.user.organization);

    // Handle video progress subscription
    socket.on('video:subscribe', (videoId) => {
      socket.join(`video:${videoId}`);
      console.log(`User ${socket.user.username} subscribed to video ${videoId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
};

