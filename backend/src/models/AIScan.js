// src/models/AIScan.js
const mongoose = require("mongoose");

const SegmentSchema = new mongoose.Schema(
  {
    text: String,
    aiScore: Number,    // 0..1
    humanScore: Number, // 0..1
  },
  { _id: false }
);

const AIScanSchema = new mongoose.Schema(
  {
    userId: String,
    inputType: { type: String, enum: ["text", "file"], default: "text" },
    text: String,
    overallAiScore: Number,
    overallHumanScore: Number,
    segments: [SegmentSchema],

    rawWebhook: {
      type: Object, // or mongoose.Schema.Types.Mixed
      default: null,
    },
  },
  { timestamps: true, collection: "ai_scans" }
);

module.exports = mongoose.model("AIScan", AIScanSchema);
