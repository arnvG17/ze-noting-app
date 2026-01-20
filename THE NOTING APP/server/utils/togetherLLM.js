// utils/togetherLLM.js
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'; // Fast and powerful model

async function togetherChat(messages) {
    try {
        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: TOGETHER_MODEL,
                messages: messages,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 8192,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Together AI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[DEBUG] Together AI response received');

        const content = data.choices?.[0]?.message?.content || '';
        return { content };
    } catch (error) {
        console.error('[ERROR] Together AI API call failed:', error.message);
        throw error;
    }
}

module.exports = { call: togetherChat };
