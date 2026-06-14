const chat = require('../utils/llm3');
const { runRAG } = require('../services/ragPipeline');
const { query } = require('../db/pool');
const { jsonrepair } = require('jsonrepair');

exports.generateFlowchart = async (req, res) => {
    try {
        const { context, notebookId, selectedDocIds } = req.body;

        let finalContext = context;

        // RAG mode: retrieve context if not directly provided but sources are selected
        if (!finalContext && (notebookId || (selectedDocIds && selectedDocIds.length > 0))) {
            let docIds = selectedDocIds;
            if (!docIds || docIds.length === 0) {
                // Fetch all ready documents for this notebook
                const docsResult = await query(
                    "SELECT id FROM documents WHERE notebook_id = $1 AND status = 'ready'",
                    [notebookId]
                );
                docIds = docsResult.rows.map(r => r.id);
            }

            if (docIds.length === 0) {
                return res.status(400).json({ error: "No ready documents found to generate flowchart" });
            }

            // Run vectorless RAG to retrieve the most relevant workflow / process context
            const ragResult = await runRAG(
                "Identify and describe step-by-step processes, sequential actions, decisions, and logical flow.",
                docIds,
                {
                    maxChunks: 8,
                    maxTokens: 4000
                }
            );
            finalContext = ragResult.context;
        }

        if (!finalContext || typeof finalContext !== 'string' || finalContext.trim() === '') {
            return res.status(400).json({ error: "Context or document information is required to generate a flowchart" });
        }

        // Call LLM to extract flowchart JSON
        const systemPrompt = `You are an expert process analyst. Your task is to extract a sequence of steps, processes, decisions, and loops from the user-provided context and output a structured flowchart.

Analyze the context:
1. Identify the sequence of steps.
2. Identify conditions (if/else branching).
3. Identify loops if present.
4. Normalize this into a logical, linear or branching graph.

Rules for nodes:
- Keep node labels concise (max 6–8 words per node).
- Categorize each node type as one of:
  - "start" (the entry point of the flowchart)
  - "process" (a step or action taken)
  - "decision" (a conditional branch, e.g. "Is credentials valid?")
  - "end" (an end point of the flowchart)
- Keep the number of nodes readable, limit to 10–15 nodes max.
- Do NOT hallucinate steps. Only use information directly provided in the context.

STRICT OUTPUT FORMAT:
You must respond with a single valid JSON object containing "nodes" and "edges". Do NOT include any markdown formatting (like \`\`\`json), explanation, or text outside the JSON.

JSON Schema:
{
  "nodes": [
    { "id": "1", "label": "Start Process", "type": "start" },
    { "id": "2", "label": "Verify user credentials", "type": "process" },
    { "id": "3", "label": "Are credentials valid?", "type": "decision" },
    { "id": "4", "label": "Access granted", "type": "process" },
    { "id": "5", "label": "Error: Access denied", "type": "end" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "" },
    { "source": "2", "target": "3", "label": "" },
    { "source": "3", "target": "4", "label": "Yes" },
    { "source": "3", "target": "5", "label": "No" }
  ]
}`;

        console.log(`🤖 Requesting flowchart from LLM...`);
        const llmResponse = await chat.call([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Context:\n\n${finalContext}` }
        ], {
            temperature: 0.1, // low temperature for highly structured formatting
            max_tokens: 3000
        });

        const rawContent = llmResponse.content.trim();
        console.log(`🤖 LLM Response received (length: ${rawContent.length})`);

        // Extract JSON structure if wrapped in markdown code blocks
        let jsonString = rawContent;
        const jsonRegex = /\{[\s\S]*\}/;
        const match = rawContent.match(jsonRegex);
        if (match) {
            jsonString = match[0];
        }

        let parsedFlowchart;
        try {
            parsedFlowchart = JSON.parse(jsonString);
        } catch (parseErr) {
            console.warn("⚠️ Initial JSON parse failed, attempting jsonrepair...");
            try {
                parsedFlowchart = JSON.parse(jsonrepair(jsonString));
            } catch (repairErr) {
                console.error("❌ Failed to parse flowchart JSON even after repair:", rawContent);
                return res.status(500).json({ error: "Failed to parse flowchart JSON from LLM response" });
            }
        }

        // Validate structure
        if (!parsedFlowchart.nodes || !Array.isArray(parsedFlowchart.nodes)) {
            parsedFlowchart.nodes = [];
        }
        if (!parsedFlowchart.edges || !Array.isArray(parsedFlowchart.edges)) {
            parsedFlowchart.edges = [];
        }

        // Clean nodes
        parsedFlowchart.nodes = parsedFlowchart.nodes.slice(0, 15).map(node => ({
            id: String(node.id),
            label: String(node.label || 'Step'),
            type: String(node.type || 'process')
        }));

        // Clean edges
        parsedFlowchart.edges = parsedFlowchart.edges.map(edge => ({
            source: String(edge.source),
            target: String(edge.target),
            label: String(edge.label || '')
        }));

        return res.json(parsedFlowchart);

    } catch (err) {
        console.error("Flowchart generation error:", err);
        return res.status(500).json({ error: "Failed to generate flowchart" });
    }
};
