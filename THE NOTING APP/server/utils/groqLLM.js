// utils/groqLLM.js - FREE & Fast LLM!
require('dotenv').config();
const { getNextGroqKey } = require('./groqKeys');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Updated to current model

async function groqChat(messages) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const key = getNextGroqKey();
        if (!key) {
            const error = new Error('Groq API Key is missing. Please add it to your .env file or set GROQ_API_KEY_0, GROQ_API_KEY_1...');
            error.status = 401;
            throw error;
        }

        try {
            console.log(`🤖 [groqLLM] Using Groq API Key (attempt ${attempts + 1}): ...${key.slice(-6)}`);
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 8000,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[DEBUG] Groq API response received');

            const content = data.choices?.[0]?.message?.content || '';
            return { content };
        } catch (error) {
            attempts++;
            console.error(`[ERROR] Groq API call attempt ${attempts} failed:`, error.message);
            if (attempts >= maxAttempts) {
                throw error;
            }
            console.log('🔄 [groqLLM] Retrying with next Groq API key...');
        }
    }
}

module.exports = { call: groqChat };

