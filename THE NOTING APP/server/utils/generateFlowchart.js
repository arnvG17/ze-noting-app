// server/utils/generateFlowchart.js
const chat = require('./llm');

/**
 * Generate a ReactFlow-compatible flowchart structure from document text.
 * Uses LLM to analyze document structure and create nodes/edges.
 * 
 * @param {string} textContent - The parsed document text
 * @returns {Promise<{nodes: Array, edges: Array}>} - ReactFlow-compatible data
 */
async function generateFlowchart(textContent) {
    const systemPrompt = `You are an expert at analyzing documents and extracting their logical structure as a flowchart.

Your task is to analyze the provided document and create a flowchart that represents:
1. Main topics/sections as primary nodes
2. Subtopics/key points as secondary nodes
3. Logical flow and relationships between concepts

**OUTPUT FORMAT:**
You MUST respond with ONLY valid JSON (no markdown, no explanation, no code blocks). The JSON must have this exact structure:

{
  "nodes": [
    { "id": "1", "type": "input", "position": { "x": 250, "y": 0 }, "data": { "label": "Main Title" } },
    { "id": "2", "type": "default", "position": { "x": 250, "y": 100 }, "data": { "label": "Section 1" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true }
  ]
}

**NODE RULES:**
- The first node should have type "input" (represents the document title/main topic)
- Middle nodes should have type "default"
- Final conclusion nodes should have type "output"
- Position nodes in a logical top-to-bottom or left-to-right flow
- Use x: 250 as center, adjust x for parallel branches (x: 100, x: 400 for side branches)
- Increment y by ~100-120 for each level down
- Keep labels concise (max 50 characters)
- Create 5-15 nodes depending on document complexity

**EDGE RULES:**
- Connect nodes that have logical relationships
- Use "animated": true for main flow, false for secondary connections
- Edge id format: "e{source}-{target}"

**ANALYSIS APPROACH:**
1. Identify the main topic/title
2. Find major sections or themes
3. Extract key concepts within each section
4. Determine relationships and flow between concepts
5. Create a hierarchical but connected structure

Respond with ONLY the JSON object, nothing else.`;

    const llmPrompt = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this document and create a flowchart:\n\n${textContent.slice(0, 30000)}` }
    ];

    try {
        console.log('[DEBUG] Generating flowchart from document...');
        const response = await chat.call(llmPrompt);
        let content = response.content || '';

        // Clean up the response - remove any markdown code blocks if present
        content = content.trim();
        if (content.startsWith('```json')) {
            content = content.slice(7);
        } else if (content.startsWith('```')) {
            content = content.slice(3);
        }
        if (content.endsWith('```')) {
            content = content.slice(0, -3);
        }
        content = content.trim();

        // Parse the JSON
        const flowchartData = JSON.parse(content);

        // Validate structure
        if (!flowchartData.nodes || !Array.isArray(flowchartData.nodes)) {
            throw new Error('Invalid flowchart: missing nodes array');
        }
        if (!flowchartData.edges || !Array.isArray(flowchartData.edges)) {
            flowchartData.edges = [];
        }

        // Ensure all nodes have required fields
        flowchartData.nodes = flowchartData.nodes.map((node, index) => ({
            id: node.id || String(index + 1),
            type: node.type || 'default',
            position: node.position || { x: 250, y: index * 100 },
            data: {
                label: node.data?.label || `Node ${index + 1}`
            }
        }));

        // Ensure all edges have required fields
        flowchartData.edges = flowchartData.edges.map((edge, index) => ({
            id: edge.id || `e${index}`,
            source: String(edge.source),
            target: String(edge.target),
            animated: edge.animated !== false
        }));

        console.log(`[DEBUG] Flowchart generated: ${flowchartData.nodes.length} nodes, ${flowchartData.edges.length} edges`);
        return flowchartData;

    } catch (error) {
        console.error('[DEBUG] Flowchart generation error:', error.message);

        // Return a fallback flowchart structure
        return {
            nodes: [
                { id: '1', type: 'input', position: { x: 250, y: 0 }, data: { label: 'Document Overview' } },
                { id: '2', type: 'default', position: { x: 250, y: 100 }, data: { label: 'Content Analysis' } },
                { id: '3', type: 'output', position: { x: 250, y: 200 }, data: { label: 'Key Points' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2', animated: true },
                { id: 'e2-3', source: '2', target: '3', animated: true }
            ]
        };
    }
}

module.exports = { generateFlowchart };
