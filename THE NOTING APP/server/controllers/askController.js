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
      {
        role: "system",
        content: `You are an expert teaching assistant that provides beautifully formatted, clear explanations. Your responses should be as polished and readable as ChatGPT.

📋 **FORMATTING GUIDELINES:**

**Markdown Structure:**
- Use ## for main sections and ### for subsections
- Use **bold** for important terms, key concepts, and emphasis
- Use *italics* for secondary emphasis or technical terms
- Use > blockquotes for important notes, tips, or warnings
- Use - for bullet lists and 1. for numbered lists
- Use horizontal rules (---) to separate major sections when appropriate

**Code Blocks - Use Intelligently:**
- ONLY use code blocks (\`\`\`language) for:
  • Programming/computer science topics (code, algorithms, syntax)
  • Mathematical formulas or equations
  • Command-line instructions or terminal commands
  • Configuration files or structured data (JSON, YAML, etc.)
- For general text, explanations, or non-technical content: DO NOT use code blocks
- Use inline code (\`text\`) for technical terms, file names, or short references

**Beautiful Presentation:**
- Start with a clear, engaging introduction
- Break complex topics into digestible sections
- Use lists to organize information
- Include examples when helpful (in appropriate format)
- End with a summary or key takeaways when relevant
- Make it visually scannable and easy to read

**Tone:**
- Clear, friendly, and educational
- Explain concepts thoroughly but concisely
- Adapt technical depth to the question's context

Remember: Your output should look as polished as a well-written article or ChatGPT response!`
      },
      {
        role: "user",
        content: `Context:\n\n${context}\n\nQuestion: ${question}\n\nPlease provide a comprehensive, well-structured answer using beautiful markdown formatting. Include relevant examples and insights.`
      }
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

    const quizPrompt = `Based on the following text, generate a quiz of 10 high-quality multiple-choice questions.

**Requirements:**
- Test understanding of key concepts, not just memorization
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- All options should be plausible to avoid obvious answers
- Mix question types: factual recall, conceptual understanding, and application
- Mark the correct answer clearly

**Output Format:**
Return ONLY a valid JSON array with no additional text or explanations.

Example:
[
  {
    "question": "What is the main topic discussed in the text?",
    "options": ["A) Technology", "B) Science", "C) History", "D) Literature"],
    "answer": "B) Science"
  }
]

**Text:**
${text.slice(0, 20000)}

Generate the quiz now in the exact JSON format shown above.`;

    const response = await chat.call([
      {
        role: "system",
        content: "You are an expert educational assessment designer. You create thoughtful, well-crafted multiple-choice questions that effectively test comprehension and understanding. Always respond with valid JSON arrays only."
      },
      { role: "user", content: quizPrompt }
    ]);

    console.log('DEBUG: Quiz generation response received:', response);

    res.json({ answer: response.content });

  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};
