const express = require("express");
const router = express.Router();
const Duo = require("../models/duo");
const GameSession = require("../models/GameSession");
const { protect } = require("../middleware/auth");
const crypto = require("crypto");

// 🎯 Créer un match Duo (privé ou non)
router.post("/", protect, async (req, res) => {
  try {
    const { category, isPrivate, quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    const accessCode = isPrivate ? crypto.randomBytes(3).toString("hex").toUpperCase() : null;

    const newDuo = new Duo({
      createdBy: req.user.id,
      players: [{ user: req.user.id, status: "ready" }],
      isPrivate: isPrivate || false,
      accessCode,
      category,
      status: "waiting"
    });

    await newDuo.save();

    const gameSession = new GameSession({
      type: "duo",
      quiz: quizId,
      duo: newDuo._id,
      players: [{ user: req.user.id, status: "ready" }],
      roomId: `duo_${newDuo._id}`,
      category,
      status: "waiting"
    });

    await gameSession.save();

    res.status(201).json({
      duo: await newDuo.populate("createdBy", "username avatar"),
      gameSessionId: gameSession._id,
      accessCode: newDuo.accessCode,
    });
  } catch (error) {
    console.error("Create duo error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
