// utils/llm.js
require('dotenv').config();
// Polyfill fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GEMINI_API_KEY = process.env.GEMINI2_API_KEY;
const GEMINI_MODEL = 'models/gemini-1.5-flash-latest'; // High rate and token limit

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
          temperature: 0.5,         // More creative
          topP: 0.2,
          topK: 40,
          maxOutputTokens: 2048   // Or higher, up to model's limit
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
