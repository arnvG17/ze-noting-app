// server/services/ragPipeline.js — Full Vectorless RAG Orchestrator with Web Search & Think Mode
// Ties together: query rewriting → search → fusion → LLM filtering → context management

const { rewriteQuery } = require('./queryRewriter');
const { hybridSearch } = require('./searchService');
const { fuseResults } = require('./fusionService');
const { filterChunks } = require('./filterService');
const { trimToFit } = require('./contextManager');
const { searchWeb } = require('../utils/tavilySearch');
const chat = require('../utils/llm3');

// Try to load Anthropic SDK dynamically for Reranking if API key is present
let anthropicClient = null;
try {
    const Anthropic = require('@anthropic-ai/sdk');
    if (process.env.ANTHROPIC_API_KEY) {
        anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
} catch (err) {
    // Anthropic not installed locally
}

/**
 * Uses Claude (or fallback to Together/Groq client) to rerank candidate snippets.
 * Truncates previews to ~100 characters to conserve tokens.
 * @param {string} query - User question
 * @param {Array} candidates - Unified chunks
 * @returns {Promise<Array>} The top-5 reranked candidate chunks
 */
async function rerankCandidates(query, candidates) {
    if (candidates.length <= 5) {
        return candidates;
    }

    // Format previews, truncating to ~100 chars and stripping newlines
    const previews = candidates.map((c, i) => {
        const text = (c.content || "").substring(0, 100).replace(/\s+/g, ' ').trim();
        const typeLabel = c.isWeb ? 'WEB' : 'DOC';
        const sourceLabel = c.filename || 'Unknown';
        return `${i}: [${typeLabel}] (${sourceLabel}) "${text}"`;
    }).join('\n');

    const systemPrompt = `You are a high-speed, cost-conscious RAG document reranker.
Given a User Query and a numbered list of candidate chunk previews (truncated to 100 characters), assess their relevance.
Output ONLY a raw JSON object containing the 0-based indices of the 5 most relevant chunks in descending order of relevance:
{"top_indices": [idx1, idx2, idx3, idx4, idx5]}

CRITICAL RULES:
1. Do NOT output any markdown code blocks, formatting (e.g. no \`\`\`json), or conversational text.
2. Output ONLY the raw JSON object string.
3. Every index must be valid (between 0 and ${candidates.length - 1}).`;

    const userContent = `User Query: "${query}"\n\nCandidate Chunks:\n${previews}`;

    try {
        if (anthropicClient) {
            console.log("🧠 Reranking candidates using Claude...");
            const response = await anthropicClient.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 100,
                temperature: 0,
                system: systemPrompt,
                messages: [{ role: "user", content: userContent }]
            });
            const text = response.content[0].text.trim();
            const cleanJson = text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.top_indices)) {
                return parsed.top_indices
                    .map(idx => candidates[parseInt(idx, 10)])
                    .filter(c => c !== undefined)
                    .slice(0, 5);
            }
        } else {
            console.log("🧠 Reranking candidates using Groq/Together AI (fallback)...");
            const response = await chat.call([
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ], { max_tokens: 100, temperature: 0 });
            const text = response.content.trim();
            const cleanJson = text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.top_indices)) {
                return parsed.top_indices
                    .map(idx => candidates[parseInt(idx, 10)])
                    .filter(c => c !== undefined)
                    .slice(0, 5);
            }
        }
    } catch (err) {
        console.warn("⚠️ Reranking failed, falling back to top-5 candidates:", err.message);
    }
    return candidates.slice(0, 5);
}

/**
 * Format chunks into a dual-context structure with distinct labels.
 */
