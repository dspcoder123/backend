// src/routes/aiRoutes.js
const express = require("express");
const { generateChatCompletion } = require("../models/lmStudioModel");
const AiMessage = require("../models/aiMessage");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    const data = await generateChatCompletion(messages);

    const content = data?.choices?.[0]?.message?.content || "";
    const promptText =
      messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    // Save to MongoDB
    await AiMessage.create({
      model: data.model,
      prompt: promptText,
      response: content,
      raw: data
    });

    return res.json({ content });
  } catch (err) {
    console.error("LM Studio error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to get response from local model",
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
