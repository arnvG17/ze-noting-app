const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');

router.post('/', scrapeController);

module.exports = router;
