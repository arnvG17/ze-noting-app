// server/services/ragPipeline.js — Full Vectorless RAG Orchestrator
// Ties together: query rewriting → search → fusion → LLM filtering → context management

const { rewriteQuery } = require('./queryRewriter');
const { hybridSearch } = require('./searchService');
const { fuseResults } = require('./fusionService');
const { filterChunks } = require('./filterService');
const { trimToFit, formatContext } = require('./contextManager');

/**
 * Execute the full vectorless RAG pipeline.
 * 
 * Flow:
 * 1. LLM rewrites query → 3-4 search variations
 * 2. PostgreSQL full-text search for each variation
 * 3. Reciprocal Rank Fusion merges results
 * 4. LLM filters for relevance
 * 5. Context manager trims to fit token budget
 * 6. Returns formatted context with citations
 * 
 * @param {string} question - User's question
 * @param {string[]} documentIds - Selected document IDs to search within
 * @param {object} options
 * @param {number} options.maxChunks - Max chunks after filtering (default 5)
 * @param {number} options.maxTokens - Max context tokens (default 3000)
 * @param {number} options.searchLimit - Max results per query (default 10)
 * @param {boolean} options.skipRewrite - Skip query rewriting (for speed)
 * @param {boolean} options.skipFilter - Skip LLM filtering (for speed)
 * @returns {Promise<{context: string, chunks: Array, queryVariations: string[]}>}
 */
async function runRAG(question, documentIds, options = {}) {
    const {
        maxChunks = 5,
        maxTokens = 3000,
        searchLimit = 10,
        skipRewrite = false,
        skipFilter = false
    } = options;

    console.log(`\n🔍 RAG Pipeline starting for: "${question.substring(0, 80)}..."`);
    console.log(`   📂 Searching in ${documentIds.length} document(s)`);

    // Step 1: Query Rewriting
    let queries;
    if (skipRewrite) {
        queries = [question];
    } else {
        console.log('   1️⃣ Rewriting query...');
        queries = await rewriteQuery(question);
        console.log(`   → ${queries.length} query variations generated`);
    }

    // Step 2: Search each query variation
    console.log('   2️⃣ Running full-text search...');
    const resultSets = [];
    for (const q of queries) {
        const results = await hybridSearch(q, documentIds, searchLimit);
        if (results.length > 0) {
            resultSets.push(results);
        }
    }

    if (resultSets.length === 0 || resultSets.every(r => r.length === 0)) {
        console.log('   ⚠️ No search results found');
        return {
            context: 'No relevant information found in the selected sources for this question.',
            chunks: [],
            queryVariations: queries
        };
    }

    // Step 3: Multi-query fusion
    console.log('   3️⃣ Fusing results...');
    const fused = fuseResults(resultSets, maxChunks * 2); // Get more than needed for filtering

    // Step 4: LLM Filtering
    let filtered;
    if (skipFilter || fused.length <= maxChunks) {
        filtered = fused.slice(0, maxChunks);
    } else {
        console.log('   4️⃣ LLM filtering...');
        filtered = await filterChunks(fused, question, maxChunks);
    }

    // Step 5: Context window management
    console.log('   5️⃣ Trimming to fit context window...');
    const trimmed = trimToFit(filtered, maxTokens);

    // Step 6: Format context
    const context = formatContext(trimmed);

    console.log(`   ✅ RAG complete: ${trimmed.length} chunks, context ready\n`);

    return {
        context,
        chunks: trimmed,
        queryVariations: queries
    };
}

module.exports = { runRAG };
