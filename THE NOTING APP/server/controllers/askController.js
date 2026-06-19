// server/controllers/askController.js — RAG-powered chat with citations
const chat = require('../utils/llm3');
const { runRAG } = require('../services/ragPipeline');
const { buildCitationMetadata, citationInstruction } = require('../services/citationService');
const { query } = require('../db/pool');
require('dotenv').config();

/**
 * Handle a RAG-powered chat question
 * Uses: query rewriting → full-text search → fusion → LLM filtering → answer with citations
 */
exports.handleAsk = async (req, res) => {
    try {
        const { question, notebookId, selectedDocIds, text } = req.body;

        // Validate inputs
        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: "Question is required" });
        }

        // ====== LEGACY MODE: If 'text' is provided, use old behavior ======
        if (text && !notebookId) {
            return handleLegacyAsk(req, res);
        }

        // ====== RAG MODE: Use vectorless RAG pipeline ======
        if (!notebookId) {
            return res.status(400).json({ error: "notebookId is required for RAG mode" });
        }

        // Parse toggles from body or prompt prefix
        let isWebSearch = req.body.webSearch === true;
        let isThinkMode = req.body.thinkMode === true;
        let cleanQuestion = question.trim();

        // Robust regex matching for prefix fallbacks (supports newlines and whitespace)
        const searchMatch = cleanQuestion.match(/^\[Search:\s*(.*)\]$/is);
        const thinkMatch = cleanQuestion.match(/^\[Think:\s*(.*)\]$/is);

        if (searchMatch) {
            isWebSearch = true;
            cleanQuestion = searchMatch[1].trim();
        } else if (thinkMatch) {
            isThinkMode = true;
            cleanQuestion = thinkMatch[1].trim();
        }

        // Get document IDs to search
        let docIds = selectedDocIds;
        if (!docIds || docIds.length === 0) {
            // Default: search all documents in notebook
            const docsResult = await query(
                "SELECT id FROM documents WHERE notebook_id = $1 AND status = 'ready'",
                [notebookId]
            );
            docIds = docsResult.rows.map(r => r.id);
        }

        if (docIds.length === 0 && !isWebSearch) {
            return res.json({
                answer: "No documents are ready for searching yet. Please wait for document processing to complete.",
                citations: []
            });
        }

        // Run the full RAG pipeline
        const { context, chunks, queryVariations } = await runRAG(cleanQuestion, docIds, {
            webSearch: isWebSearch,
            thinkMode: isThinkMode
        });

        // Build citation metadata
        const citations = buildCitationMetadata(chunks);
        const citationInstr = citationInstruction(chunks);

        // Customize system prompt based on thinkMode
        let systemPrompt = `You are an expert AI assistant for a knowledge workspace. You answer questions based ONLY on the provided context.

📋 **FORMATTING GUIDELINES:**
- Use ## for main sections and ### for subsections
- Use **bold** for important terms and key concepts
- Use - for bullet lists and 1. for numbered lists
- Use > blockquotes for important notes
- Use inline code for technical terms

📌 **CITATION RULES:**
- Cite ALL claims using the requested format
- Every factual statement must have a citation
- If the context doesn't contain the answer, say "I couldn't find this in the documents or web search results."
${citationInstr}

Be clear, thorough, and well-organized.`;

        if (isThinkMode) {
            systemPrompt += `\n\n🧠 **THINKING INSTRUCTION:**\nBefore providing your final response, think step-by-step about the information. Analyze the relationships between the local documents and web results, resolve any conflicts, and outline your reasoning.`;
        }

        // Generate answer with LLM
        const response = await chat.call([
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: `Context:\n\n${context}\n\n---\n\nQuestion: ${cleanQuestion}\n\nProvide a comprehensive answer with citations.`
            }
        ], {
            temperature: isThinkMode ? 0.2 : 0.7 // slightly lower temperature for deliberate thinking
        });

        // Save messages to database
        try {
            await query(
                "INSERT INTO messages (notebook_id, role, content) VALUES ($1, 'user', $2)",
                [notebookId, cleanQuestion]
            );
            await query(
                "INSERT INTO messages (notebook_id, role, content, citations, chunks_used) VALUES ($1, 'assistant', $2, $3, $4)",
                [notebookId, response.content, JSON.stringify(citations), JSON.stringify(chunks.map(c => c.id))]
            );
        } catch (dbErr) {
            console.warn('⚠️ Failed to save chat messages:', dbErr.message);
        }

        res.json({
            answer: response.content,
            citations,
            queryVariations,
            chunksUsed: chunks.length
        });

    } catch (err) {
        console.error("Ask error:", err);
        res.status(500).json({ error: "Failed to generate answer" });
    }
};

/**
 * Legacy mode: send full text directly to LLM (backward compatible)
 */
async function handleLegacyAsk(req, res) {
    try {
        const { text, question } = req.body;
        const context = text;

        const response = await chat.call([
            {
                role: "system",
                content: `You are an expert teaching assistant. Provide beautifully formatted, clear explanations using markdown.

**Formatting:** Use ## headings, **bold**, *italics*, bullet lists, > blockquotes, and inline code where appropriate.`
            },
            {
                role: "user",
                content: `Context:\n\n${context}\n\nQuestion: ${question}\n\nProvide a comprehensive, well-structured answer.`
            }
        ]);

        res.json({ answer: response.content });
    } catch (err) {
        console.error("Legacy ask error:", err);
        res.status(500).json({ error: "Failed to generate answer" });
    }
}

/**
 * Quiz generation using RAG pipeline
 */
exports.handleQuizGeneration = async (req, res) => {
    try {
        const { text, notebookId, selectedDocIds } = req.body;

        let contentForQuiz = text;

        // If notebookId provided, use RAG to get relevant content
        if (notebookId && !text) {
            let docIds = selectedDocIds;
            if (!docIds || docIds.length === 0) {
                const docsResult = await query(
                    "SELECT id FROM documents WHERE notebook_id = $1 AND status = 'ready'",
                    [notebookId]
                );
                docIds = docsResult.rows.map(r => r.id);
            }

            // Get chunks directly for quiz generation
            const chunksResult = await query(
                `SELECT content FROM chunks 
                 WHERE document_id = ANY($1::uuid[])
                 ORDER BY chunk_index
                 LIMIT 15`,
                [docIds]
            );
            contentForQuiz = chunksResult.rows.map(r => r.content).join('\n\n');
        }

        if (!contentForQuiz) {
            return res.status(400).json({ error: "No content available for quiz generation" });
        }

        const quizPrompt = `Based on the following text, generate a quiz of 10 high-quality multiple-choice questions.

**Requirements:**
- Test understanding of key concepts, not just memorization
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- All options should be plausible

**Output Format:**
Return ONLY a valid JSON array:
[
  {
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A) ..."
  }
]

**Text:**
${contentForQuiz.slice(0, 6000)}

Generate the quiz now:`;

        const response = await chat.call([
            {
                role: "system",
                content: "You are an expert educational assessment designer. Always respond with valid JSON arrays only."
            },
            { role: "user", content: quizPrompt }
        ]);

        res.json({ answer: response.content });

    } catch (err) {
        console.error("Quiz generation error:", err);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
};

/**
 * Get chat history for a notebook
 */
exports.getChatHistory = async (req, res) => {
    try {
        const { notebookId } = req.params;
        const result = await query(
            "SELECT id, role, content, citations, created_at FROM messages WHERE notebook_id = $1 ORDER BY created_at ASC",
            [notebookId]
        );
        res.json({ messages: result.rows });
    } catch (err) {
        console.error("Chat history error:", err);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};
