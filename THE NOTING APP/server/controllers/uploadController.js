// server/controllers/uploadController.js
const fs = require('fs');
const PDFDocument = require('pdfkit');
const parsePDF = require('../utils/parsePDF');
const parseDOCX = require('../utils/parseDOCX');
const chunkText = require('../utils/chunker');
const chat = require('../utils/llm');
const path = require('path');
const marked = require('marked');

// Helper to render markdown to PDF using pdfkit
function renderMarkdownToPDF(doc, markdown) {
  const tokens = marked.lexer(markdown);
  tokens.forEach(token => {
    switch (token.type) {
      case 'heading':
        doc.moveDown(0.5);
        doc.fontSize(16 + (2 - token.depth)).font('Helvetica-Bold').text(token.text);
        doc.moveDown(0.5);
        break;
      case 'paragraph':
        doc.fontSize(12).font('Helvetica').text(token.text);
        doc.moveDown(0.5);
        break;
      case 'list':
        token.items.forEach(item => {
          doc.fontSize(12).text((token.ordered ? `${item.index + 1}. ` : '• ') + item.text, { indent: 20 });
        });
        doc.moveDown(0.5);
        break;
      case 'blockquote':
        doc.fontSize(12).fillColor('gray').text(token.text, { indent: 20 });
        doc.fillColor('black');
        doc.moveDown(0.5);
        break;
      case 'code':
        doc.fontSize(11).font('Courier').text(token.text, { indent: 20, oblique: true });
        doc.font('Helvetica');
        doc.moveDown(0.5);
        break;
      case 'space':
        doc.moveDown(0.5);
        break;
      default:
        break;
    }
  });
}

const uploadController = async (req, res) => {
  try {
    console.log('[DEBUG] Entered uploadController');
    if (!req.file) {
      console.log('[DEBUG] No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(filePath).toLowerCase();
    console.log('[DEBUG] Uploaded file path:', filePath, 'Extension:', ext);

    let textContent = '';
    if (ext === '.pdf') {
      console.log('[DEBUG] Parsing PDF');
      textContent = await parsePDF(filePath);
    } else if (ext === '.docx') {
      console.log('[DEBUG] Parsing DOCX');
      textContent = await parseDOCX(filePath);
    } else {
      console.log('[DEBUG] Unsupported file type:', ext);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Improved LLM prompt for summarization
    const llmPrompt = [
      { role: "system", content: "You are a helpful assistant. Summarize the following document for a student. The summary should be clear, concise, and cover the main points, key ideas, and important details. Use markdown headings (##, ###) for section titles and - for lists. Do NOT use the bullet character (•). Do NOT copy the text verbatim—write a summary in your own words. Use markdown formatting for headings, lists, and emphasis." },
      { role: "user", content: textContent.slice(0, 8000) }
    ];
    console.log('[DEBUG] Sending prompt to LLM');
    const llmResponse = await chat.call(llmPrompt);
    const summary = llmResponse.content || 'No summary available.';
    console.log('[DEBUG] LLM summary received');

    // Generate PDF with markdown rendering
    const notesFileName = `notes_${path.basename(filePath, ext)}.pdf`;
    const notesFilePath = path.join(__dirname, '../uploads', notesFileName);
    console.log('[DEBUG] Generating PDF at:', notesFilePath);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(notesFilePath);
    doc.pipe(writeStream);
    doc.fontSize(18).font('Helvetica-Bold').text('AI Summarized Notes', { underline: true });
    doc.moveDown();
    renderMarkdownToPDF(doc, summary);
    doc.end();

    writeStream.on('finish', () => {
      console.log('[DEBUG] PDF generation finished, sending response');
      res.json({ downloadUrl: `/uploads/${notesFileName}`, textContent });
    });
    writeStream.on('error', (err) => {
      console.error('[DEBUG] PDF write error:', err);
      res.status(500).json({ error: 'Failed to generate PDF' });
    });
  } catch (err) {
    console.error('[DEBUG] Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = uploadController;
