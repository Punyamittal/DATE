require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

// ==================== CONFIGURATION ====================
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const USE_IN_MEMORY_DB = process.env.USE_IN_MEMORY_DB === 'true';
const IS_VERCEL = process.env.VERCEL === '1';

console.log('Starting server...');
console.log(`Database mode: ${USE_IN_MEMORY_DB ? 'IN-MEMORY DATABASE' : 'MONGODB'}`);
console.log(`Environment: ${IS_VERCEL ? 'VERCEL' : 'LOCAL'}`);

// ==================== DATABASE SETUP ====================
let User, Match, Message;

// Set up database (either in-memory or MongoDB)
if (USE_IN_MEMORY_DB) {
  console.log('Using in-memory database for development');
  
  try {
    // Use in-memory database implementation
    const inMemoryDb = require('./utils/inMemoryDb');
    global.User = inMemoryDb.User;
    global.Match = inMemoryDb.Match;
    global.Message = inMemoryDb.Message;
    
    // Continue with route setup
    setupRoutes();
  } catch (error) {
    console.error('Failed to initialize in-memory database:', error);
    process.exit(1);
  }
} else {
  console.log('Attempting to connect to MongoDB...');
  
  // Only require mongoose when we're using MongoDB
  const mongoose = require("mongoose");
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vit-dating-app')
    .then(() => {
      console.log('MongoDB connected');
      setupRoutes();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('\n===== IMPORTANT =====');
      console.log('Could not connect to MongoDB. To use in-memory database instead:');
      console.log('1. Set USE_IN_MEMORY_DB=true in your .env file');
      console.log('2. Restart the server');
      console.log('=====================\n');
      process.exit(1);
    });
}

// ==================== ROUTES SETUP ====================
function setupRoutes() {
  // Import all routes (models will be loaded properly at this point)
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const matchRoutes = require('./routes/matches');
  const messageRoutes = require('./routes/messages');

  // Set up base routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/messages', messageRoutes);
  
  // Only set up these routes if using MongoDB (optional advanced features)
  if (!USE_IN_MEMORY_DB) {
    try {
      const groupChatRoutes = require('./routes/groupChats');
      const randomChatRoutes = require('./routes/randomChats');
      app.use('/api/group-chats', groupChatRoutes);
      app.use('/api/random-chats', randomChatRoutes);
    } catch (error) {
      console.log('Advanced chat features not available in in-memory mode');
    }
  }

  // Status route for health checks
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      databaseMode: USE_IN_MEMORY_DB ? 'in-memory' : 'mongodb',
      message: USE_IN_MEMORY_DB ? 
        'Running in development mode with in-memory database (data will not persist)' : 
        'Connected to MongoDB database',
      environment: IS_VERCEL ? 'VERCEL' : 'LOCAL'
    });
  });

  // Home route
  app.get('/', (req, res) => {
    res.send('VIT Dating App API is running');
  });

  // In Vercel environment, we export the app
  if (IS_VERCEL) {
    // Skip socket.io setup for serverless
    console.log('Running in serverless mode - skipping socket.io setup');
  } else {
    // Only start the server with socket.io in non-Vercel environments
    startServer();
  }
}

// ==================== SERVER & SOCKET SETUP ====================
function startServer() {
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || "*" } });
  
  // Online users map for socket connections
  let onlineUsers = new Map();
  
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);
    
    // Handle user going online
    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} is online with socket ${socket.id}`);
    });
    
    // Handle private messages
    socket.on("private_message", async (data) => {
      const { receiverId, message, senderId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_message", {
          senderId,
          message
        });
      }
    });
    
    // Handle match requests
    socket.on("match_request", (data) => {
      const { receiverId, sender } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_match_request", {
          matchId: data.matchId,
          sender
        });
      }
    });
    
    // Handle match responses
    socket.on("match_response", (data) => {
      const { senderId, status } = data;
      const senderSocketId = onlineUsers.get(senderId);
      
      if (senderSocketId) {
        io.to(senderSocketId).emit("match_updated", {
          matchId: data.matchId,
          status,
          receiver: data.receiver
        });
      }
    });
    
    // Handle swipe like (Tinder-style)
    socket.on("swipe_like", (data) => {
      const { targetUserId, sender } = data;
      const targetSocketId = onlineUsers.get(targetUserId);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit("new_like", {
          sender
        });
      }
    });
    
    // Handle user disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}`);
    console.log(`Database mode: ${USE_IN_MEMORY_DB ? 'IN-MEMORY (data will not persist)' : 'MONGODB'}`);
  });
}

// For Vercel serverless functions
module.exports = app;
