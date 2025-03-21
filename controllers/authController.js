const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with that email or username already exists' 
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password request
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist' });
    }
    
    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex');
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Update user with new password
    user.password = hashedPassword;
    await user.save();
    
    // Send email with the temporary password
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io', // Replace with your SMTP server
      port: 2525,
      auth: {
        user: process.env.EMAIL_USER || 'your-mailtrap-user',
        pass: process.env.EMAIL_PASS || 'your-mailtrap-password'
      }
    });
    
    const mailOptions = {
      from: 'noreply@quizmaster.com',
      to: user.email,
      subject: 'QuizMaster Password Reset',
      text: `Your temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately.`,
      html: `<p>Your temporary password is: <strong>${tempPassword}</strong></p><p>Please log in and change your password immediately.</p>`
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Initiate GitHub authentication
exports.githubAuth = (req, res) => {
  // In a real implementation, this would redirect to GitHub's OAuth page
  // For our mock implementation, we'll redirect to our callback with mock data
  const redirectUrl = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  res.redirect(redirectUrl);
};

// Handle GitHub callback
exports.githubCallback = async (req, res) => {
  try {
    const mockGithubId = 'github_' + Date.now();
    const mockEmail = `github_user_${Date.now()}@example.com`;
    const mockUsername = `github_user_${Date.now()}`;
    
    // Check if user already exists
    let user = await User.findOne({ email: mockEmail });
    
    if (!user) {
      // Create a new user
      user = new User({
        username: mockUsername,
        email: mockEmail,
        password: crypto.randomBytes(16).toString('hex'),
        avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      });
      
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Redirect back to the frontend with token and user info
    const userInfo = encodeURIComponent(JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    }));
    
    // In a real app, this would be your frontend URL
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}&user=${userInfo}&provider=github`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Authentication failed`);
  }
};

// Initiate Google authentication
exports.googleAuth = (req, res) => {
  // In a real implementation, this would redirect to Google's OAuth page
  // For our mock implementation, we'll redirect to our callback with mock data
  const redirectUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  res.redirect(redirectUrl);
};

// Handle Google callback
exports.googleCallback = async (req, res) => {
  try {
    const mockGoogleId = 'google_' + Date.now();
    const mockEmail = `google_user_${Date.now()}@example.com`;
    const mockUsername = `google_user_${Date.now()}`;
    
    // Check if user already exists
    let user = await User.findOne({ email: mockEmail });
    
    if (!user) {
      // Create a new user
      user = new User({
        username: mockUsername,
        email: mockEmail,
        password: crypto.randomBytes(16).toString('hex'),
        avatar: 'https://ssl.gstatic.com/images/branding/product/2x/avatar_square_blue_512dp.png'
      });
      
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Redirect back to the frontend with token and user info
    const userInfo = encodeURIComponent(JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    }));
    
    // In a real app, this would be your frontend URL
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}&user=${userInfo}&provider=google`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Authentication failed`);
  }
};
