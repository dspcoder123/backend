const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String // Array of base64 strings - ALL images in ONE document
  }],
  totalImages: {
    type: Number,
    default: 1
  },
  config: {
    cfgScale: {
      type: Number,
      default: 7.0
    },
    steps: {
      type: Number,
      default: 30
    },
    height: {
      type: Number,
      default: 1024
    },
    width: {
      type: Number,
      default: 1024
    },
    stylePreset: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
generatedImageSchema.index({ userId: 1, createdAt: -1 });
generatedImageSchema.index({ prompt: 'text' });
generatedImageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GeneratedImage', generatedImageSchema);