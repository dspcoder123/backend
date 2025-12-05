const axios = require('axios');
const GeneratedImage = require('../models/GeneratedImage');

class ImageService {
  constructor() {
    this.apiKey = process.env.STABILITY_API_KEY;
    this.baseUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
  }

  async generateImage(prompt, config = {}) {
    // Default config - MUST use XL-compatible dimensions
    const defaultConfig = {
      cfgScale: 7.0,
      samples: 1,
      steps: 30,
      height: 1024,
      width: 1024,
      stylePreset: null,
      safetyMode: 'SAFE'
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Validate dimensions for Stable Diffusion XL
    const allowedDimensions = [
      [1024, 1024], [1152, 896], [1216, 832], [1344, 768],
      [1536, 640], [640, 1536], [768, 1344], [832, 1216], [896, 1152]
    ];

    const isValidDimension = allowedDimensions.some(
      ([h, w]) => h === finalConfig.height && w === finalConfig.width
    );

    if (!isValidDimension) {
      throw new Error(
        `Invalid dimensions ${finalConfig.height}x${finalConfig.width}. ` +
        `Allowed dimensions: ${allowedDimensions.map(d => d.join('x')).join(', ')}`
      );
    }

    // Build request body
    const requestBody = {
      text_prompts: [{ text: prompt }],
      cfg_scale: finalConfig.cfgScale,
      samples: finalConfig.samples,
      steps: finalConfig.steps,
      height: finalConfig.height,
      width: finalConfig.width
    };

    // Add optional style preset
    if (finalConfig.stylePreset && finalConfig.stylePreset !== 'none') {
      requestBody.style_preset = finalConfig.stylePreset;
    }

    try {
      const response = await axios.post(this.baseUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      });

      // Extract base64 images from response
      const images = response.data.artifacts.map(artifact => artifact.base64);

      return {
        images,
        metadata: {
          prompt,
          config: finalConfig,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error.response) {
        throw new Error(`Stability AI API error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('No response from Stability AI API');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  // Save ALL images in ONE document
  async saveToDatabase(userId, images, prompt, config) {
    try {
      const record = new GeneratedImage({
        userId: userId || null,
        prompt: prompt,
        images: images, // Array of base64 strings
        totalImages: images.length,
        config: {
          cfgScale: config?.cfgScale || 7.0,
          steps: config?.steps || 30,
          height: config?.height || 1024,
          width: config?.width || 1024,
          stylePreset: config?.stylePreset || null
        }
      });

      const saved = await record.save();
      console.log(`✅ Saved ${images.length} images in single document: ${saved._id}`);
      
      return saved._id;

    } catch (error) {
      console.error('❌ Error saving to database:', error);
      throw new Error('Failed to save images to database');
    }
  }

  // Get user history
  async getUserHistory(userId) {
    try {
      const history = await GeneratedImage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('-images'); // Exclude base64 data for list view

      return history;
    } catch (error) {
      throw new Error('Failed to fetch user history');
    }
  }

  // Get all images
  async getAllImages(limit = 10) {
    try {
      const images = await GeneratedImage.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-images'); // Exclude base64 for performance

      return images;
    } catch (error) {
      throw new Error('Failed to fetch images');
    }
  }
}

module.exports = new ImageService();
