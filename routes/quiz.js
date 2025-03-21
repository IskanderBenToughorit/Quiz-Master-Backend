
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { protect} = require('../middleware/auth');

// Get all public quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublic: true })
      .populate('createdBy', 'username avatar')
      .select('-questions.correctAnswer');
    
    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz by ID (without correct answers for players)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .select('-questions.correctAnswer');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get full quiz with answers (for quiz creators or admins)
router.get('/:id/full', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username avatar');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user is creator or has admin rights
    if (quiz.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Get full quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new quiz
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, questions, isPublic, timeLimit } = req.body;
    
    const newQuiz = new Quiz({
      title,
      description,
      category,
      questions,
      createdBy: req.user.id,
      isPublic,
      timeLimit
    });
    
    await newQuiz.save();
    
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quiz
router.put('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user is creator
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { title, description, category, questions, isPublic, timeLimit } = req.body;
    
    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.category = category || quiz.category;
    quiz.questions = questions || quiz.questions;
    quiz.isPublic = isPublic !== undefined ? isPublic : quiz.isPublic;
    quiz.timeLimit = timeLimit || quiz.timeLimit;
    
    await quiz.save();
    
    res.json(quiz);
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete quiz
router.delete('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user is creator
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await quiz.remove();
    
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
