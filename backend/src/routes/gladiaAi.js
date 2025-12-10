// routes/transcription.routes.js
const express = require("express");
const axios = require("axios");
const Transcription = require("../models/gladia");

const router = express.Router();

// helper: small sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/transcriptions
// body: { audioUrl: "https://..." }
router.post("/", async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ error: "audioUrl is required" });
    }

    // 1) Create Gladia job
    const createResp = await axios.post(
      "https://api.gladia.io/v2/pre-recorded",
      { audio_url: audioUrl },
      {
        headers: {
          "x-gladia-key": process.env.GLADIA_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const { id: gladiaJobId, result_url: gladiaResultUrl } = createResp.data;

    // 2) Poll result_url until done (simple polling)
    let outputData = null;
    for (let i = 0; i < 30; i++) {
      const resultResp = await axios.get(gladiaResultUrl, {
        headers: {
          "x-gladia-key": process.env.GLADIA_API_KEY
        }
      });

      const data = resultResp.data;

      // Gladia usually returns status field or directly final object
      if (!data.status || data.status === "done" || data.status === "finished") {
        outputData = data;
        break;
      }

      // wait 2s then poll again
      await sleep(2000);
    }

    if (!outputData) {
      return res.status(504).json({ error: "Transcription not ready in time" });
    }

    // 3) Build document and save in MongoDB
    const doc = await Transcription.create({
      providerName: "gladia",
      gladiaJobId,
      gladiaResultUrl,
      input: {
        audioUrl
      },
      output: {
        data: outputData
      }
    });

    // 4) Return saved doc (or a slimmed-down view) to UI
    return res.json({
      id: doc._id,
      providerName: doc.providerName,
      createdAt: doc.createdAt,
      gladiaJobId: doc.gladiaJobId,
      gladiaResultUrl: doc.gladiaResultUrl,
      input: doc.input,
      output: doc.output
    });
  } catch (err) {
    console.error("Transcription error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to create transcription",
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
