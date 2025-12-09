const express = require('express');
const router = express.Router();

const { getAllNews } = require('./controller');

// Get all news records from `newsanalyses` collection
router.get('/', getAllNews);

module.exports = router;
