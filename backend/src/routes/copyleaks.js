// src/routes/copyleaks.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { Copyleaks, CopyleaksFileSubmissionModel } = require("plagiarism-checker");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const EMAIL = process.env.COPYLEAKS_EMAIL;
const API_KEY = process.env.COPYLEAKS_API_KEY;
const WEBHOOK_BASE = process.env.COPYLEAKS_WEBHOOK_BASE || "http://localhost:4000/api/copyleaks/webhook";

// 1) Submit file for AI detection (sandbox)
router.post("/copyleaks/submit-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "FileRequired", message: "Upload a document file." });
    }

    if (!EMAIL || !API_KEY) {
      return res.status(500).json({ error: "ConfigError", message: "Copyleaks env vars missing." });
    }

    const copyleaks = new Copyleaks();
    const loginResult = await copyleaks.loginAsync(EMAIL, API_KEY);

    const scanId = `ai-scan-${Date.now()}`;
    const filename = req.file.originalname;
    const base64Content = req.file.buffer.toString("base64");

    const submission = new CopyleaksFileSubmissionModel(base64Content, filename, {
        sandbox: true,
        webhooks: {
          // Copyleaks will replace {status} with completed | error | creditsChecked | indexed
          // final URLs: http://localhost:4000/api/copyleaks/status/completed/SCAN_ID, etc.
          status: `${WEBHOOK_BASE}/status/{status}/${scanId}`,
        },
        aiGeneratedText: {
          detect: true,
        },
      });

    await copyleaks.submitFileAsync(loginResult, scanId, submission);

    return res.status(202).json({
      scanId,
      message: "File submitted to Copyleaks (sandbox). Wait for webhook.",
    });
  } catch (err) {
    console.error("Copyleaks submit-file error:", err);
    return res.status(502).json({
      error: "CopyleaksError",
      message: "Failed to submit file to Copyleaks.",
    });
  }
});

// 2) Status webhook receiver (Copyleaks -> your server)
router.post("/copyleaks/webhook/:status", express.json({ limit: "1mb" }), (req, res) => {
    const { status } = req.params;
    console.log("Copyleaks webhook status:", status);
    console.log("Webhook body:", JSON.stringify(req.body, null, 2));
    res.status(200).json({ ok: true });
  });
  

  router.post(
    "/copyleaks/status/:status/:scanId",
    express.json({ limit: "1mb" }),
    (req, res) => {
      const { status, scanId } = req.params;
      console.log("Copyleaks webhook:", status, scanId);
      console.log("Body:", JSON.stringify(req.body, null, 2));
      res.status(200).json({ ok: true });
    }
  );
  
module.exports = router;
