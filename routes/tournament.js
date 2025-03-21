const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const GameSession = require('../models/GameSession');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Get all tournaments (public and private)
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('createdBy', 'username avatar')
      .populate('quiz', 'title category')
      .select(req.query.includePrivate === 'true' ? '' : '-accessCode');
    
    res.json(tournaments);
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new tournament
router.post('/', protect, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      quizId, 
      isPrivate, 
      minPlayers, 
      maxPlayers,
      category 
    } = req.body;
    
    // Generate access code for private tournaments
    let accessCode = '';
    if (isPrivate) {
      accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    
    const newTournament = new Tournament({
      name,
      description,
      quiz: quizId,
      createdBy: req.user.id,
      isPrivate,
      accessCode,
      minPlayers: minPlayers || 4,
      maxPlayers: maxPlayers || 10,
      players: [{ user: req.user.id, status: 'ready' }],
      category: category || 'General Knowledge' // Add category with default
    });
    
    await newTournament.save();
    
    // Create game session for the tournament
    const gameSession = new GameSession({
      type: 'tournament',
      quiz: quizId,
      tournament: newTournament._id,
      players: [{ user: req.user.id, status: 'ready' }],
      roomId: `tournament_${newTournament._id}`,
      category: category || 'General Knowledge' // Add category to game session
    });
    
    await gameSession.save();
    
    res.status(201).json({
      tournament: await newTournament.populate([
        { path: 'createdBy', select: 'username avatar' },
        { path: 'quiz', select: 'title category' }
      ]),
      gameSessionId: gameSession._id
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .populate('quiz', 'title category description')
      .populate('players.user', 'username avatar');
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join tournament
router.post('/:id/join', protect, async (req, res) => {
  try {
    const { accessCode } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if tournament is private and verify access code
    if (tournament.isPrivate && tournament.accessCode !== accessCode) {
      return res.status(403).json({ message: 'Invalid access code' });
    }
    
    // Check if tournament is already full
    if (tournament.players.length >= tournament.maxPlayers) {
      return res.status(400).json({ message: 'Tournament is already full' });
    }
    
    // Check if user is already in the tournament
    const playerExists = tournament.players.some(
      player => player.user.toString() === req.user.id
    );
    
    if (playerExists) {
      return res.status(400).json({ message: 'You have already joined this tournament' });
    }
    
    // Add player to tournament
    tournament.players.push({
      user: req.user.id,
      status: 'waiting'
    });
    
    await tournament.save();
    
    // Add player to game session
    const gameSession = await GameSession.findOne({ tournament: tournament._id });
    
    if (gameSession) {
      gameSession.players.push({
        user: req.user.id,
        status: 'waiting'
      });
      
      await gameSession.save();
    }
    
    // Return updated tournament
    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .populate('quiz', 'title category')
      .populate('players.user', 'username avatar');
    
    res.json({
      tournament: updatedTournament,
      gameSessionId: gameSession ? gameSession._id : null
    });
  } catch (error) {
    console.error('Join tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start tournament
router.post('/:id/start', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if user is the creator
    if (tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can start the tournament' });
    }
    
    // Check if enough players have joined
    if (tournament.players.length < tournament.minPlayers) {
      return res.status(400).json({ 
        message: `Need at least ${tournament.minPlayers} players to start` 
      });
    }
    
    // Update tournament status
    tournament.status = 'active';
    tournament.startTime = new Date();
    
    // Update all players' status to 'playing'
    tournament.players.forEach(player => {
      player.status = 'playing';
    });
    
    await tournament.save();
    
    // Update game session
    const gameSession = await GameSession.findOne({ tournament: tournament._id });
    
    if (gameSession) {
      gameSession.status = 'active';
      gameSession.startTime = new Date();
      
      gameSession.players.forEach(player => {
        player.status = 'playing';
      });
      
      await gameSession.save();
    }
    
    res.json({ 
      message: 'Tournament started',
      tournament: await tournament.populate([
        { path: 'createdBy', select: 'username avatar' },
        { path: 'quiz', select: 'title category' },
        { path: 'players.user', select: 'username avatar' }
      ])
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave tournament
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Remove player from tournament
    tournament.players = tournament.players.filter(
      player => player.user.toString() !== req.user.id
    );
    
    // If tournament has no players left and it's not started yet, delete it
    if (tournament.players.length === 0 && tournament.status === 'waiting') {
      await Tournament.findByIdAndDelete(req.params.id);
      // Also delete related game session
      await GameSession.deleteOne({ tournament: req.params.id });
      
      return res.json({ message: 'Tournament deleted successfully' });
    }
    
    // If creator leaves and tournament hasn't started, transfer ownership
    if (tournament.createdBy.toString() === req.user.id && tournament.status === 'waiting' && tournament.players.length > 0) {
      tournament.createdBy = tournament.players[0].user;
    }
    
    await tournament.save();
    
    // Also remove player from game session
    const gameSession = await GameSession.findOne({ tournament: tournament._id });
    if (gameSession) {
      gameSession.players = gameSession.players.filter(
        player => player.user.toString() !== req.user.id
      );
      await gameSession.save();
    }
    
    res.json({ message: 'Left tournament successfully' });
  } catch (error) {
    console.error('Leave tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete tournament (creator only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if user is the creator
    if (tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete the tournament' });
    }
    
    // Don't allow deletion of active tournaments
    if (tournament.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active tournament' });
    }
    
    await Tournament.findByIdAndDelete(req.params.id);
    
    // Also delete related game session
    await GameSession.deleteOne({ tournament: req.params.id });
    
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;