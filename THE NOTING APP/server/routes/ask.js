// server/routes/ask.js
const express = require('express');
const router = express.Router();
const { handleAsk, handleQuizGeneration } = require('../controllers/askController');

router.post('/', handleAsk);
router.post('/quiz', handleQuizGeneration);

module.exports = router;
