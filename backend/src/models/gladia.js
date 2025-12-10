// backend/src/models/gladia.js
const mongoose = require("mongoose");

const InputSchema = new mongoose.Schema(
  {
    audioUrl: { type: String, required: true }
  },
  { _id: false }
);

const OutputSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const TranscriptionSchema = new mongoose.Schema(
  {
    providerName: { type: String, required: true, default: "gladia" },
    gladiaJobId: { type: String, required: true },
    gladiaResultUrl: { type: String, required: true },
    input: { type: InputSchema, required: true },
    output: { type: OutputSchema, required: true }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

module.exports = mongoose.model("Transcription", TranscriptionSchema);
