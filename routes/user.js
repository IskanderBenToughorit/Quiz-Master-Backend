const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// 📌 GET /api/users/profile/:id
// Récupérer les infos d’un utilisateur (sans mot de passe ni email)
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 PUT /api/users/profile
// Mettre à jour le profil (nom, avatar, bio)
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 PUT /api/users/stats
// Mettre à jour les statistiques personnelles de l'utilisateur
router.put('/stats', protect, async (req, res) => {
  try {
    const { totalGames, wins, correctAnswers, totalQuestions } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Sécurité : vérifier que chaque champ est bien un nombre
    if (typeof totalGames === 'number') {
      user.stats.totalGames += totalGames;
    }

    if (typeof wins === 'number') {
      user.stats.wins += wins;
    }

    if (typeof correctAnswers === 'number') {
      user.stats.correctAnswers += correctAnswers;
    }

    if (typeof totalQuestions === 'number') {
      user.stats.totalQuestions += totalQuestions;
    }

    await user.save();

    res.status(200).json({
      message: 'Statistiques mises à jour avec succès',
      stats: user.stats,
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
