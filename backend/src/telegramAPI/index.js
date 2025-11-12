const express = require('express');
const router = express.Router();

const { sendMessage } = require('./controller');

router.post('/send', sendMessage);

module.exports = router;