function formatContextWithToggles(chunks) {
    const docChunks = chunks.filter(c => !c.isWeb);
    const webChunks = chunks.filter(c => c.isWeb);
    
    let contextParts = [];
    
    if (docChunks.length > 0) {
        contextParts.push("[YOUR DOCUMENTS]");
        docChunks.forEach((chunk, i) => {
            const source = chunk.original_name || chunk.filename || 'Unknown Document';
            const page = chunk.page_number ? `, p.${chunk.page_number}` : '';
            contextParts.push(`Doc ${i + 1}: ${source}${page}\nContent: ${chunk.content}`);
        });
    }
    
    if (webChunks.length > 0) {
        contextParts.push("[WEB RESULTS]");
        webChunks.forEach((chunk, i) => {
            contextParts.push(`Web ${i + 1}: ${chunk.filename} (URL: ${chunk.url || ''})\nContent: ${chunk.content}`);
        });
    }
    
    if (contextParts.length === 0) {
        return 'No relevant context found.';
    }
    
    return contextParts.join('\n\n');
}

/**
 * Execute the full vectorless RAG pipeline.
 * 
 * @param {string} question - User's question
 * @param {string[]} documentIds - Selected document IDs to search within
 * @param {object} options
 * @param {number} options.maxChunks - Max chunks after filtering (default 5)
 * @param {number} options.maxTokens - Max context tokens (default 3000)
 * @param {boolean} options.skipRewrite - Skip query rewriting (for speed)
 * @param {boolean} options.webSearch - Enable Tavily Web Search
 * @param {boolean} options.thinkMode - Enable Think Mode (high-latency reranking)
 * @returns {Promise<{context: string, chunks: Array, queryVariations: string[]}>}
 */
async function runRAG(question, documentIds, options = {}) {
    const {
        maxChunks = 5,
        maxTokens = 3000,
        skipRewrite = false,
        webSearch = false,
        thinkMode = false
    } = options;

    console.log(`\n🔍 RAG Pipeline starting for: "${question.substring(0, 80)}..."`);
    console.log(`   📂 Searching in ${documentIds.length} document(s)`);
    console.log(`   Toggles: webSearch=${webSearch}, thinkMode=${thinkMode}`);

    // If thinkMode is active, retrieve up to 20 local chunks. Otherwise retrieve 5.
    const actualSearchLimit = thinkMode ? 20 : 5;

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
        const results = await hybridSearch(q, documentIds, actualSearchLimit);
        if (results.length > 0) {
            resultSets.push(results);
        }
    }

    // Step 3: Multi-query fusion
    console.log('   3️⃣ Fusing results...');
    let fused = [];
    if (resultSets.length > 0) {
        fused = fuseResults(resultSets, thinkMode ? 20 : maxChunks);
    }

    // Step 3.5: Fetch web search results if enabled
    let webChunks = [];
    if (webSearch) {
        console.log('   🌐 Calling web search...');
        const webResults = await searchWeb(question, 5);
        webChunks = webResults.map((r, i) => ({
            id: `web-${i}`,
            content: r.content,
            document_id: null,
            filename: r.title || 'Web Result',
            url: r.url,
            isWeb: true
        }));
    }

    // Combine local chunks and web chunks
    let candidates = [...fused, ...webChunks];

    if (candidates.length === 0) {
        console.log('   ⚠️ No candidates found');
        return {
            context: 'No relevant information found in the selected sources or web search.',
            chunks: [],
            queryVariations: queries
        };
    }

    // Step 4: Reranking / Relevance filtering
    let filtered;
    if (thinkMode) {
        console.log('   4️⃣ LLM Reranking (Think Mode)...');
        filtered = await rerankCandidates(question, candidates);
    } else {
        // Normal flow: Send all retrieved candidates (up to 5 local docs and 5 web results)
        // to the final generation step, ensuring web results aren't cut off.
        filtered = candidates;
    }

    // Step 5: Context window management
    console.log('   5️⃣ Trimming to fit context window...');
    const trimmed = trimToFit(filtered, maxTokens);

    // Step 6: Format context
    const context = formatContextWithToggles(trimmed);

    console.log(`   ✅ RAG complete: ${trimmed.length} chunks, context ready\n`);

    return {
        context,
        chunks: trimmed,
        queryVariations: queries
    };
}

module.exports = { runRAG };
