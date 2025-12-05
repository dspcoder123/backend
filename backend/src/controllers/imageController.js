const imageService = require('../services/imageService');

exports.generateImage = async (req, res) => {
  try {
    const { prompt, config, userId } = req.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Call service to generate image
    const result = await imageService.generateImage(prompt, config);

    // Auto-save to database - ALL images in ONE document
    const savedRecordId = await imageService.saveToDatabase(
      userId || null,
      result.images,
      prompt,
      config
    );

    res.status(200).json({
      success: true,
      data: {
        images: result.images,
        metadata: result.metadata,
        savedRecordId: savedRecordId,
        message: `Saved ${result.images.length} images in single document`
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image'
    });
  }
};

exports.getStylePresets = (req, res) => {
  const presets = [
    '3d-model', 'analog-film', 'anime', 'cinematic', 'comic-book',
    'digital-art', 'enhance', 'fantasy-art', 'isometric', 'line-art',
    'low-poly', 'modeling-compound', 'neon-punk', 'origami',
    'photographic', 'pixel-art', 'tile-texture'
  ];

  res.status(200).json({
    success: true,
    data: presets
  });
};

exports.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await imageService.getUserHistory(userId);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const images = await imageService.getAllImages(limit);

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Get all images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
};
