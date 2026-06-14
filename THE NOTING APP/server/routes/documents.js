// server/routes/documents.js — Document management routes
const express = require('express');
const router = express.Router();
const { getDocuments, getDocumentStatus, deleteDocument } = require('../services/ingestionService');
const { query } = require('../db/pool');

// List documents for a notebook
router.get('/notebook/:notebookId', async (req, res) => {
    try {
        const documents = await getDocuments(req.params.notebookId);
        res.json(documents);
    } catch (err) {
        console.error('List documents error:', err);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

// Get document status
router.get('/:id/status', async (req, res) => {
    try {
        const status = await getDocumentStatus(req.params.id);
        if (!status) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(status);
    } catch (err) {
        console.error('Document status error:', err);
        res.status(500).json({ error: 'Failed to get document status' });
    }
});

// Get full document details
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM documents WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get document error:', err);
        res.status(500).json({ error: 'Failed to get document' });
    }
});

// Delete document (cascades to chunks)
router.delete('/:id', async (req, res) => {
    try {
        await deleteDocument(req.params.id);
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        console.error('Delete document error:', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

module.exports = router;
