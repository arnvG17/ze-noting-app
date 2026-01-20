const { processContent } = require('./utils/processContent');
const path = require('path');
const fs = require('fs');

// Mock environment variable if missing
if (!process.env.GEMINI_API_KEY) {
    console.log('[TEST] Setting dummy GEMINI_API_KEY');
    process.env.GEMINI_API_KEY = 'dummy-key';
}

async function runTest() {
    try {
        console.log('[TEST] Starting processContent test...');
        const dummyText = "# Test Document\n\nThis is a test.";
        const filenameBase = "test_repro";

        const result = await processContent(dummyText, filenameBase);
        console.log('[TEST] Success:', result);
    } catch (error) {
        console.error('[TEST] FAILED:', error);
    }
}

runTest();
