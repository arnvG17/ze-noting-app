const express = require('express');
const router = express.Router();
const pitchController = require('../controllers/pitchController');

router.post('/generate', pitchController.generateScript);
router.post('/export', pitchController.exportVideo);

module.exports = router;
