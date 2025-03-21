const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: String,
    answer: Number,
    isCorrect: Boolean,
    answerTime: Number, // in seconds
    points: Number
  }],
  status: {
    type: String,
    enum: ['waiting', 'ready', 'playing', 'finished'],
    default: 'waiting'
  }
});

const GameSessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['solo', 'duo', 'tournament'],
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  category: {
    type: String,
    enum: ['General Knowledge', 'Science', 'Geography', 'History', 'Sport & Leisure', 'Art & Literature'],
    default: 'General Knowledge'
  },
  players: [PlayerSchema],
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  roomId: {
    type: String,
    unique: true
  },
  messages: [{
    user: String,
    message: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('GameSession', GameSessionSchema);