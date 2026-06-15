const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Database
const { testConnection } = require('./db/pool');

// Routes
const askRoutes = require('./routes/ask');
const uploadRoutes = require('./routes/upload');
const scrapeRoutes = require('./routes/scrape');
const notebookRoutes = require('./routes/notebooks');
const documentRoutes = require('./routes/documents');
const pitchRoutes = require('./routes/pitch');
const flowchartRoutes = require('./routes/flowchart');
const reportRoutes = require('./routes/report');
const podcastRoutes = require('./routes/podcast');

const app = express();

// ✅ Enable CORS
app.use(cors());

// ✅ Increase request body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/pitch', pitchRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/generate-flowchart', flowchartRoutes);
app.use('/generate-flowchart', flowchartRoutes);

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    
    // Test database connection on startup
    if (process.env.DATABASE_URL) {
        const connected = await testConnection();
        if (connected) {
            console.log('✅ Database connected successfully');
        } else {
            console.warn('⚠️ Database connection failed — RAG features will not work');
            console.warn('   Run: node db/migrate.js to set up the database');
        }
    } else {
        console.warn('⚠️ DATABASE_URL not set — running in legacy mode (no RAG)');
    }
    
    console.log('');
});
