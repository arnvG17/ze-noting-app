const fs = require('fs');
const path = require('path');

/**
 * Parse PDF using pdfjs-dist (modern Mozilla pdf.js).
 * This library handles more PDF formats than the legacy pdf-parse package.
 */
module.exports = async function parsePDF(filePath) {
  // Dynamically import pdfjs-dist (ESM module)
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Read the PDF file
  const buffer = fs.readFileSync(filePath);
  const data = new Uint8Array(buffer);

  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      // Disable external CMaps and standard fonts to avoid network requests
      standardFontDataUrl: undefined,
      cMapUrl: undefined
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatenate text items with proper spacing
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    // If pdfjs-dist fails, try with pdf-parse as fallback
    console.warn('[DEBUG] pdfjs-dist failed, trying pdf-parse fallback:', error.message);

    try {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (fallbackError) {
      // If both fail, throw a more descriptive error
      throw new Error(
        `Unable to parse PDF. Primary error: ${error.message}. ` +
        `Fallback error: ${fallbackError.message}. ` +
        `The PDF file may be corrupted, password-protected, or use an unsupported format.`
      );
    }
  }
};
