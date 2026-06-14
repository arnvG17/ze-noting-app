// server/services/fusionService.js — Multi-query result fusion
// Merges results from multiple search queries, deduplicates, and re-ranks

/**
 * Fuse results from multiple search queries into a single ranked list.
 * Uses Reciprocal Rank Fusion (RRF) — a proven technique for merging 
 * ranked lists without needing a shared scoring scale.
 * 
 * @param {Array<Array>} resultSets - Array of result arrays from different queries
 * @param {number} topK - Number of final results to return
 * @returns {Array} Deduplicated, re-ranked results
 */
function fuseResults(resultSets, topK = 8) {
    if (!resultSets || resultSets.length === 0) return [];
    if (resultSets.length === 1) return resultSets[0].slice(0, topK);

    const k = 60; // RRF constant (standard value)
    const scoreMap = new Map(); // chunkId -> { score, chunk, appearances }
    
    for (const results of resultSets) {
        for (let rank = 0; rank < results.length; rank++) {
            const chunk = results[rank];
            const chunkId = chunk.id;
            
            // RRF score: 1 / (k + rank)
            const rrfScore = 1 / (k + rank + 1);
            
            if (scoreMap.has(chunkId)) {
                const existing = scoreMap.get(chunkId);
                existing.score += rrfScore;
                existing.appearances += 1;
                // Keep the higher ts_rank
                if (chunk.rank > existing.chunk.rank) {
                    existing.chunk = chunk;
                }
            } else {
                scoreMap.set(chunkId, {
                    score: rrfScore,
                    chunk: chunk,
                    appearances: 1
                });
            }
        }
    }

    // Sort by fused score (higher = more relevant)
    const fusedResults = Array.from(scoreMap.values())
        .sort((a, b) => {
            // Primary: RRF score
            if (b.score !== a.score) return b.score - a.score;
            // Tiebreak: number of queries it appeared in
            if (b.appearances !== a.appearances) return b.appearances - a.appearances;
            // Final tiebreak: ts_rank from PostgreSQL
            return (b.chunk.rank || 0) - (a.chunk.rank || 0);
        })
        .slice(0, topK)
        .map(entry => ({
            ...entry.chunk,
            fusionScore: entry.score,
            queryAppearances: entry.appearances
        }));

    console.log(`🔀 Fusion: ${resultSets.reduce((s, r) => s + r.length, 0)} results → ${fusedResults.length} unique (from ${resultSets.length} queries)`);
    
    return fusedResults;
}

module.exports = { fuseResults };
