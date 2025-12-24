// server/controllers/askController.js
// const chunkText = require('../utils/chunker');
// const createVectorStore = require('../vectorstores/inMemory');
const chat = require('../utils/llm3'); // Changed to use Together AI
require('dotenv').config();

exports.handleAsk = async (req, res) => {
  try {
    const { text, question } = req.body;

    // Validate inputs
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text is required and must be a string" });
    }
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: "Question is required and must be a string" });
    }

    // Use the full text as context (no chunking or embedding)
    const context = text;

    const response = await chat.call([
      { role: "system", content: "You are a helpful assistant. When providing code, always format it as a markdown code block with the correct language (e.g., ```js for JavaScript, ```python for Python, etc). Use clear explanations and include code examples in markdown format. Use markdown for all output." },
      { role: "user", content: `Context:\n\n${context}\n\nQuestion: ${question}\n\nPlease provide a detailed, well-explained answer, including examples and extra insights if possible. Format all code as markdown code blocks with the correct language.` }
    ]);
    console.log('DEBUG: LLM response received:', response);

    res.json({ answer: response.content });

  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
};

// Specialized quiz generation function
exports.handleQuizGeneration = async (req, res) => {
  try {
    const { text } = req.body;

    // Validate inputs
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text is required and must be a string" });
    }

    const quizPrompt = `Generate a quiz of 10 multiple-choice questions based on the following text. 

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Mark the correct answer clearly
- Questions should test understanding of key concepts from the text
- Mix different types of questions (factual, conceptual, application)
- Ensure all options are plausible but only one is correct
- Format the output as a valid JSON array

Example format:
[
  {
    "question": "What is the main topic discussed in the text?",
    "options": ["A) Technology", "B) Science", "C) History", "D) Literature"],
    "answer": "B) Science"
  }
]

Text to create quiz from:
${text.slice(0, 20000)}

Generate the quiz in the exact JSON format shown above. Do not include any explanations or additional text outside the JSON array.`;

    const response = await chat.call([
      { role: "system", content: "You are an expert quiz generator. You create high-quality multiple-choice questions that test understanding of the provided content. Always respond with valid JSON arrays containing quiz questions." },
      { role: "user", content: quizPrompt }
    ]);

    console.log('DEBUG: Quiz generation response received:', response);

    res.json({ answer: response.content });

  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};
