const express = require('express');
const router = express.Router();

const {
  getMainMenus,
  getAudioMenus,
  getVideoMenus,
  getImageMenus,
  getTextMenus,
} = require('./controller');

// GET /api/menus -> 4 main menus
router.get('/menus', getMainMenus);

// GET /api/audio/menus
router.get('/audio/menus', getAudioMenus);

// GET /api/video/menus
router.get('/video/menus', getVideoMenus);

// GET /api/image/menus
router.get('/image/menus', getImageMenus);

// GET /api/text/menus
router.get('/text/menus', getTextMenus);

module.exports = router;
