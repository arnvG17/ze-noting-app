// server/routes/ask.js — Updated with RAG support
const express = require('express');
const router = express.Router();
const { handleAsk, handleQuizGeneration, getChatHistory } = require('../controllers/askController');

router.post('/', handleAsk);
router.post('/quiz', handleQuizGeneration);
router.get('/history/:notebookId', getChatHistory);

module.exports = router;
