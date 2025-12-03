// src/routes/explicit.js
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const ExplicitCheck = require("../models/ExplicitCheck");

const router = express.Router();

const MODELS_DEFAULT = ["deepfake", "genai", "nudity-1.1"]; // deepfake + AI + nudity [web:6][web:14]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// ---- helpers ----

function normalizeSightengine(output) {
  const deepfakeScore = output?.type?.deepfake ?? null;        // 0..1 [web:6]
  const aiGeneratedScore = output?.type?.ai_generated ?? null; // 0..1 [web:6]

  const nud = output?.nudity || {}; // raw/partial/safe from nudity-1.1 [web:14]
  return {
    deepfakeScore,
    aiGeneratedScore,
    nudity: {
      raw: nud.raw ?? null,
      partial: nud.partial ?? null,
      safe: nud.safe ?? null,
    },
  };
}

async function checkFromUrl(imageUrl, models) {
  const { data } = await axios.get("https://api.sightengine.com/1.0/check.json", {
    params: {
      url: imageUrl,
      models: models.join(","), // comma-separated list of models [web:6]
      api_user: process.env.SIGHTENGINE_USER,
      api_secret: process.env.SIGHTENGINE_SECRET,
    },
    timeout: 20000,
  });
  return data;
}

async function checkFromFile(file, models) {
  const fd = new FormData();
  fd.append("media", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  fd.append("models", models.join(","));
  fd.append("api_user", process.env.SIGHTENGINE_USER);
  fd.append("api_secret", process.env.SIGHTENGINE_SECRET);

  const { data } = await axios.post(
    "https://api.sightengine.com/1.0/check.json",
    fd,
    {
      headers: fd.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    }
  );
  return data;
}

// ---- routes ----

// POST /api/safety/analyze
// Accepts either multipart (field: image) or JSON/body field { url: "..." }
router.post("/safety/analyze", upload.single("image"), async (req, res) => {
  try {
    const { url, models } = req.body;

    const modelList =
      (Array.isArray(models) && models.length && models) || MODELS_DEFAULT;

    if (!req.file && !url) {
      return res
        .status(400)
        .json({ error: 'Provide either multipart field "image" or body field "url"' });
    }

    let providerRaw;
    let sourceType;
    let sourceUrl = null;
    let sourceFilename = null;

    if (req.file) {
      providerRaw = await checkFromFile(req.file, modelList);
      sourceType = "file";
      sourceFilename = req.file.originalname;
    } else {
      providerRaw = await checkFromUrl(url, modelList);
      sourceType = "url";
      sourceUrl = url;
    }

    const normalized = normalizeSightengine(providerRaw);

    // Convert to percentages for UI
    const nud = normalized.nudity || {};
    const percentages = {
      safe: nud.safe != null ? +(nud.safe * 100).toFixed(1) : null,
      partial: nud.partial != null ? +(nud.partial * 100).toFixed(1) : null,
      raw: nud.raw != null ? +(nud.raw * 100).toFixed(1) : null,
      deepfake:
        normalized.deepfakeScore != null
          ? +(normalized.deepfakeScore * 100).toFixed(1)
          : null,
      aiGenerated:
        normalized.aiGeneratedScore != null
          ? +(normalized.aiGeneratedScore * 100).toFixed(1)
          : null,
    };

    // Store only minimal info in DB
    const saved = await ExplicitCheck.create({
      sourceType,
      sourceUrl,
      sourceFilename,
      safePercent: percentages.safe,
      partialPercent: percentages.partial,
      rawPercent: percentages.raw,
      deepfakePercent: percentages.deepfake,
      aiGeneratedPercent: percentages.aiGenerated,
    });

    res.json({
      id: saved._id,
      percentages,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({
      error: err.response?.data || err.message || "Analyzer error",
    });
  }
});

// Optional: GET /api/safety/:id  (returns minimal record)
router.get("/safety/:id", async (req, res) => {
  try {
    const doc = await ExplicitCheck.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

module.exports = router;
