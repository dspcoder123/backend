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
      return res.status(400).json({
        error: "InvalidImageUrl",
        message: "Provide a valid http/https imageUrl.",
      });
    }

    const rapidKey = process.env.RAPIDAPI_KEY;
    const rapidHost = process.env.RAPIDAPI_REVERSE_IMAGE_HOST;

    if (!rapidKey || !rapidHost) {
      return res.status(500).json({
        error: "ConfigError",
        message:
          "Reverse image env vars missing (RAPIDAPI_KEY or RAPIDAPI_REVERSE_IMAGE_HOST).",
      });
    }

    // Reverse Image Search API (reverse-image-search1.p.rapidapi.com) [web:203]
    const apiUrl = `https://${rapidHost}/reverse-image-search`;

    let apiRes;
    try {
      apiRes = await axios.get(apiUrl, {
        params: {
          url: imageUrl,
          limit: 10,
          safe_search: "off",
        },
        headers: {
          "x-rapidapi-key": rapidKey,
          "x-rapidapi-host": rapidHost,
        },
        timeout: 30000,
      });
    } catch (err) {
      console.error(
        "Reverse image RapidAPI error:",
        err?.response?.status,
        err?.response?.data || err?.message
      );
      return res.status(502).json({
        error: "ReverseImageError",
        message: "Failed to contact reverse image search provider.",
      });
    }

    const data = apiRes.data || {};

    // Reverse Image Search API returns matches in `data` (array) as you logged.
    const rawList = Array.isArray(data.data) ? data.data : [];
    
    // Map into your schema
    const results = rawList.map((item) => ({
      pageUrl: item.link || null,          // page URL
      imageUrl: item.image || null,        // thumbnail / result image
      title: item.title || null,
      snippet: null,                       // API doesn’t send snippet text
      score: null,                         // no numeric similarity in this API
    }));
    
    const doc = new ImageSearch({
      imageUrl,
      userId,
      provider: "rapidapi-reverse-image-search1",
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
