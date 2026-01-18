const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const askRoutes = require('./routes/ask');
const uploadRoutes = require('./routes/upload');
const scrapeRoutes = require('./routes/scrape');

const app = express();

// ✅ Enable CORS
app.use(cors());

// ✅ Increase request body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/scrape', scrapeRoutes);

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
