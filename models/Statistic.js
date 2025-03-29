// models/Statistic.js
const mongoose = require("mongoose");

const StatisticSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ["solo", "Duo", "Tournament"], required: true },
  category: { type: String },
  correctAnswers: Number,
  totalQuestions: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Statistic", StatisticSchema);
