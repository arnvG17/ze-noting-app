// server/utils/generateFlowchart.js
const chat = require('./groqLLM');

/**
 * Generate a Markdown-based mind map structure from document text.
 * Uses LLM to analyze document structure and create a hierarchical Markdown tree.
 * 
 * @param {string} textContent - The parsed document text
 * @returns {Promise<string>} - Markdown string for Markmap
 */
async function generateFlowchart(textContent) {
    const systemPrompt = `You are an expert at analyzing documents and creating visual Mind Maps (hierarchical structures) that represent the ACTUAL content and structure.

**CRITICAL:** DO NOT use generic placeholders. Extract REAL topics and concepts from the document.

Your task:
1. READ the document and identify its SPECIFIC main topic (this will be the root # heading)
2. Find the ACTUAL sections, steps, or themes mentioned (these will be ## headings)
3. Extract REAL key points and sub-concepts (these will be bullet points - or --)
4. Create a CLEAR hierarchy that shows how concepts are related.

**OUTPUT FORMAT:**
Respond with ONLY valid Markdown (no JSON, no explanation, no code blocks).
The Markdown must use standard heading and list syntax:
# Main Topic
## Section 1
- Key Point 1.1
- Key Point 1.2
  - Sub-detail 1.2.1
## Section 2
- Key Point 2.1
- Key Point 2.2

**RULES:**
- Root (#): Document's main topic
- Level 1 (##): Main sections / categories
- Level 2 (-): Sub-points / details
- Level 3 (  -): Further refinements
- Labels: Max 50 chars, use ACTUAL content from document
- Aim for a balanced tree with 4-8 main sections and 2-4 sub-points each.

**EXAMPLES:**
❌ WRONG:
# Document Overview
## Content Analysis
- Key Points

✅ RIGHT:
# Python Gmail-Sheets Automation
## Gmail API Setup
- Create Project in Google Console
- Enable Gmail API
- Download credentials.json
## OAuth Authentication
- Install google-auth-library
- Implement Token Refresh logic
## Sheet Logging
- Connect to Google Sheets API
- Append row with Timestamp and Subject

Extract the REAL structure from the document below. Use SPECIFIC terms from the text.`;

    const llmPrompt = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this document and create a Mind Map hierarchy in Markdown:\n\n${textContent}` }
    ];

    try {
        console.log('[DEBUG] Generating Mind Map Markdown from document...');
        const response = await chat.call(llmPrompt);
        let content = response.content || '';

        // Clean up the response - remove any markdown code blocks if present
        content = content.trim();
        if (content.startsWith('```markdown')) {
            content = content.slice(11);
        } else if (content.startsWith('```')) {
            content = content.slice(3);
        }
        if (content.endsWith('```')) {
            content = content.slice(0, -3);
        }
        content = content.trim();

        // If for some reason requested JSON (fallback safety)
        if (content.startsWith('{')) {
             try {
                 const data = JSON.parse(content);
                 // Convert basic JSON to Markdown if possible, or just use a default
                 content = `# ${data.nodes?.[0]?.data?.label || 'Document Summary'}\n`;
                 data.nodes?.slice(1).forEach(node => {
                     content += `## ${node.data?.label}\n`;
                 });
             } catch (e) {
                 content = "# Document Summary\n## Content Analysis\n- Unable to parse structure correctly";
             }
        }

        console.log(`[DEBUG] Mind Map Markdown generated: ${content.length} characters`);
        
        // We return an object with mindmapMarkdown to keep compatibility if some parts expect an object,
        // but we'll also include a flag to tell the frontend it's new format.
        return {
            isMindmap: true,
            markdown: content
        };

    } catch (error) {
        console.error('[DEBUG] Mind Map generation error:', error.message);

        // Return a fallback Markdown structure
        return {
            isMindmap: true,
            markdown: "# Document Overview\n## Content Analysis\n- Unable to generate visual structure\n- Please check the summary for details"
        };
    }
}

module.exports = { generateFlowchart };

