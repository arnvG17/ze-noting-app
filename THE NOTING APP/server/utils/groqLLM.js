// utils/groqLLM.js - FREE & Fast LLM!
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Updated to current model

async function groqChat(messages) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
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
        console.error('[ERROR] Groq API call failed:', error.message);
        throw error;
    }
}

module.exports = { call: groqChat };
