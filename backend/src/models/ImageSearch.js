// src/models/ImageSearch.js
const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    pageUrl: String,
    imageUrl: String,
    title: String,
    snippet: String,
    score: Number,
  },
  { _id: false }
);

const ImageSearchSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
    },
    provider: {
      type: String,
      default: "rapidapi-reverse-image-copyseeker",
    },
    results: [ResultSchema],
  },
  {
    collection: "image_searches",
    timestamps: true,
  }
);

module.exports = mongoose.model("ImageSearch", ImageSearchSchema);
