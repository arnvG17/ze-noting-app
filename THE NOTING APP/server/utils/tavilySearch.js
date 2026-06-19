// server/utils/tavilySearch.js
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Simple in-memory cache to store queries and conserve free-tier API credits
const searchCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Perform a web search using Tavily API and cache results.
 * @param {string} query - The search query
 * @param {number} maxResults - Number of results to return (default 5, range 3-5)
 * @returns {Promise<Array<{title: string, url: string, content: string}>>}
 */
async function searchWeb(query, maxResults = 5) {
  if (!TAVILY_API_KEY) {
    console.warn("⚠️ Tavily API Key is missing. Web search will return no results.");
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cached = searchCache.get(normalizedQuery);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[Tavily Cache] Hit for query: "${normalizedQuery}"`);
    return cached.results.slice(0, maxResults);
  }

  console.log(`[Tavily API] Fetching search results for: "${normalizedQuery}"`);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic", // "basic" is free-tier friendly, avoiding "advanced" costs
        max_results: Math.min(Math.max(maxResults, 3), 5), // Keep between 3 and 5
        include_answer: false
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search API responded with status ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).map(item => ({
      title: item.title,
      url: item.url,
      content: item.content
    }));

    // Cache the full search results
    searchCache.set(normalizedQuery, {
      results,
      timestamp: now
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error("❌ Tavily web search error:", error);
    return [];
  }
}

module.exports = { searchWeb };
