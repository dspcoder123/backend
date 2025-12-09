const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Transcript = require("../models/Transcript");
const { uploadLocalFile, createTranscript, waitForCompletion } = require("../utils/assemblyaiClient");

const router = express.Router();

// store temp uploads under /uploads
const upload = multer({ dest: path.join(process.cwd(), "uploads") });

function isHttpUrl(v) {
    try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}

// POST /api/assemblyai/transcribe  (JSON: { audioUrl, userId } OR multipart: audio=<file>)
router.post("/transcribe", upload.single("audio"), async (req, res) => {
    try {
        const userId = req.body?.userId;
        let audioUrl = null;
        let source = null;
        let originalFileName = null;

        if (req.file) {
            source = "upload";
            originalFileName = req.file.originalname;
            // Upload local file to AssemblyAI /upload to get an upload_url
            audioUrl = await uploadLocalFile(req.file.path);
            // remove temp file
            fs.unlink(req.file.path, () => { });
        } else if (isHttpUrl(req.body?.audioUrl)) {
            source = "url";
            audioUrl = req.body.audioUrl;
        } else {
            return res.status(400).json({ error: "InvalidInput", message: "Provide audio file (audio) or a valid audioUrl." });
        }

        // Optional feature flags (extend as needed)
        const options = {
            speaker_labels: req.body?.speaker_labels === "true",
            speakers_expected: req.body?.speakers_expected ? Number(req.body.speakers_expected) : undefined,
            // e.g., sentiment_analysis: true, content_safety: true, iab_categories: true, auto_chapters: true
        };

        const created = await createTranscript(audioUrl, options);
        const aaiId = created.id;

        // Wait until completed (for async UX, you could return immediately and use webhooks)
        const finalData = await waitForCompletion(aaiId);

        const doc = new Transcript({
            userId,
            source,
            audioUrl,
            originalFileName,
            aaiTranscriptId: aaiId,
            status: finalData.status,
            text: finalData.text || "",
            confidence: typeof finalData.confidence === "number" ? finalData.confidence : undefined,
            audioDuration: typeof finalData.audio_duration === "number" ? finalData.audio_duration : undefined,
            error: finalData.error || null,
            summary: finalData.summary || null,
            highlights: finalData.auto_highlights_result || [],
            sentiment: finalData.sentiment_analysis_results || [],
            chapters: finalData.chapters || [],
            rawResponse: finalData,
        });
        const saved = await doc.save();

        return res.status(201).json({
            _id: saved._id,
            aaiTranscriptId: saved.aaiTranscriptId,
            status: saved.status,
            text: saved.text,
            confidence: saved.confidence,
            audioDuration: saved.audioDuration,
            summary: saved.summary,        // add
            sentiment: saved.sentiment,    // add (array from DB)
            createdAt: saved.createdAt,
        });

    } catch (err) {
        console.error("AssemblyAI transcribe error:", err?.message || err);
        return res.status(500).json({ error: "AssemblyAIError", message: err?.message || "Transcription failed." });
    }
});

module.exports = router;
