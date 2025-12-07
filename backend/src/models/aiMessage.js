// src/models/aiMessage.js
const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    model: String,
    prompt: String,
    response: String,
    raw: Object   // full JSON from LM Studio
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiMessage", aiMessageSchema);
