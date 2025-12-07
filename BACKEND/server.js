const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const bookingRoutes = require('./routes/bookings');
const messageRoutes = require('./routes/messages');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { socketAuth } = require('./middleware/socketAuth');

const app = express();
// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);

// Socket.IO connection handling
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Join user to their team rooms
  socket.on('join_teams', (teamIds) => {
    teamIds.forEach(teamId => {
      socket.join(`team_${teamId}`);
    });
  });

  // Join user to a specific team room
  socket.on('join_team', (teamId) => {
    console.log(`User ${socket.userId} joining team room: team_${teamId}`);
    socket.join(`team_${teamId}`);
  });

  // Leave a specific team room
  socket.on('leave_team', (teamId) => {
    console.log(`User ${socket.userId} leaving team room: team_${teamId}`);
    socket.leave(`team_${teamId}`);
  });

  // Handle booking events
  socket.on('booking_request', (data) => {
    // Emit to item owner
    socket.to(`user_${data.ownerId}`).emit('new_booking_request', data);
  });

  socket.on('booking_approved', (data) => {
    // Emit to renter
    socket.to(`user_${data.renterId}`).emit('booking_approved', data);
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, listingId, content } = data;
      if (!receiverId || !content || content.trim().length === 0) {
        throw new Error('Missing required fields: receiverId or content');
      }

      // Accept 'general' as a valid listingId for general chat
      let finalListingId = listingId;
      if (listingId === 'general') {
        finalListingId = undefined;
      }

      // Save message to database
      const Message = require('./models/Message');
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        ...(finalListingId ? { listingId: finalListingId } : {}),
        content: content.trim()
      });

      await message.save();
      await message.populate('senderId', 'name email');

      // Emit to receiver
      socket.to(`user_${receiverId}`).emit('new_message', {
        message,
        listingId,
        senderId: socket.userId
      });

      // Confirm message sent to sender
      socket.emit('message_sent', { message });

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message_error', { error: error.message || 'Failed to send message' });
    }
  });

  // Handle team messages
  socket.on('send_team_message', async (data) => {
    try {
      const { teamId, content } = data;
      if (!teamId || !content || content.trim().length === 0) {
        throw new Error('Missing required fields: teamId or content');
      }

      // Check if user is a member of the team
      const Team = require('./models/Team');
      const team = await Team.findById(teamId);
      if (!team || !team.members.includes(socket.userId)) {
        throw new Error('User is not a member of this team');
      }

      // Save team message to database
      const Message = require('./models/Message');
      const message = new Message({
        senderId: socket.userId,
        teamId: teamId,
        content: content.trim(),
        type: 'group'
      });

      await message.save();
      await message.populate('senderId', 'name email');

      // Emit to all team members in the team room
      socket.to(`team_${teamId}`).emit('new_team_message', {
        message,
        teamId,
        senderId: socket.userId
      });

      // Also emit to sender (for UI consistency)
      socket.emit('team_message_sent', { message });

    } catch (error) {
      console.error('Socket team message error:', error);
      socket.emit('team_message_error', { error: error.message || 'Failed to send team message' });
    }
  });

  // Handle joining team rooms
  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`User ${socket.userId} joined team room: team_${teamId}`);
  });

  // Handle leaving team rooms
  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`User ${socket.userId} left team room: team_${teamId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`user_${data.receiverId}`).emit('user_typing', {
      userId: socket.userId,
      listingId: data.listingId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`user_${data.receiverId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      listingId: data.listingId
    });
  });

  // Handle team task updates
  socket.on('task_updated', (data) => {
    socket.to(`team_${data.teamId}`).emit('task_updated', data);
  });

  // ===== VIDEO CALL EVENTS =====

  // Team Video Call Events
  socket.on('videoCall:join', (data) => {
    const { teamId, userId, userName, callId, isTeamCall } = data;
    console.log(`User ${userId} (${userName}) joining video call in team ${teamId}`);
    
    // Store call info
    socket.callId = callId;
    socket.teamId = teamId;
    
    // Notify other participants in the team that someone joined
    socket.to(`team_${teamId}`).emit('videoCall:user-joined', {
      userId,
      userName,
      callId
    });
  });

  socket.on('videoCall:offer', (data) => {
    const { to, offer, from, fromName } = data;
    console.log(`Video call offer from ${from} to ${to}`);
    
    // Send offer to specific user
    io.to(`user_${to}`).emit('videoCall:offer', {
      offer,
      from,
      fromName,
      callId: socket.callId
    });
  });

  socket.on('videoCall:answer', (data) => {
    const { to, answer, from } = data;
    console.log(`Video call answer from ${from} to ${to}`);
    
    // Send answer to specific user
    io.to(`user_${to}`).emit('videoCall:answer', {
      answer,
      from
    });
  });

  socket.on('videoCall:ice-candidate', (data) => {
    const { to, candidate, from } = data;
    
    // Forward ICE candidate to specific user
    io.to(`user_${to}`).emit('videoCall:ice-candidate', {
      candidate,
      from
    });
  });

  socket.on('videoCall:toggle-audio', (data) => {
    const { teamId, userId, enabled } = data;
    
    // Notify team members about audio status change
    socket.to(`team_${teamId}`).emit('videoCall:audio-toggled', {
      userId,
      enabled
    });
  });

  socket.on('videoCall:toggle-video', (data) => {
    const { teamId, userId, enabled } = data;
    
    // Notify team members about video status change
    socket.to(`team_${teamId}`).emit('videoCall:video-toggled', {
      userId,
      enabled
    });
  });

  socket.on('videoCall:leave', (data) => {
    const { teamId, userId } = data;
    console.log(`User ${userId} leaving video call in team ${teamId}`);
    
    // Notify other participants
    socket.to(`team_${teamId}`).emit('videoCall:user-left', {
      userId
    });
  });

  // ===== PERSONAL VIDEO CALL EVENTS =====

  socket.on('personalCall:initiate', (data) => {
    const { to, offer, from, fromName, callId } = data;
    console.log(`Personal video call initiated from ${from} to ${to}`);
    
    // Store call info on socket
    socket.personalCallId = callId;
    socket.personalCallWith = to;
    
    // Send call initiation to recipient
    io.to(`user_${to}`).emit('personalCall:incoming', {
      offer,
      from,
      fromName,
      callId
    });
  });

  socket.on('personalCall:offer', (data) => {
    const { to, offer, from } = data;
    
    // Send offer to specific user
    io.to(`user_${to}`).emit('personalCall:offer', {
      offer,
      from
    });
  });

  socket.on('personalCall:answer', (data) => {
    const { to, answer, from } = data;
    console.log(`Personal call answer from ${from} to ${to}`);
    
    // Send answer to specific user
    io.to(`user_${to}`).emit('personalCall:answer', {
      answer,
      from
    });
  });

  socket.on('personalCall:accept', (data) => {
    const { to, from, callId } = data;
    console.log(`Personal call accepted by ${from}`);
    
    // Notify caller that call was accepted
    io.to(`user_${to}`).emit('personalCall:accepted', {
      from,
      callId
    });
  });

  socket.on('personalCall:reject', (data) => {
    const { to, from, callId } = data;
    console.log(`Personal call rejected by ${from}`);
    
    // Notify caller that call was rejected
    io.to(`user_${to}`).emit('personalCall:rejected', {
      from,
      callId
    });
  });

  socket.on('personalCall:ice-candidate', (data) => {
    const { to, candidate, from } = data;
    
    // Forward ICE candidate to specific user
    io.to(`user_${to}`).emit('personalCall:ice-candidate', {
      candidate,
      from
    });
  });

  socket.on('personalCall:end', (data) => {
    const { to, from, callId } = data;
    console.log(`Personal call ended from ${from} to ${to}`);
    
    // Notify recipient that call has ended
    io.to(`user_${to}`).emit('personalCall:ended', {
      from,
      callId
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Notify team members if user was in a video call
    if (socket.teamId) {
      socket.to(`team_${socket.teamId}`).emit('videoCall:user-left', {
        userId: socket.userId
      });
    }
    
    // Notify personal call recipient if in a call
    if (socket.personalCallWith) {
      io.to(`user_${socket.personalCallWith}`).emit('personalCall:ended', {
        from: socket.userId
      });
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'sharespace'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`
🚀 ShareSpace Server Running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health Check: http://localhost:${PORT}/health
    `);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

startServer();