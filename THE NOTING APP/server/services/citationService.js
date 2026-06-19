// server/services/citationService.js — Citation formatting and tracking

/**
 * Format a chunk into a citation string
 * @param {object} chunk - Chunk with filename and page_number
 * @param {number} index - Citation index (1-based)
 * @returns {string} Formatted citation
 */
function formatCitation(chunk, index) {
    if (chunk.isWeb) {
        return `[Web ${index}: ${chunk.title || 'Web Link'}]`;
    }
    const name = chunk.original_name || chunk.filename || 'Unknown';
    const page = chunk.page_number ? `p.${chunk.page_number}` : 'unknown page';
    return `[Doc ${index}: ${name}, ${page}]`;
}

/**
 * Build citation metadata array from used chunks
 * @param {Array} chunks - Chunks used in the response
 * @returns {Array} Citation metadata array
 */
function buildCitationMetadata(chunks) {
    let docCount = 0;
    let webCount = 0;
    return chunks.map((chunk) => {
        if (chunk.isWeb) {
            webCount++;
            return {
                index: webCount,
                type: 'web',
                label: `Web ${webCount}`,
                filename: chunk.title || 'Web Link',
                url: chunk.url,
                chunkId: chunk.id
            };
        } else {
            docCount++;
            return {
                index: docCount,
                type: 'doc',
                label: `Doc ${docCount}`,
                filename: chunk.original_name || chunk.filename || 'Document',
                page: chunk.page_number || null,
                chunkId: chunk.id,
                documentId: chunk.document_id
            };
        }
    });
}

/**
 * Create the citation instruction for the LLM system prompt
 * @param {Array} chunks - Chunks being provided as context
 * @returns {string} Citation instruction text
 */
function citationInstruction(chunks) {
    if (!chunks || chunks.length === 0) return '';

    let docCount = 0;
    let webCount = 0;
    const sourceList = chunks.map((chunk) => {
        if (chunk.isWeb) {
            webCount++;
            return `Web ${webCount}: ${chunk.title || 'Web Link'} (URL: ${chunk.url || ''})`;
        } else {
            docCount++;
            const name = chunk.original_name || chunk.filename || 'Unknown';
            const page = chunk.page_number ? `p.${chunk.page_number}` : '';
            return `Doc ${docCount}: ${name}${page ? ', ' + page : ''}`;
        }
    }).join('\n');

    return `\nAvailable sources:\n${sourceList}\n\nWhen citing, use the format [Doc N] for local documents and [Web N] for web search results (where N is the number of the source in the list). Cite ALL claims with the relevant source.`;
}

module.exports = { formatCitation, buildCitationMetadata, citationInstruction };
