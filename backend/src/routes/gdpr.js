const express = require("express");
const axios = require("axios");
const GdprScan = require("../models/GdprScan");

const router = express.Router();

// Helper: validate URL (http/https only)
function isValidHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// POST /api/gdpr/scan
router.post("/scan", async (req, res) => {
  try {
    const { url, userId } = req.body || {};

    // 1) Basic validation
    if (!isValidHttpUrl(url)) {
      return res
        .status(400)
        .json({ error: "InvalidUrl", message: "Provide a valid http/https URL." });
    }

    // 2) Call external GDPR validator API
    const encodedUrl = encodeURIComponent(url);
    const scannerUrl = `https://www.gdprvalidator.eu/api/v1/scan/check?url=${encodedUrl}`;

    let scannerResponse;
    try {
      const apiRes = await axios.get(scannerUrl, { timeout: 15000 });
      scannerResponse = apiRes.data;
    } catch (err) {
      console.error("GDPR scanner error:", err.message);
      return res.status(502).json({
        error: "ScannerError",
        message: "Failed to contact GDPR validator service.",
      });
    }

    // 3) Extract fields from response (defensive defaults)
    const score = Number(scannerResponse?.score ?? 0);
    const sslSecure = Boolean(scannerResponse?.sslSecure);
    const privacyPolicyFound = Boolean(scannerResponse?.privacyPolicyFound);
    const cookieBannerFound = Boolean(scannerResponse?.cookieBannerFound);

    // If their API returns timestamps, try to capture them
    const scannerCreatedAt = scannerResponse?.createdAt
      ? new Date(scannerResponse.createdAt)
      : undefined;
    const scannerUpdatedAt = scannerResponse?.updatedAt
      ? new Date(scannerResponse.updatedAt)
      : undefined;

    // 4) Create one document with input + output
    const doc = new GdprScan({
      url,
      userId,
      score,
      sslSecure,
      privacyPolicyFound,
      cookieBannerFound,
      scannerCreatedAt,
      scannerUpdatedAt,
      rawResponse: scannerResponse,
    });

    const saved = await doc.save();

    // 5) Return saved document
    return res.status(201).json(saved);
  } catch (err) {
    console.error("GDPR scan endpoint error:", err);
    return res.status(500).json({
      error: "InternalError",
      message: "Something went wrong while processing GDPR scan.",
    });
  }
});

module.exports = router;
