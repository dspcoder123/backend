const express = require('express');
const router = express.Router();
const { fetchVisitNames } = require('./controller');


router.get('/visitNames', fetchVisitNames);

module.exports = router;
