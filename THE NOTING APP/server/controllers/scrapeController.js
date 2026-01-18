// server/controllers/scrapeController.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { processContent } = require('../utils/processContent');
const parsePDF = require('../utils/parsePDF');
const parseDOCX = require('../utils/parseDOCX');

// Helper to extract file ID from Google Drive/Doc URL
function getDriveFileId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

const scrapeController = async (req, res) => {
    try {
        const { url } = req.body;
        console.log('[DEBUG] scrapeController hit with URL:', url);

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        let textContent = '';
        let filenameBase = 'scraped_content';

        const fileId = getDriveFileId(url);
        if (fileId) {
            console.log('[DEBUG] Detected Google Drive/Doc ID:', fileId);

            if (url.includes('docs.google.com/document')) {
                // Handle Google Doc -> Export as text
                console.log('[DEBUG] Processing as Google Doc');
                const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
                try {
                    const response = await axios.get(exportUrl);
                    textContent = response.data;
                    filenameBase = `gdoc_${fileId}`;
                } catch (err) {
                    console.error('[DEBUG] Failed to export Google Doc:', err.message);
                    return res.status(400).json({ error: 'Failed to access Google Doc. Ensure it is public (Anyone with the link).' });
                }
            } else {
                // Handle Google Drive File (likely PDF or DOCX) -> Download
                console.log('[DEBUG] Processing as Drive File');
                const exportUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

                try {
                    const response = await axios({
                        url: exportUrl,
                        method: 'GET',
                        responseType: 'arraybuffer' // Important for binary files
                    });

                    // Try to detect content-type
                    // Google Drive generic download often comes as application/octet-stream or pdf
                    // We can try to infer from response headers or just try to parse.
                    const contentType = response.headers['content-type'];

                    // Temporary file path
                    const tempDir = path.join(__dirname, '../uploads/temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    // Guess extension. If we don't know, default to PDF for binary, or try both.
                    // But let's look at Content-Disposition filename if available
                    let extension = '.pdf'; // valid default
                    const contentDisposition = response.headers['content-disposition'];
                    if (contentDisposition) {
                        const match = contentDisposition.match(/filename="?(.+?)"?$/);
                        if (match) {
                            const ext = path.extname(match[1]);
                            if (ext) extension = ext.toLowerCase();
                        }
                    }

                    const tempFilePath = path.join(tempDir, `drive_${fileId}${extension}`);
                    fs.writeFileSync(tempFilePath, response.data);
                    console.log('[DEBUG] Saved temp file:', tempFilePath);

                    // Parse based on extension
                    if (extension === '.pdf') {
                        textContent = await parsePDF(tempFilePath);
                    } else if (extension === '.docx' || extension === '.doc') {
                        textContent = await parseDOCX(tempFilePath);
                    } else if (extension === '.txt') {
                        textContent = response.data.toString('utf-8');
                    } else {
                        // Fallback: try parsing as PDF, if fails, error
                        try {
                            textContent = await parsePDF(tempFilePath);
                        } catch (e) {
                            return res.status(400).json({ error: 'Unsupported file type exported from Drive.' });
                        }
                    }

                    filenameBase = `drive_${fileId}`;

                    // Clean up temp file
                    // fs.unlinkSync(tempFilePath); 

                } catch (err) {
                    console.error('[DEBUG] Failed to download Drive file:', err.message);
                    return res.status(400).json({ error: 'Failed to access Drive file. Ensure it is public.' });
                }
            }
        } else {
            // Generic URL scraping? 
            // For now, return error as we focus on Drive links
            return res.status(400).json({ error: 'Only Google Drive links are currently supported.' });
        }

        if (!textContent || textContent.trim().length === 0) {
            return res.status(400).json({ error: 'No text content could be extracted.' });
        }

        // Process content (LLM + PDF)
        const result = await processContent(textContent, filenameBase);
        res.json(result);

    } catch (err) {
        console.error('[DEBUG] Scrape controller error:', err);
        res.status(500).json({ error: 'Server error during scraping processing' });
    }
};

module.exports = scrapeController;
