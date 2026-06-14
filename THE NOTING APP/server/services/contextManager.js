// server/services/contextManager.js — Token/context window management
// Ensures we don't overflow the LLM context window

/**
 * Estimate token count from text (rough approximation: ~0.75 tokens per word)
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
    if (!text) return 0;
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.33); // ~1.33 tokens per word on average
}

/**
 * Trim chunks to fit within a token budget.
 * Prioritizes higher-ranked chunks and trims content of lower-ranked ones.
 * 
 * @param {Array} chunks - Ranked array of chunks
 * @param {number} maxTokens - Total token budget for context (default 3000)
 * @param {number} maxChunkTokens - Max tokens per individual chunk (default 400)
 * @returns {Array} Trimmed chunks that fit within budget
 */
function trimToFit(chunks, maxTokens = 3000, maxChunkTokens = 400) {
    if (!chunks || chunks.length === 0) return [];

    const result = [];
    let totalTokens = 0;

    for (const chunk of chunks) {
        let content = chunk.content;
        let contentTokens = estimateTokens(content);

        // Trim individual chunk if too long
        if (contentTokens > maxChunkTokens) {
            const words = content.split(/\s+/);
            const targetWords = Math.floor(maxChunkTokens / 1.33);
            content = words.slice(0, targetWords).join(' ') + '...';
            contentTokens = maxChunkTokens;
        }

        // Check if adding this chunk would exceed budget
        if (totalTokens + contentTokens > maxTokens) {
            // Try to fit a trimmed version
            const remainingTokens = maxTokens - totalTokens;
            if (remainingTokens > 100) { // Only add if meaningful space left
                const words = content.split(/\s+/);
                const targetWords = Math.floor(remainingTokens / 1.33);
                content = words.slice(0, targetWords).join(' ') + '...';
                contentTokens = remainingTokens;
                
                result.push({
                    ...chunk,
                    content,
                    trimmed: true,
                    tokenEstimate: contentTokens
                });
                totalTokens += contentTokens;
            }
            break; // No more room
        }

        result.push({
            ...chunk,
            content,
            trimmed: contentTokens !== estimateTokens(chunk.content),
            tokenEstimate: contentTokens
        });
        totalTokens += contentTokens;
    }

    console.log(`📏 Context: ${result.length} chunks, ~${totalTokens} tokens (budget: ${maxTokens})`);
    return result;
}

/**
 * Format chunks into a context string with source citations
 * @param {Array} chunks - Processed chunks
 * @returns {string} Formatted context for LLM prompt
 */
function formatContext(chunks) {
    if (!chunks || chunks.length === 0) {
        return 'No relevant context found in the selected sources.';
    }

    return chunks.map((chunk, i) => {
        const source = chunk.original_name || chunk.filename || 'Unknown';
        const page = chunk.page_number ? `p.${chunk.page_number}` : 'unknown page';
        return `[Source ${i + 1}: ${source}, ${page}]\n${chunk.content}`;
    }).join('\n\n---\n\n');
}

module.exports = { estimateTokens, trimToFit, formatContext };
