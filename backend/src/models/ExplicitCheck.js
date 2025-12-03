// src/models/ExplicitCheck.js
const mongoose = require("mongoose");

const ExplicitCheckSchema = new mongoose.Schema(
  {
    // optional, just to know what was analyzed
    sourceType: { type: String, enum: ["url", "file"], required: true },
    sourceUrl: String,        // filled when sourceType = "url"
    sourceFilename: String,   // filled when sourceType = "file"

    // what UI actually needs (0–100)
    safePercent: Number,
    partialPercent: Number,
    rawPercent: Number,
    deepfakePercent: Number,
    aiGeneratedPercent: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExplicitCheck", ExplicitCheckSchema);
