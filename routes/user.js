
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
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

// Update user stats
router.put('/stats', protect, async (req, res) => {
  try {
    const { 
      totalGames, 
      wins, 
      correctAnswers, 
      totalQuestions 
    } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update stats
    if (totalGames !== undefined) user.stats.totalGames += totalGames;
    if (wins !== undefined) user.stats.wins += wins;
    if (correctAnswers !== undefined) user.stats.correctAnswers += correctAnswers;
    if (totalQuestions !== undefined) user.stats.totalQuestions += totalQuestions;
    
    await user.save();
    
    res.json(user.stats);
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('username avatar stats')
      .sort({ 'stats.wins': -1 })
      .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
