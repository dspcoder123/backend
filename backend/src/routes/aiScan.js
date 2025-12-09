// src/routes/aiScan.js
const express = require("express");
const AIScan = require("../models/AIScan");

const router = express.Router();

// POST /api/ai-scan
// body: { userId?, text, overallAiScore, overallHumanScore, segments? }
router.post("/ai-scan", async (req, res) => {
  try {
    const {
      userId,
      text,
      overallAiScore,
      overallHumanScore,
      segments = [],
    } = req.body;

    if (!text || overallAiScore == null || overallHumanScore == null) {
      return res.status(400).json({ error: "InvalidPayload" });
    }

    const doc = await AIScan.create({
      userId: userId || "guest",
      inputType: "text",
      text,
      overallAiScore,
      overallHumanScore,
      segments,
    });

    return res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error("Save AI scan error:", err);
    return res.status(500).json({ error: "ServerError" });
  }
});

module.exports = router;
