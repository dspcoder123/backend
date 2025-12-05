// src/routes/writerDetector.js
const express = require("express");
const axios = require("axios");
const { getCopyleaksToken } = require("../utils/copyleaksAuth");

const router = express.Router();

// POST /api/writer-detector
// body: { text: string }
router.post("/writer-detector", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "TextRequired" });
    }

    const token = await getCopyleaksToken();
    const scanId = `scan-${Date.now()}`;

    const url = `https://api.copyleaks.com/v2/writer-detector/${scanId}/check`; // [web:23][web:25]

    const copyleaksRes = await axios.post(
      url,
      { text, sandbox: true },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Response has summary.ai (0..1) and sections etc. [web:23][web:24]
    return res.status(200).json(copyleaksRes.data);
  } catch (err) {
    console.error("Writer-detector error:", err.response?.data || err);
    return res.status(502).json({
      error: "CopyleaksError",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
