// server/controllers/scrapeController.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { processContent } = require('../utils/processContent');
const { generateFlowchart } = require('../utils/generateFlowchart');
const parsePDF = require('../utils/parsePDF');
const parseDOCX = require('../utils/parseDOCX');

// Helper to extract file ID from Google Drive/Doc URL
function getDriveFileId(url) {
    // Matches /d/ID or id=ID or folders/ID
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}

// Helper to download/export a single file by ID
async function fetchFileContent(fileId) {
    let textContent = '';

    // 1. Try content as Google Doc (export=txt)
    try {
        const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
        const response = await axios.get(exportUrl, { timeout: 5000 });
        if (response.status === 200 && typeof response.data === 'string') {
            console.log(`[DEBUG] Processed ${fileId} as Google Doc`);
            return { text: response.data, type: 'doc' };
        }
    } catch (ignore) {
        // Not a Google Doc or not accessible
    }

    // 2. Try content as Drive File (export=download)
    try {
        const exportUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        const response = await axios({
            url: exportUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000
        });

        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Guess extension
        let extension = '.pdf';
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

        try {
            if (extension === '.pdf') {
                textContent = await parsePDF(tempFilePath);
            } else if (extension === '.docx' || extension === '.doc') {
                textContent = await parseDOCX(tempFilePath);
            } else if (extension === '.txt') {
                textContent = response.data.toString('utf-8');
            } else {
                // Try PDF fallback
                textContent = await parsePDF(tempFilePath);
            }
            console.log(`[DEBUG] Processed ${fileId} as Drive File (${extension})`);
            return { text: textContent, type: 'file' };
        } catch (e) {
            console.log(`[DEBUG] Failed to parse ${fileId}: ${e.message}`);
        }
    } catch (ignore) {
        // Not a Drive File or not accessible
    }

    return null;
}

const scrapeController = async (req, res) => {
    try {
        const { url } = req.body;
        console.log('[DEBUG] scrapeController hit with URL:', url);

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        let combinedTextContent = '';
        let mainFilenameBase = 'scraped_content';

        if (url.includes('/folders/')) {
            console.log('[DEBUG] Processing as Google Drive Folder');
            const folderId = getDriveFileId(url);
            if (!folderId) {
                return res.status(400).json({ error: 'Invalid Folder URL' });
            }
            mainFilenameBase = `folder_${folderId}`;

            // Launch Puppeteer with serverless Chromium
            let browser;
            try {
                browser = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                });
            } catch (pLaunchError) {
                console.error('[DEBUG] Puppeteer launch failed:', pLaunchError);
                return res.status(500).json({
                    error: 'Failed to initialize scraper browser.',
                    details: pLaunchError.message
                });
            }
            const page = await browser.newPage();

            try {
                console.log('[DEBUG] Puppeteer navigating to folder...');
                await page.goto(url, { waitUntil: 'load', timeout: 60000 });

                // Wait a bit for JS to render list
                await new Promise(r => setTimeout(r, 3000));

                // Scrape all links that look like file/doc links
                const foundIds = await page.evaluate(() => {
                    const ids = new Set();
                    // Strategy 1: Look for any data-id attribute which looks like a drive ID
                    const elements = document.querySelectorAll('[data-id]');
                    elements.forEach(el => {
                        const id = el.getAttribute('data-id');
                        if (id && id.match(/[-\w]{25,}/)) {
                            ids.add(id);
                        }
                    });

                    // Strategy 2: Look for hrefs
                    const links = document.querySelectorAll('a[href]');
                    links.forEach(a => {
                        const href = a.href;
                        const match = href.match(/\/d\/([-\w]{25,})/);
                        if (match) ids.add(match[1]);
                    });

                    return Array.from(ids);
                });

                console.log(`[DEBUG] Found ${foundIds.length} potential files/folders in view.`);

                // Filter out the folder's own ID if caught
                const fileIds = foundIds.filter(id => id !== folderId);

                // Limit to say 10 files to prevent timeouts
                const filesToProcess = fileIds.slice(0, 10);

                for (const fid of filesToProcess) {
                    console.log(`[DEBUG] Processing file ID inside folder: ${fid}`);
                    const result = await fetchFileContent(fid);
                    if (result && result.text && result.text.length > 50) {
                        combinedTextContent += `\n\n--- Start of File (${fid}) ---\n\n`;
                        combinedTextContent += result.text;
                        combinedTextContent += `\n\n--- End of File (${fid}) ---\n\n`;
                    }
                }

            } catch (pError) {
                console.error('[DEBUG] Puppeteer error:', pError);
                return res.status(500).json({
                    error: 'Failed to scrape folder structure.',
                    details: pError.message
                });
            } finally {
                await browser.close();
            }

        } else {
            // Single file logic
            const fileId = getDriveFileId(url);
            if (fileId) {
                console.log('[DEBUG] Processing as Single File/Doc');
                mainFilenameBase = `drive_${fileId}`;
                const result = await fetchFileContent(fileId);
                if (result && result.text) {
                    combinedTextContent = result.text;
                }
            } else {
                return res.status(400).json({ error: 'Invalid Google Drive link.' });
            }
        }

        if (!combinedTextContent || combinedTextContent.trim().length === 0) {
            return res.status(400).json({
                error: 'No text content could be extracted.',
                details: 'The folder might be empty, contain unsupported files, or files might not be public.'
            });
        }

        // Process final content (generates summary PDF)
        const result = await processContent(combinedTextContent, mainFilenameBase);

        // Generate flowchart data for ReactFlow visualization
        console.log('[DEBUG] Generating flowchart for scraped content...');
        const flowchartData = await generateFlowchart(combinedTextContent);

        res.json({
            ...result,
            flowchartData
        });

    } catch (err) {
        console.error('[DEBUG] Scrape controller error:', err);
        res.status(500).json({
            error: 'Server error during scraping processing',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

module.exports = scrapeController;

