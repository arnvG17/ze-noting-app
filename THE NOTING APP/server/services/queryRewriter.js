// server/services/queryRewriter.js — LLM-powered query expansion
// Generates multiple search query variations for better retrieval

const chat = require('../utils/llm3');

/**
 * Rewrite a user question into multiple keyword-focused search queries.
 * This dramatically improves retrieval by searching from multiple angles.
 * 
 * @param {string} userQuestion - The original user question
 * @returns {Promise<string[]>} Array of 3-4 search queries (including original)
 */
async function rewriteQuery(userQuestion) {
    if (!userQuestion || typeof userQuestion !== 'string') {
        return [userQuestion];
    }

    try {
        const response = await chat.call([
            {
                role: 'system',
                content: `You are a search query optimizer. Given a user question, generate exactly 3 alternative search queries that would help find relevant information in a document.

Rules:
- Each query should approach the topic from a different angle
- Use specific keywords and technical terms
- Keep each query concise (5-10 words)
- DO NOT add explanations
- Return ONLY a JSON array of strings

Example input: "How does fiscal policy affect inflation?"
Example output: ["fiscal policy inflation impact effects", "government spending monetary inflation relationship", "taxation budget deficit price level"]`
            },
            {
                role: 'user',
                content: userQuestion
            }
        ], { max_tokens: 200, temperature: 0.3 });

        // Parse the response
        const content = response.content.trim();
        let queries = [];

        try {
            // Try direct JSON parse
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                queries = JSON.parse(jsonMatch[0]);
            }
        } catch (parseErr) {
            // Fall back to line-by-line parsing
            queries = content
                .split('\n')
                .map(line => line.replace(/^[\d\-\.\*]+\s*/, '').replace(/["']/g, '').trim())
                .filter(line => line.length > 3 && line.length < 200);
        }

        // Validate and clean
        queries = queries
            .filter(q => typeof q === 'string' && q.length > 3)
            .slice(0, 3);

        // Always include the original query
        return [userQuestion, ...queries];

    } catch (err) {
        console.warn('⚠️ Query rewriting failed, using original:', err.message);
        return [userQuestion];
    }
}

module.exports = { rewriteQuery };
