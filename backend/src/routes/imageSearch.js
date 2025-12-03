// src/routes/imageSearch.js
const express = require("express");
const axios = require("axios");
const ImageSearch = require("../models/ImageSearch");

const router = express.Router();

function isValidUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// POST /api/image-search/save-input
// Body: { imageUrl: string, userId?: string }
router.post("/save-input", async (req, res) => {
  try {
    const { imageUrl, userId } = req.body || {};

    if (!isValidUrl(imageUrl)) {
      return res
        .status(400)
        .json({ error: "InvalidImageUrl", message: "Provide a valid http/https imageUrl." });
    }

    const rapidKey = process.env.RAPIDAPI_KEY;
    const rapidHost = process.env.RAPIDAPI_REVERSE_IMAGE_HOST;

    if (!rapidKey || !rapidHost) {
      return res.status(500).json({
        error: "ConfigError",
        message: "RapidAPI env vars missing (RAPIDAPI_KEY or RAPIDAPI_REVERSE_IMAGE_HOST).",
      });
    }

    // Call RapidAPI reverse image search.
    // Check the API docs for the exact path & query params; here we assume ?image_url=
const apiUrl = `https://${rapidHost}/`;

let apiRes;
try {
  apiRes = await axios.get(apiUrl, {
    headers: {
      "x-rapidapi-key": rapidKey,
      "x-rapidapi-host": rapidHost,
    },
    timeout: 20000,
  });
} catch (err) {
  console.error("Reverse image RapidAPI error:", err?.response?.status, err?.message);
  return res.status(502).json({
    error: "ReverseImageError",
    message: "Failed to contact reverse image search provider.",
  });
}

// data has shape from your example
const data = apiRes.data || {};

const results =
  (data.Pages || []).map((p) => ({
    pageUrl: p.Url,
    imageUrl: (p.MatchingImages && p.MatchingImages[0]) || null,
    title: p.Title,
    snippet: null,
    score: typeof p.Rank === "number" ? p.Rank : null,
  })) || [];

const doc = new ImageSearch({
  imageUrl,        // what user entered, just for record
  userId,
  provider: "rapidapi-copyseeker-demo",
  results,
});


    const saved = await doc.save();

    return res.status(201).json({
      _id: saved._id,
      imageUrl: saved.imageUrl,
      provider: saved.provider,
      results: saved.results,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  } catch (err) {
    console.error("Image search save-input error:", err);
    return res.status(500).json({
      error: "InternalError",
      message: "Something went wrong while processing image search.",
    });
  }
});

module.exports = router;
