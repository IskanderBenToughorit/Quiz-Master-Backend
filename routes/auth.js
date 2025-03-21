const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user
router.get('/me', protect, authController.getCurrentUser);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Change password
router.post('/change-password', protect, authController.changePassword);

// GitHub authentication
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

// Google authentication
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

module.exports = router;