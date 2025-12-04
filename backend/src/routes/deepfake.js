// src/routes/deepfake.js
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const DeepfakeCheck = require("../models/DeepfakeCheck");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

async function checkDeepfakeFromUrl(url) {
  const { data } = await axios.get("https://api.sightengine.com/1.0/check.json", {
    params: {
      url,
      models: "deepfake",
      api_user: process.env.SIGHTENGINE_USER,
      api_secret: process.env.SIGHTENGINE_SECRET,
    },
    timeout: 20000,
  });
  return data;
}

async function checkDeepfakeFromFile(file) {
  const fd = new FormData();
  fd.append("media", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  fd.append("models", "deepfake");
  fd.append("api_user", process.env.SIGHTENGINE_USER);
  fd.append("api_secret", process.env.SIGHTENGINE_SECRET);

  const { data } = await axios.post(
    "https://api.sightengine.com/1.0/check.json",
    fd,
    {
      headers: fd.getHeaders(),
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return data;
}

// POST /api/deepfake/analyze
router.post("/deepfake/analyze", upload.single("image"), async (req, res) => {
  try {
    const { url } = req.body;
    if (!req.file && !url) {
      return res
        .status(400)
        .json({ error: 'Provide either "image" file or "url".' });
    }

    const raw = req.file
      ? await checkDeepfakeFromFile(req.file)
      : await checkDeepfakeFromUrl(url);

    const score = raw?.type?.deepfake ?? null; // 0..1
    const percentage = score != null ? +(score * 100).toFixed(1) : null;

    let label;
    if (percentage == null) label = "No face detected";
    else if (percentage < 20) label = "Likely real media";
    else if (percentage < 60) label = "Uncertain / needs review";
    else label = "Likely deepfake";

    // persist minimal record
    const saved = await DeepfakeCheck.create({
      sourceType: req.file ? "file" : "url",
      sourceUrl: req.file ? null : url,
      sourceFilename: req.file ? req.file.originalname : null,
      score,
      percentage,
      label,
    });

    res.json({
      id: saved._id,
      score,
      percentage,
      label,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
