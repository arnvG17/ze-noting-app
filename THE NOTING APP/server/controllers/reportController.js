const chat = require('../utils/llm3');
const { query } = require('../db/pool');

/**
 * Generate a thoroughly researched document report
 * POST /api/report/generate
 */
exports.generateReport = async (req, res) => {
  try {
    const { notebookId, tone, focus, extraInputs } = req.body;

    if (!notebookId) {
      return res.status(400).json({ error: "notebookId is required" });
    }

    let descriptionText = "";

    // 1. Fetch document summaries & text chunks from DB
    const docsResult = await query(
      "SELECT id, filename, summary FROM documents WHERE notebook_id = $1 AND status = 'ready'",
      [notebookId]
    );

    if (docsResult.rows.length === 0) {
      return res.status(400).json({ error: "No ready documents found in this workspace to report on." });
    }

    const docIds = docsResult.rows.map(r => r.id);
    
    // Fetch up to 8 text chunks for deep content coverage (limited to avoid Groq 12k TPM rate limits)
    const chunksResult = await query(
      "SELECT content FROM chunks WHERE document_id = ANY($1::uuid[]) ORDER BY chunk_index LIMIT 8",
      [docIds]
    );
    const chunksText = chunksResult.rows.map(r => r.content).join('\n\n');
    
    descriptionText = docsResult.rows.map(r => `Document: ${r.filename}\nSummary: ${r.summary}`).join('\n\n') +
      "\n\n--- Detailed Content Extracts ---\n" + chunksText;

    // 2. Prepare LLM system and user prompt
    const systemPrompt = `You are a world-class research analyst and technical writer.
Your task is to write a highly detailed, comprehensive, and thoroughly researched report summarizing and analyzing the subject matter presented in the provided documents.

The report MUST be written in the following style:
- Tone: ${tone || 'Formal'}
- Focus / Audience: ${focus || 'Business'}

Write the report using clean, clear Markdown formatting. 
Use a structured outline including:
- **Title**: A professional, topic-specific title
- **Executive Summary**: A high-level overview of the findings
- **Detailed Findings & Methodology**: Thorough analysis of the key points in the documents
- **Key takeaways / Insights**: Bulleted core findings
- **Domain Recommendations**: Actionable items based on the data
- **Conclusion**: A strong closing statement

Ensure you base all findings strictly on the document text. Do not make up facts.`;

    let userPrompt = `Generate the research report based on the following document context:\n\n${descriptionText}\n\n`;
    if (extraInputs) {
      userPrompt += `Additional Custom Guidelines or Sections to Include:\n${extraInputs}\n\n`;
    }

    console.log(`🤖 Generating research report (Tone: ${tone}, Focus: ${focus})...`);
    
    const response = await chat.call([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    res.json({
      success: true,
      reportMarkdown: response.content
    });

  } catch (err) {
    console.error('Error generating research report:', err);
    res.status(500).json({ error: "Failed to generate research report." });
  }
};
