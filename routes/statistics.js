const express = require('express');
const router = express.Router();
const Statistic = require('../models/Statistic');
const { protect } = require('../middleware/auth');

// ✅ POST /api/statistics — Ajouter une stat
router.post('/', protect, async (req, res) => {
  try {
    const { mode, category, correctAnswers, totalQuestions } = req.body;

    const stat = await Statistic.create({
      user: req.user.id,
      mode,
      category,
      correctAnswers,
      totalQuestions
    });

    res.status(201).json(stat);
  } catch (error) {
    console.error("Create stat error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/statistics/user/:id — Obtenir toutes les stats d’un utilisateur
router.get('/user/:id', async (req, res) => {
  try {
    const stats = await Statistic.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(stats);
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
