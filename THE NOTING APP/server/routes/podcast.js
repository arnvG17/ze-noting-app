const express = require('express');
const router = express.Router();
const podcastController = require('../controllers/podcastController');

router.post('/generate-script', podcastController.generateScript);
router.post('/synthesize', podcastController.synthesizePodcast);

module.exports = router;
