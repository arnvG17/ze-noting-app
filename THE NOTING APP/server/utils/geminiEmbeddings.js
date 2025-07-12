require('dotenv').config();
// Polyfill fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Embeddings function for vector store
async function embedTexts(texts) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const embeddings = [];
  for (const text of texts) {
    try {
      console.log('DEBUG: Requesting embedding for text of length', text.length);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "models/embedding-001",
            content: {
              parts: [{ text: text }]
            }
          })
        }
      );
      const data = await response.json();
      if (data.error) {
        console.error('Gemini API error:', data.error);
        throw new Error(`Gemini API error: ${data.error.message}`);
      }
      if (!data.embedding || !data.embedding.values) {
        console.error('DEBUG: Gemini API did not return embedding values:', data);
        throw new Error('Gemini API did not return embedding values: ' + JSON.stringify(data));
      }
      embeddings.push(data.embedding.values);
      console.log('DEBUG: Embedding received');
    } catch (err) {
      console.error('DEBUG: Embedding error:', err);
      throw err;
    }
  }
  return embeddings;
}

// Chat function for LLM
async function geminiChat(messages) {
  const prompt = messages.map(msg => msg.content).join('\n');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content };
}

module.exports = { embedTexts, call: geminiChat };