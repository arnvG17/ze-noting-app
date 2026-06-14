// server/services/citationService.js — Citation formatting and tracking

/**
 * Format a chunk into a citation string
 * @param {object} chunk - Chunk with filename and page_number
 * @param {number} index - Citation index (1-based)
 * @returns {string} Formatted citation like [Source: filename.pdf, p.4]
 */
function formatCitation(chunk, index) {
    const name = chunk.original_name || chunk.filename || 'Unknown';
    const page = chunk.page_number ? `p.${chunk.page_number}` : 'unknown page';
    return `[Source ${index}: ${name}, ${page}]`;
}

/**
 * Build citation metadata array from used chunks
 * @param {Array} chunks - Chunks used in the response
 * @returns {Array<{index: number, filename: string, page: number|null, chunkId: string}>}
 */
function buildCitationMetadata(chunks) {
    return chunks.map((chunk, i) => ({
        index: i + 1,
        filename: chunk.original_name || chunk.filename,
        page: chunk.page_number || null,
        chunkId: chunk.id,
        documentId: chunk.document_id
    }));
}

/**
 * Create the citation instruction for the LLM system prompt
 * @param {Array} chunks - Chunks being provided as context
 * @returns {string} Citation instruction text
 */
function citationInstruction(chunks) {
    if (!chunks || chunks.length === 0) return '';

    const sourceList = chunks.map((chunk, i) => {
        const name = chunk.original_name || chunk.filename || 'Unknown';
        const page = chunk.page_number ? `p.${chunk.page_number}` : '';
        return `Source ${i + 1}: ${name}${page ? ', ' + page : ''}`;
    }).join('\n');

    return `\nAvailable sources:\n${sourceList}\n\nWhen citing, use the format [Source N] where N is the source number. Cite ALL claims with the relevant source.`;
}

module.exports = { formatCitation, buildCitationMetadata, citationInstruction };
