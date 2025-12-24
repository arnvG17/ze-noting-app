// utils/llm.js
require('dotenv').config();
// Polyfill fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'models/gemini-2.0-flash-exp'; // Latest with 1M token context window

async function geminiChat(messages) {
  const prompt = messages.map(msg => msg.content).join('\n');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,         // Balanced creativity for better summaries
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192   // Increased for longer, more detailed summaries
        }
      })
    }
  );
  const data = await response.json();
  console.log('Gemini LLM API response:', data); // Debug log
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content };
}

module.exports = { call: geminiChat };
