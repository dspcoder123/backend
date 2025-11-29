const mongoose = require('mongoose');

// Collections for each main menu
const audioMenusCollection = mongoose.connection.collection('audioMenus');
const videoMenusCollection = mongoose.connection.collection('videoMenus');
const imageMenusCollection = mongoose.connection.collection('imageMenus');
const textMenusCollection = mongoose.connection.collection('textMenus');

// GET /api/menus -> return 4 main menus
const getMainMenus = (req, res) => {
  res.status(200).json({
    success: true,
    data: ['Audio', 'Video', 'Image', 'Text'],
  });
};

// Helper to fetch single document with submenus from given collection
const getSubmenusFromCollection = async (collection, menuName, res) => {
  try {
    const doc = await collection.findOne({ menu: menuName });

    if (!doc || !doc.submenus) {
      return res.status(404).json({
        success: false,
        message: `No submenus found for ${menuName}`,
      });
    }

    return res.status(200).json({
      success: true,
      menu: doc.menu,
      count: doc.submenus.length,
      data: doc.submenus,
    });
  } catch (error) {
    console.error(`Error fetching ${menuName} submenus:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching ${menuName} submenus`,
      error: error.message,
    });
  }
};

// GET /api/audio/menus
const getAudioMenus = async (req, res) => {
  await getSubmenusFromCollection(audioMenusCollection, 'Audio', res);
};

// GET /api/video/menus
const getVideoMenus = async (req, res) => {
  await getSubmenusFromCollection(videoMenusCollection, 'Video', res);
};

// GET /api/image/menus
const getImageMenus = async (req, res) => {
  await getSubmenusFromCollection(imageMenusCollection, 'Image', res);
};

// GET /api/text/menus
const getTextMenus = async (req, res) => {
  await getSubmenusFromCollection(textMenusCollection, 'Text', res);
};

module.exports = {
  getMainMenus,
  getAudioMenus,
  getVideoMenus,
  getImageMenus,
  getTextMenus,
};
