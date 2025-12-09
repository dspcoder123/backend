const mongoose = require("mongoose");

const GdprScanSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String, // or ObjectId if you later want to reference User
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    sslSecure: {
      type: Boolean,
      required: true,
      default: false,
    },
    privacyPolicyFound: {
      type: Boolean,
      required: true,
      default: false,
    },
    cookieBannerFound: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Timestamps coming from the external GDPR API, if present
    scannerCreatedAt: {
      type: Date,
    },
    scannerUpdatedAt: {
      type: Date,
    },

    // Full raw JSON from the GDPR API for debugging / audit
    rawResponse: {
      type: Object,
    },
  },
  {
    collection: "gdpr_scans",
    timestamps: true, // adds createdAt and updatedAt (our own)
  }
);

module.exports = mongoose.model("GdprScan", GdprScanSchema);
