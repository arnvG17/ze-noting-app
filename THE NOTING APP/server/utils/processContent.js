const fs = require('fs');
const PDFDocument = require('pdfkit');
const chat = require('../utils/llm');
const path = require('path');
const marked = require('marked');

// GitHub-style markdown to PDF renderer with advanced formatting
function renderMarkdownToPDF(doc, markdown) {
    const tokens = marked.lexer(markdown);
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;
    const contentWidth = pageWidth - (margin * 2);

    // Helper to render text with inline markdown formatting (bold, italic, inline code, strikethrough, links)
    function renderInlineText(text, fontSize = 12, baseFont = 'Helvetica', options = {}) {
        if (!text) return;

        const parts = [];
        let currentPos = 0;

        // Enhanced regex to match **bold**, *italic*, `code`, ~~strikethrough~~, and [links](url)
        const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(~~(.+?)~~)|(\[(.+?)\]\((.+?)\))/g;
        let match;

        while ((match = inlineRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > currentPos) {
                parts.push({
                    text: text.substring(currentPos, match.index),
                    font: baseFont,
                    fontSize,
                    color: 'black'
                });
            }

            // Add the formatted match
            if (match[2]) { // Bold
                parts.push({ text: match[2], font: 'Helvetica-Bold', fontSize, color: 'black' });
            } else if (match[4]) { // Italic
                parts.push({ text: match[4], font: 'Helvetica-Oblique', fontSize, color: 'black' });
            } else if (match[6]) { // Inline code
                parts.push({ text: match[6], font: 'Courier', fontSize: fontSize - 1, color: '#c7254e', bg: '#f9f2f4' });
            } else if (match[8]) { // Strikethrough
                parts.push({ text: match[8], font: baseFont, fontSize, color: 'gray', strikethrough: true });
            } else if (match[10] && match[11]) { // Links
                parts.push({ text: `${match[10]} (${match[11]})`, font: baseFont, fontSize, color: '#0366d6', underline: true });
            }

            currentPos = match.index + match[0].length;
        }

        // Add remaining text
        if (currentPos < text.length) {
            parts.push({ text: text.substring(currentPos), font: baseFont, fontSize, color: 'black' });
        }

        // Render all parts
        if (parts.length === 0) {
            doc.fontSize(fontSize).font(baseFont).fillColor('black').text(text, options);
        } else {
            parts.forEach((part, index) => {
                // Handle inline code background
                if (part.bg) {
                    const textWidth = doc.widthOfString(part.text, { fontSize: part.fontSize });
                    const currentY = doc.y;
                    doc.rect(doc.x, currentY - 2, textWidth + 4, part.fontSize + 4)
                        .fillAndStroke(part.bg, part.bg);
                    doc.fillColor(part.color);
                } else {
                    doc.fillColor(part.color || 'black');
                }

                doc.fontSize(part.fontSize).font(part.font);

                const textOptions = {
                    continued: index < parts.length - 1,
                    underline: part.underline || false,
                    strike: part.strikethrough || false,
                    ...options
                };

                doc.text(part.text, textOptions);
            });
            doc.fillColor('black'); // Reset color
        }
    }

    tokens.forEach((token, tokenIndex) => {
        switch (token.type) {
            case 'heading':
                // GitHub-style headings with proper sizing and spacing
                const headingSizes = { 1: 24, 2: 20, 3: 16, 4: 14, 5: 12, 6: 11 };
                const headingSize = headingSizes[token.depth] || 12;

                doc.moveDown(token.depth === 1 ? 1 : 0.7);
                doc.fontSize(headingSize).font('Helvetica-Bold');
                renderInlineText(token.text, headingSize, 'Helvetica-Bold');

                // Add underline for h1 and h2 (GitHub style)
                if (token.depth <= 2) {
                    const textWidth = doc.widthOfString(token.text);
                    const lineY = doc.y + 3;
                    doc.moveTo(margin, lineY)
                        .lineTo(Math.min(margin + textWidth, pageWidth - margin), lineY)
                        .strokeColor('#eaecef')
                        .lineWidth(1)
                        .stroke();
                    doc.strokeColor('black');
                }

                doc.moveDown(0.5);
                break;

            case 'paragraph':
                doc.fontSize(12).font('Helvetica');
                renderInlineText(token.text, 12, 'Helvetica', { align: 'left', lineGap: 2 });
                doc.moveDown(0.7);
                break;

            case 'list':
                // Improved list rendering with proper indentation
                const listIndent = 20;
                token.items.forEach((item, itemIndex) => {
                    const prefix = token.ordered ? `${itemIndex + 1}. ` : '• ';
                    doc.fontSize(12).font('Helvetica').fillColor('black');

                    const prefixWidth = doc.widthOfString(prefix);
                    doc.text(prefix, { continued: true, indent: listIndent });

                    // Render list item with inline formatting
                    renderInlineText(item.text, 12, 'Helvetica');
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.4);
                break;

            case 'blockquote':
                // GitHub-style blockquote with left border
                const quoteIndent = 25;
                const quoteY = doc.y;

                doc.fontSize(12).font('Helvetica-Oblique');
                doc.fillColor('#6a737d');
                renderInlineText(token.text, 12, 'Helvetica-Oblique', {
                    indent: quoteIndent,
                    lineGap: 2
                });

                // Draw left border
                const quoteEndY = doc.y;
                doc.rect(margin + 10, quoteY, 3, quoteEndY - quoteY)
                    .fillAndStroke('#dfe2e5', '#dfe2e5');

                doc.fillColor('black');
                doc.moveDown(0.7);
                break;

            case 'code':
                // GitHub-style code block with background
                const codeIndent = 20;
                const codeY = doc.y;
                const codeWidth = contentWidth - codeIndent;

                doc.fontSize(10).font('Courier');

                // Measure code block height
                const lines = token.text.split('\n');
                const lineHeight = 12;
                const codeHeight = (lines.length * lineHeight) + 20;

                // Check if we need a new page
                if (codeY + codeHeight > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                }

                // Draw background
                doc.rect(margin + 10, doc.y - 5, codeWidth, codeHeight)
                    .fillAndStroke('#f6f8fa', '#e1e4e8');

                // Draw code text
                doc.fillColor('#24292e');
                doc.text(token.text, margin + 20, doc.y + 10, {
                    width: codeWidth - 20,
                    lineGap: 2,
                    preserveWhitespace: true
                });

                doc.fillColor('black').font('Helvetica');
                doc.moveDown(1);
                break;

            case 'hr':
                // Horizontal rule (GitHub style)
                doc.moveDown(0.5);
                doc.moveTo(margin, doc.y)
                    .lineTo(pageWidth - margin, doc.y)
                    .strokeColor('#e1e4e8')
                    .lineWidth(2)
                    .stroke();
                doc.strokeColor('black');
                doc.moveDown(0.5);
                break;

            case 'table':
                // Basic table support
                if (token.header && token.rows) {
                    const colWidths = token.header.map(() => contentWidth / token.header.length);
                    const cellPadding = 5;
                    const rowHeight = 25;

                    // Draw header
                    doc.fontSize(11).font('Helvetica-Bold');
                    let tableY = doc.y;

                    token.header.forEach((cell, i) => {
                        const x = margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        doc.rect(x, tableY, colWidths[i], rowHeight)
                            .fillAndStroke('#f6f8fa', '#e1e4e8');
                        doc.fillColor('black').text(cell.text, x + cellPadding, tableY + cellPadding, {
                            width: colWidths[i] - (cellPadding * 2),
                            height: rowHeight - (cellPadding * 2)
                        });
                    });

                    tableY += rowHeight;

                    // Draw rows
                    doc.font('Helvetica');
                    token.rows.forEach((row, rowIndex) => {
                        row.forEach((cell, i) => {
                            const x = margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                            doc.rect(x, tableY, colWidths[i], rowHeight)
                                .stroke('#e1e4e8');
                            doc.fillColor('black').text(cell.text, x + cellPadding, tableY + cellPadding, {
                                width: colWidths[i] - (cellPadding * 2),
                                height: rowHeight - (cellPadding * 2)
                            });
                        });
                        tableY += rowHeight;
                    });

                    doc.y = tableY;
                    doc.moveDown(1);
                }
                break;

            case 'space':
                doc.moveDown(0.3);
                break;

            default:
                break;
        }
    });
}

/**
 * Processes text content:
 * 1. Generates summary using LLM.
 * 2. Creates a PDF with the summary.
 * 3. Returns the download URL and text content.
 * 
 * @param {string} textContent - The text to process.
 * @param {string} filenameBase - The base name for the output file (without extension).
 * @returns {Promise<{ downloadUrl: string, textContent: string }>}
 */
async function processContent(textContent, filenameBase) {
    // GitHub README-quality prompt for markdown summary
    const llmPrompt = [
        { role: "system", content: "You are an expert technical writer that creates beautifully formatted markdown summaries with GitHub README-level quality.\n\n📋 **FORMATTING REQUIREMENTS:**\n\n**Structure:**\n1. Start with an ASCII flow chart (enclosed in triple backticks) showing the document's main structure/flow\n2. Use horizontal rules (---) to separate major sections\n3. Create clear hierarchical sections with ## and ### headings\n4. End with a comprehensive **## 🎯 Key Takeaways** section\n\n**Markdown Syntax:**\n- Use **bold** for ALL important terms, key concepts, definitions, and emphasis\n- Use *italics* for secondary emphasis or technical terms\n- Use `inline code` for technical terms, commands, or specific values\n- Use --- (horizontal rules) between major sections for visual separation\n- Use - for bullet lists (never use • or other bullet characters)\n- Use numbered lists (1., 2., 3.) for sequential steps or ranked items\n- Use > blockquotes for important notes or callouts\n\n**Content Guidelines:**\n- Write concise, clear summaries—do NOT copy text verbatim\n- Focus on main ideas, key concepts, and important details\n- Make it student-friendly and easy to understand\n- Use professional, engaging language\n\n**Example Structure:**\n```\n[ASCII Flow Chart Here]\n```\n\n---\n\n## 📖 Overview\n**Brief introduction with key terms in bold**\n\n---\n\n## 🔑 Main Topics\n\n### **Topic 1**\n- **Key point**: Explanation\n- **Important concept**: Details\n\n### **Topic 2**\n...\n\n---\n\n## 🎯 Key Takeaways\n1. **First main point**\n2. **Second main point**\n\nRemember: This will be rendered as a professional PDF. Make it look AMAZING!" },
        { role: "user", content: textContent.slice(0, 50000) }
    ];

    console.log('[DEBUG] Sending prompt to LLM');
    const llmResponse = await chat.call(llmPrompt);
    const summary = llmResponse.content || 'No summary available.';
    console.log('[DEBUG] LLM summary received');

    // Generate PDF with markdown rendering
    const notesFileName = `notes_${filenameBase}.pdf`;
    // Ensure the uploads directory exists (relative to where this script runs)
    // Assuming this is running from server/utils, we go up to server/uploads
    // But usually server is started from 'server' dir, so 'uploads' might be relative to CWD.
    // Best to use absolute path based on __dirname
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    const notesFilePath = path.join(uploadsDir, notesFileName);
    console.log('[DEBUG] Generating PDF at:', notesFilePath);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(notesFilePath);
        doc.pipe(writeStream);

        doc.fontSize(18).font('Helvetica-Bold').text('AI Summarized Notes', { underline: true });
        doc.moveDown();
        renderMarkdownToPDF(doc, summary);
        doc.end();

        writeStream.on('finish', () => {
            console.log('[DEBUG] PDF generation finished');
            resolve({ downloadUrl: `/uploads/${notesFileName}`, textContent });
        });

        writeStream.on('error', (err) => {
            console.error('[DEBUG] PDF write error:', err);
            reject(err);
        });
    });
}

module.exports = { processContent };
