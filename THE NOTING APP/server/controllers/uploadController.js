// server/controllers/uploadController.js
const fs = require('fs');
const parsePDF = require('../utils/parsePDF');
const parseDOCX = require('../utils/parseDOCX');
const path = require('path');
const { processContent } = require('../utils/processContent');
const { generateFlowchart } = require('../utils/generateFlowchart');

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
      try {
        textContent = await parsePDF(filePath);
      } catch (pdfError) {
        console.error('[DEBUG] PDF parsing error:', pdfError);
        return res.status(400).json({
          error: 'Unable to parse PDF file',
          details: 'The PDF file may be corrupted, password-protected, or use an unsupported format. Please try re-saving the PDF or converting it to a different format.'
        });
      }
    } else if (ext === '.docx' || ext === '.doc') {
      console.log('[DEBUG] Parsing DOCX');
      textContent = await parseDOCX(filePath);
    } else if (ext === '.txt') { // Added basic TXT support since the frontend checks for it
      textContent = fs.readFileSync(filePath, 'utf-8');
    } else {
      console.log('[DEBUG] Unsupported file type:', ext);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Process content using shared utility (generates summary PDF)
    const result = await processContent(textContent, path.basename(filePath, ext));

    // Generate flowchart data for ReactFlow visualization
    console.log('[DEBUG] Generating flowchart...');
    const flowchartData = await generateFlowchart(textContent);

    // Clean up uploaded file? Maybe keep it for reference or delete it.
    // For now, we keep it as per original behavior.

    res.json({
      ...result,
      flowchartData
    });

  } catch (err) {
    console.error('[DEBUG] Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = uploadController;

