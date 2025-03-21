
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');
const tournamentRoutes = require('./routes/tournament');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI )
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tournament', tournamentRoutes);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join chat room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });
  
  // Listen for chat messages
  socket.on('chatMessage', (data) => {
    io.to(data.roomId).emit('message', {
      id: Date.now(),
      user: data.user,
      message: data.message,
      timestamp: Date.now()
    });
  });
  
  // Handle game events
  socket.on('joinGame', (data) => {
    // Add user to game room
    socket.join(data.gameId);
    // Notify room about new player
    io.to(data.gameId).emit('playerJoined', {
      playerId: socket.id,
      username: data.username
    });
  });
  
  // Handle answer submission
  socket.on('submitAnswer', (data) => {
    io.to(data.gameId).emit('answerSubmitted', {
      playerId: socket.id,
      questionId: data.questionId,
      answer: data.answer,
      isCorrect: data.isCorrect,
      points: data.points
    });
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
