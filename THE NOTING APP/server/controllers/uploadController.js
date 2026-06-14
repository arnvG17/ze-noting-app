// server/controllers/uploadController.js — Document upload with ingestion pipeline
const fs = require('fs');
const path = require('path');
const parsePDF = require('../utils/parsePDF');
const parseDOCX = require('../utils/parseDOCX');
const { ingestDocument } = require('../services/ingestionService');
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
        const originalName = req.file.originalname || path.basename(filePath);
        const notebookId = req.body.notebookId || null;

        console.log('[DEBUG] Uploaded file:', originalName, 'Extension:', ext);

        // 1. Extract text
        let textContent = '';
        if (ext === '.pdf') {
            try {
                textContent = await parsePDF(filePath);
            } catch (pdfError) {
                console.error('[DEBUG] PDF parsing error:', pdfError);
                return res.status(400).json({
                    error: 'Unable to parse PDF file',
                    details: 'The PDF may be corrupted or password-protected.'
                });
            }
        } else if (ext === '.docx' || ext === '.doc') {
            textContent = await parseDOCX(filePath);
        } else if (ext === '.txt') {
            textContent = fs.readFileSync(filePath, 'utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        if (!textContent || textContent.trim().length < 50) {
            return res.status(400).json({ error: 'Could not extract meaningful text from file' });
        }

        // 2. Run ingestion pipeline (chunk → store in PostgreSQL → generate summary)
        console.log('[DEBUG] Starting ingestion pipeline...');
        const ingestionResult = await ingestDocument(textContent, originalName, {
            notebookId,
            fileType: ext.replace('.', ''),
            fileSize: req.file.size,
            notebookTitle: originalName.replace(/\.[^/.]+$/, '')
        });

        // 3. Generate flowchart data (non-blocking — don't fail if this fails)
        let flowchartData = null;
        try {
            console.log('[DEBUG] Generating flowchart...');
            flowchartData = await generateFlowchart(textContent);
        } catch (fcErr) {
            console.warn('[DEBUG] Flowchart generation failed (non-critical):', fcErr.message);
        }

        // 4. Clean up uploaded file
        try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }

        // 5. Return result
        console.log('[DEBUG] Upload complete:', ingestionResult);
        res.json({
            notebookId: ingestionResult.notebookId,
            documentId: ingestionResult.documentId,
            status: ingestionResult.status,
            chunkCount: ingestionResult.chunkCount,
            wordCount: ingestionResult.wordCount,
            summary: ingestionResult.summary,
            flowchartData,
            // Legacy compatibility
            textContent,
            downloadUrl: null // No longer generating PDF downloads
        });

    } catch (err) {
        console.error('[DEBUG] Upload error:', err);
        res.status(500).json({ error: 'Server error during upload', details: err.message });
    }
};

module.exports = uploadController;
