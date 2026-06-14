// server/routes/notebooks.js — Notebook CRUD routes
const express = require('express');
const router = express.Router();
const { createNotebook, getNotebook } = require('../services/ingestionService');
const { query } = require('../db/pool');

// Create a new notebook
router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        const notebook = await createNotebook(title || 'Untitled Notebook');
        res.json(notebook);
    } catch (err) {
        console.error('Create notebook error:', err);
        res.status(500).json({ error: 'Failed to create notebook' });
    }
});

// Get notebook with documents
router.get('/:id', async (req, res) => {
    try {
        const notebook = await getNotebook(req.params.id);
        if (!notebook) {
            return res.status(404).json({ error: 'Notebook not found' });
        }
        res.json(notebook);
    } catch (err) {
        console.error('Get notebook error:', err);
        res.status(500).json({ error: 'Failed to get notebook' });
    }
});

// Update notebook title
router.put('/:id', async (req, res) => {
    try {
        const { title } = req.body;
        const result = await query(
            'UPDATE notebooks SET title = $1 WHERE id = $2 RETURNING *',
            [title, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notebook not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update notebook error:', err);
        res.status(500).json({ error: 'Failed to update notebook' });
    }
});

// Delete notebook (cascades to documents, chunks, messages)
router.delete('/:id', async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM notebooks WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notebook not found' });
        }
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        console.error('Delete notebook error:', err);
        res.status(500).json({ error: 'Failed to delete notebook' });
    }
});

// List all notebooks
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT n.*, 
                    COUNT(d.id) as document_count
             FROM notebooks n
             LEFT JOIN documents d ON d.notebook_id = n.id
             GROUP BY n.id
             ORDER BY n.updated_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('List notebooks error:', err);
        res.status(500).json({ error: 'Failed to list notebooks' });
    }
});

module.exports = router;
