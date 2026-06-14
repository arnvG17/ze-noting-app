// server/services/searchService.js — PostgreSQL full-text search
// BM25-style keyword retrieval using tsvector + ts_rank

const { query } = require('../db/pool');

/**
 * Search chunks using PostgreSQL full-text search
 * Only searches within specified document IDs (source-aware)
 * 
 * @param {string} searchQuery - The search query text
 * @param {string[]} documentIds - Array of document IDs to search within
 * @param {number} limit - Max results to return
 * @returns {Promise<Array<{id, content, chunk_index, page_number, word_count, document_id, filename, rank}>>}
 */
async function searchChunks(searchQuery, documentIds, limit = 10) {
    if (!searchQuery || !documentIds || documentIds.length === 0) {
        return [];
    }

    // Use plainto_tsquery for natural language queries
    // Also try websearch_to_tsquery for more flexible matching
    const result = await query(
        `SELECT 
            c.id,
            c.content,
            c.chunk_index,
            c.page_number,
            c.word_count,
            c.document_id,
            d.filename,
            d.original_name,
            ts_rank(c.tsv, plainto_tsquery('english', $1)) AS rank,
            ts_headline('english', c.content, plainto_tsquery('english', $1),
                'StartSel=**, StopSel=**, MaxWords=60, MinWords=20') AS headline
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         WHERE c.tsv @@ plainto_tsquery('english', $1)
           AND c.document_id = ANY($2::uuid[])
         ORDER BY rank DESC
         LIMIT $3`,
        [searchQuery, documentIds, limit]
    );

    return result.rows;
}

/**
 * Search with websearch syntax (supports AND, OR, NOT, quotes)
 * Fallback for when plainto_tsquery returns no results
 */
async function searchChunksWebsearch(searchQuery, documentIds, limit = 10) {
    if (!searchQuery || !documentIds || documentIds.length === 0) {
        return [];
    }

    try {
        const result = await query(
            `SELECT 
                c.id,
                c.content,
                c.chunk_index,
                c.page_number,
                c.word_count,
                c.document_id,
                d.filename,
                d.original_name,
                ts_rank(c.tsv, websearch_to_tsquery('english', $1)) AS rank
             FROM chunks c
             JOIN documents d ON c.document_id = d.id
             WHERE c.tsv @@ websearch_to_tsquery('english', $1)
               AND c.document_id = ANY($2::uuid[])
             ORDER BY rank DESC
             LIMIT $3`,
            [searchQuery, documentIds, limit]
        );
        return result.rows;
    } catch (err) {
        // websearch_to_tsquery can fail on malformed input, fall back to plain
        console.warn('⚠️ Websearch query failed, falling back to plain:', err.message);
        return searchChunks(searchQuery, documentIds, limit);
    }
}

/**
 * Hybrid search: try plain query first, fall back to websearch if no results
 */
async function hybridSearch(searchQuery, documentIds, limit = 10) {
    let results = await searchChunks(searchQuery, documentIds, limit);
    
    if (results.length === 0) {
        // Try websearch syntax as fallback
        results = await searchChunksWebsearch(searchQuery, documentIds, limit);
    }

    // If still nothing, try individual words with OR logic
    if (results.length === 0) {
        const words = searchQuery.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 1) {
            const orQuery = words.join(' | ');
            try {
                const result = await query(
                    `SELECT 
                        c.id, c.content, c.chunk_index, c.page_number, c.word_count,
                        c.document_id, d.filename, d.original_name,
                        ts_rank(c.tsv, to_tsquery('english', $1)) AS rank
                     FROM chunks c
                     JOIN documents d ON c.document_id = d.id
                     WHERE c.tsv @@ to_tsquery('english', $1)
                       AND c.document_id = ANY($2::uuid[])
                     ORDER BY rank DESC
                     LIMIT $3`,
                    [orQuery, documentIds, limit]
                );
                results = result.rows;
            } catch (err) {
                console.warn('⚠️ OR-query fallback failed:', err.message);
            }
        }
    }

    return results;
}

module.exports = { searchChunks, searchChunksWebsearch, hybridSearch };
