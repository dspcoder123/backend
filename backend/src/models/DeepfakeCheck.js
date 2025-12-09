// src/models/DeepfakeCheck.js
const mongoose = require("mongoose");

const DeepfakeCheckSchema = new mongoose.Schema(
  {
    sourceType: { type: String, enum: ["url", "file"], required: true },
    sourceUrl: String,
    sourceFilename: String,

    // what your UI actually shows
    score: Number,        // 0..1
    percentage: Number,   // 0..100
    label: String         // "Likely real media" / "Likely deepfake" etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeepfakeCheck", DeepfakeCheckSchema);
