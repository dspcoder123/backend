// src/routes/leaksFile.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const { getCopyleaksToken } = require("../utils/copyleaksAuth");
const AIScan = require("../models/AIScan");
const mongoose = require("mongoose")

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// POST /api/copyleaks/file  (your API is POST, Copyleaks call inside is PUT)
router.post("/copyleaks/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "FileRequired", message: "Upload a document file." });
    }

    const token = await getCopyleaksToken();
    const scanId = `auth-scan-${Date.now()}`;

    const base64Content = req.file.buffer.toString("base64");
    const filename = req.file.originalname;

    const webhookBase =
      process.env.COPYLEAKS_WEBHOOK_BASE ||
      "https://your-ngrok-id.ngrok.io/api/copyleaks/webhook";

    // Copyleaks submit-file endpoint (MUST be PUT). [web:29][web:58]
    const url = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;

    const body = {
      base64: base64Content,
      filename,
      properties: {
        sandbox: true,
        webhooks: {
          status: `${webhookBase}/status/{status}/${scanId}`,
        },
        aiGeneratedText: {
          detect: true, // enable AI detection. [web:73]
        },
      },
    };

    const apiRes = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });

    return res.status(202).json({
      scanId,
      message: "File submitted to Copyleaks. Wait for webhook.",
      api: apiRes.data,
    });
  } catch (err) {
    console.error("Copyleaks submit-file error:", err.response?.data || err);
    return res.status(502).json({
      error: "CopyleaksError",
      details: err.response?.data || err.message,
    });
  }
});



// router.post(
//   "/copyleaks/webhook/status/:status/:scanId",
//   express.json({ limit: "1mb" }),
//   async (req, res) => {
//     try {
//       const { status, scanId } = req.params;
//       console.log("Copyleaks webhook:", status, scanId);
//       console.log("Webhook body:", JSON.stringify(req.body, null, 2));

//       // Only handle completed scans
//       if (status !== "completed") {
//         return res.status(200).json({ ok: true });
//       }

//       const payload = req.body;

//       // AI detection is sent as an alert; code name may be 'suspected-ai-text' etc. [web:35][web:10]
//       const alerts = payload.notifications?.alerts || [];
//       const aiAlert = alerts.find((a) => a.code === "suspected-ai-text");

//       let overallAiScore = null;
//       let overallHumanScore = null;

//       if (aiAlert?.additionalData?.summary?.aiProbability != null) {
//         overallAiScore = aiAlert.additionalData.summary.aiProbability;
//         overallHumanScore = 1 - overallAiScore;
//       }

//       await AIScan.create({
//         userId: "webhook",
//         inputType: "text",
//         text: "", // you can later fill in exported text if needed [web:35][web:68]
//         overallAiScore,
//         overallHumanScore,
//         segments: [],
//       });

//       return res.status(200).json({ ok: true });
//     } catch (e) {
//       console.error("Webhook save error:", e);
//       return res.status(500).json({ error: "WebhookError" });
//     }
//   }
// );


// router.post(
//   "/copyleaks/webhook/status/:status/:scanId",
//   express.json({ limit: "1mb" }),
//   async (req, res) => {
//     try {
//       const { status, scanId } = req.params;
//       console.log("Copyleaks webhook:", status, scanId);

//       if (status !== "completed") {
//         return res.status(200).json({ ok: true });
//       }

//       // Just insert a dummy record first
//       const doc = await AIScan.create({
//         userId: "webhook",
//         inputType: "text",
//         text: `scanId=${scanId}`,
//         overallAiScore: null,
//         overallHumanScore: null,
//         segments: [],
//       });

//       console.log("Saved AIScan from webhook:", doc._id.toString());
//       return res.status(200).json({ ok: true });
//     } catch (e) {
//       console.error("Webhook save error:", e);
//       return res.status(500).json({ error: "WebhookError" });
//     }
//   }
// );





router.post(
  "/copyleaks/webhook/status/:status/:scanId",
  express.json({ limit: "1mb" }),
  async (req, res) => {
    try {
      const { status, scanId } = req.params;
      console.log("Copyleaks webhook:", status, scanId);
      console.log("Webhook body:", JSON.stringify(req.body, null, 2));

      // Only process completed scans
      if (status !== "completed") {
        return res.status(200).json({ ok: true });
      }

      const payload = req.body;

      // 1) Get AI alert
      const alerts = payload.notifications?.alerts || [];
      const aiAlert = alerts.find((a) => a.code === "suspected-ai-text");

      if (!aiAlert) {
        console.log("No AI alert present on scan", scanId);
        await AIScan.create({
          userId: "webhook",
          inputType: "text",
          text: `scanId=${scanId}`,
          overallAiScore: null,
          overallHumanScore: null,
          segments: [],
        });
        return res.status(200).json({ ok: true });
      }

      // 2) Parse additionalData JSON string
      let additional;
      try {
        additional = JSON.parse(aiAlert.additionalData);
      } catch (e) {
        console.error("Failed to parse additionalData JSON:", e);
      }

      let overallAiScore = null;
      let overallHumanScore = null;

      if (additional?.summary?.Ai != null) {
        overallAiScore = additional.summary.Ai; // 0..1
        overallHumanScore = additional.summary.Human ?? 1 - overallAiScore;
      }

      // 3) Save to Mongo
      const doc = await AIScan.create({
        userId: "webhook",
        inputType: "text",
        text: `scanId=${scanId}`,
        overallAiScore,
        overallHumanScore,
        segments: [],
        rawWebhook: payload,
      });

      console.log("Saved AIScan from webhook:", doc._id.toString());
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Webhook save error:", e);
      return res.status(500).json({ error: "WebhookError" });
    }
  }
);



router.post("/copyleaks/webhook/test", (req, res) => {
  console.log("🔔 WEBHOOK HIT! Status:", req.path, "Body:", JSON.stringify(req.body, null, 2));
  res.json({ ok: true, timestamp: new Date().toISOString() });
});


module.exports = router;
