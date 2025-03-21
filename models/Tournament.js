const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  accessCode: {
    type: String,
    default: ''
  },
  minPlayers: {
    type: Number,
    default: 4
  },
  maxPlayers: {
    type: Number,
    default: 10
  },
  category: {
    type: String,
    enum: ['General Knowledge', 'Science', 'Geography', 'History', 'Sport & Leisure', 'Art & Literature'],
    default: 'General Knowledge'
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'playing', 'finished'],
      default: 'waiting'
    },
    finishTime: {
      type: Date
    }
  }],
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', TournamentSchema);