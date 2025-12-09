const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Generate images from text prompt
router.post('/generate', imageController.generateImage);

// Get available style presets
router.get('/styles', imageController.getStylePresets);

// Get user's generated images
router.get('/history/:userId', imageController.getUserHistory);

// Get all generated images
router.get('/all', imageController.getAllImages);

module.exports = router;