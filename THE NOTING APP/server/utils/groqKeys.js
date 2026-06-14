// server/utils/groqKeys.js — Groq API Key Rotation Utility
require('dotenv').config();

let currentIndex = 0;

/**
 * Scan environment variables for any Groq API keys.
 * Supports: GROQ_API_KEY, and GROQ_API_KEY_0, GROQ_API_KEY_1, ... GROQ_API_KEY_9
 * @returns {Array<string>} List of unique valid API keys
 */
function getGroqKeys() {
  const keys = [];
  
  if (process.env.GROQ_API_KEY) {
    keys.push(process.env.GROQ_API_KEY);
  }
  
  // Scan for indexed keys
  for (let i = 0; i < 10; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }

  // Deduplicate and filter out placeholders
  return Array.from(new Set(keys)).filter(
    k => k && k !== 'your_groq_api_key_here' && k.trim() !== ''
  );
}

/**
 * Check if at least one Groq API key is configured
 * @returns {boolean}
 */
function hasGroqKeys() {
  return getGroqKeys().length > 0;
}

/**
 * Get the next Groq key in round-robin sequence
 * @returns {string|null}
 */
function getNextGroqKey() {
  const keys = getGroqKeys();
  if (keys.length === 0) {
    return null;
  }
  const key = keys[currentIndex % keys.length];
  currentIndex = (currentIndex + 1) % keys.length;
  return key;
}

module.exports = {
  getGroqKeys,
  hasGroqKeys,
  getNextGroqKey
};
