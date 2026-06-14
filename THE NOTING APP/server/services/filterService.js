// server/services/filterService.js — LLM-based chunk relevance filtering
// Asks the LLM to select only the most relevant chunks for the query

const chat = require('../utils/llm3');

/**
 * Use LLM to filter chunks for relevance to the user's question.
 * This is the "reasoning" step that makes vectorless RAG competitive.
 * 
 * @param {Array} chunks - Retrieved chunks with content and metadata
 * @param {string} question - The user's original question
 * @param {number} maxChunks - Maximum chunks to keep (default 5)
 * @returns {Promise<Array>} Filtered chunks with relevance info
 */
async function filterChunks(chunks, question, maxChunks = 5) {
    if (!chunks || chunks.length === 0) return [];
    if (chunks.length <= maxChunks) return chunks; // No filtering needed

    try {
        // Prepare chunks for LLM
        const chunkSummaries = chunks.map((chunk, i) => {
            const preview = chunk.content.substring(0, 300).replace(/\n/g, ' ');
            return `[Chunk ${i}] (from: ${chunk.filename || 'unknown'}, p.${chunk.page_number || '?'}): ${preview}...`;
        }).join('\n\n');

        const response = await chat.call([
            {
                role: 'system',
                content: `You are a relevance filter. Given a question and a list of text chunks, select the indices of the ${maxChunks} MOST relevant chunks for answering the question.

Rules:
- Return ONLY a JSON array of chunk indices (e.g., [0, 2, 4])
- Select chunks that directly address the question
- Prefer chunks with specific facts, definitions, or explanations
- If fewer than ${maxChunks} are relevant, return only the relevant ones
- DO NOT add explanations`
            },
            {
                role: 'user',
                content: `Question: ${question}\n\nChunks:\n${chunkSummaries}\n\nReturn the indices of the most relevant chunks as a JSON array:`
            }
        ], { max_tokens: 100, temperature: 0.1 });

        // Parse selected indices
        const content = response.content.trim();
        let selectedIndices = [];

        try {
            const jsonMatch = content.match(/\[[\d\s,]*\]/);
            if (jsonMatch) {
                selectedIndices = JSON.parse(jsonMatch[0]);
            }
        } catch (parseErr) {
            // Fall back to extracting numbers
            selectedIndices = content.match(/\d+/g)?.map(Number) || [];
        }

        // Validate indices
        selectedIndices = selectedIndices
            .filter(i => typeof i === 'number' && i >= 0 && i < chunks.length)
            .slice(0, maxChunks);

        if (selectedIndices.length === 0) {
            // LLM didn't give valid indices, return top chunks by rank
            console.warn('⚠️ LLM filter returned no valid indices, using top by rank');
            return chunks.slice(0, maxChunks);
        }

        const filtered = selectedIndices.map(i => ({
            ...chunks[i],
            llmFiltered: true
        }));

        console.log(`🧠 LLM Filter: ${chunks.length} → ${filtered.length} chunks`);
        return filtered;

    } catch (err) {
        console.warn('⚠️ LLM filtering failed, using top chunks:', err.message);
        return chunks.slice(0, maxChunks);
    }
}

module.exports = { filterChunks };
