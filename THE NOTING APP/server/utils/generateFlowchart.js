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
    const systemPrompt = `You are an expert at analyzing documents and creating visual flowcharts that represent the ACTUAL content and structure.

**CRITICAL:** DO NOT use generic placeholders. Extract REAL topics and concepts from the document.

Your task:
1. READ the document and identify its SPECIFIC main topic
2. Find the ACTUAL sections, steps, or themes mentioned
3. Extract REAL key points and concepts
4. Show the logical flow between these ACTUAL elements

**OUTPUT FORMAT:**
Respond with ONLY valid JSON (no markdown, no code blocks, no explanation).

Structure:
{
  "nodes": [
    { "id": "1", "type": "input", "position": { "x": 250, "y": 0 }, "data": { "label": "REAL Document Title/Topic" } },
    { "id": "2", "type": "default", "position": { "x": 150, "y": 120 }, "data": { "label": "Actual Section 1" } },
    { "id": "3", "type": "default", "position": { "x": 350, "y": 120 }, "data": { "label": "Actual Section 2" } },
    { "id": "4", "type": "default", "position": { "x": 250, "y": 240 }, "data": { "label": "Real Key Concept" } },
    { "id": "5", "type": "output", "position": { "x": 250, "y": 360 }, "data": { "label": "Actual Goal/Outcome" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true },
    { "id": "e1-3", "source": "1", "target": "3", "animated": true },
    { "id": "e2-4", "source": "2", "target": "4", "animated": false },
    { "id": "e3-4", "source": "3", "target": "4", "animated": false },
    { "id": "e4-5", "source": "4", "target": "5", "animated": true }
  ]
}

**RULES:**
- First node (type "input"): Document's main topic (from the actual doc)
- Middle nodes (type "default"): Specific sections, requirements, steps, or components
- Last node (type "output"): Final goal, conclusion, or deliverable
- Labels: Max 40 chars, use ACTUAL content from document
- Create 6-12 nodes based on document complexity
- Positioning: center x:250, left branch x:100-150, right branch x:350-400
- Increment y by 100-140 per level

**EXAMPLES:**
❌ WRONG: "Document Overview" → "Content Analysis" → "Key Points"
✅ RIGHT: "Python Gmail-Sheets Automation" → "Gmail API Setup" → "OAuth Authentication" → "Email Processing" → "Sheet Logging" → "Duplicate Prevention"

❌ WRONG: "Introduction" → "Main Content" → "Conclusion"  
✅ RIGHT: "Photosynthesis" → "Light Absorption" → "Water Splitting" → "CO₂ Fixation" → "Glucose Output"

Extract the REAL structure from the document below. Use SPECIFIC terms from the text.`;

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
