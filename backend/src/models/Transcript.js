// models/Transcript.js  (AssemblyAI)
const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema(
  {
    // Identify provider
    providerName: {
      type: String,
      required: true,
      default: "assemblyai"
    },

    // Who requested it (optional)
    userId: { type: String },

    // Input info
    source: {
      type: String,
      enum: ["url", "upload"],
      required: true
    },
    audioUrl: {
      type: String,              // upload_url or external URL
      required: true
    },
    originalFileName: { type: String }, // if uploaded file

    // Provider metadata
    aaiTranscriptId: {
      type: String,
      index: true
    },

    // Output summary fields
    status: { type: String },        // queued / processing / completed / error
    text: { type: String },
    summary: { type: String },
    confidence: { type: Number },
    audioDuration: { type: Number },
    error: { type: String },

    // Rich analysis
    highlights: { type: Array },     // auto_highlights_result
    sentiment: { type: Array },      // sentiment_analysis_results
    chapters: { type: Array },       // chapters

    // Raw provider JSON
    rawResponse: { type: mongoose.Schema.Types.Mixed }
  },
  {
    collection: "transcriptions",    // SAME collection as Gladia
    timestamps: true
  }
);

module.exports = mongoose.model("Transcript", TranscriptSchema);
