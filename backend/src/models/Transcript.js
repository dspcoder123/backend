const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema(
    {
        userId: { type: String },
        source: { type: String, enum: ["url", "upload"], required: true },
        audioUrl: { type: String },         // the URL sent to AssemblyAI (upload_url or external)
        originalFileName: { type: String }, // if uploaded
        aaiTranscriptId: { type: String, index: true },
        status: { type: String },           // queued/processing/completed/error
        text: { type: String },
        summary: { type: String },
        highlights: { type: Array }, // or a sub-schema
        sentiment: { type: Array },
        chapters: { type: Array },
        confidence: { type: Number },
        audioDuration: { type: Number },
        error: { type: String },
        rawResponse: { type: Object },
    },
    { collection: "transcripts", timestamps: true }
);

module.exports = mongoose.model("Transcript", TranscriptSchema);
