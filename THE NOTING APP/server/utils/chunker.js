// server/utils/chunker.js — Word-based text chunking with overlap
// Upgraded from character-based to word-based chunking for better RAG retrieval

/**
 * Split text into chunks of 300-500 words with overlap.
 * Tries to break at sentence boundaries for cleaner chunks.
 * 
 * @param {string} rawText - The raw text to chunk
 * @param {object} options - Chunking options
 * @param {number} options.targetWords - Target words per chunk (default 400)
 * @param {number} options.maxWords - Max words per chunk (default 500)
 * @param {number} options.overlapWords - Overlap between chunks (default 50)
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number|null, wordCount: number}>}
 */
function chunkText(rawText, options = {}) {
    const {
        targetWords = 400,
        maxWords = 500,
        overlapWords = 50
    } = options;

    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Invalid text input: must be a non-empty string');
    }

    const text = rawText.trim();
    if (!text) return [];

    // Split into sentences (handles common abbreviations)
    const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
    
    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;
    let overlapBuffer = []; // Sentences to carry forward as overlap

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        const sentenceWords = sentence.split(/\s+/).length;

        // If adding this sentence would exceed max, finalize current chunk
        if (currentWordCount + sentenceWords > maxWords && currentChunk.length > 0) {
            const chunkContent = currentChunk.join(' ').trim();
            const wordCount = chunkContent.split(/\s+/).length;
            
            chunks.push({
                content: chunkContent,
                chunkIndex,
                pageNumber: estimatePageNumber(rawText, chunkContent),
                wordCount
            });
            chunkIndex++;

            // Build overlap: take last N words worth of sentences
            overlapBuffer = [];
            let overlapCount = 0;
            for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapWords; j--) {
                overlapBuffer.unshift(currentChunk[j]);
                overlapCount += currentChunk[j].split(/\s+/).length;
            }

            currentChunk = [...overlapBuffer];
            currentWordCount = overlapCount;
        }

        currentChunk.push(sentence);
        currentWordCount += sentenceWords;

        // If we've hit the target and have a good break point, finalize
        if (currentWordCount >= targetWords && i < sentences.length - 1) {
            const nextSentenceWords = (sentences[i + 1] || '').split(/\s+/).length;
            
            // Only break if adding the next sentence would push us over max
            if (currentWordCount + nextSentenceWords > maxWords) {
                const chunkContent = currentChunk.join(' ').trim();
                const wordCount = chunkContent.split(/\s+/).length;
                
                chunks.push({
                    content: chunkContent,
                    chunkIndex,
                    pageNumber: estimatePageNumber(rawText, chunkContent),
                    wordCount
                });
                chunkIndex++;

                // Build overlap
                overlapBuffer = [];
                let overlapCount = 0;
                for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapWords; j--) {
                    overlapBuffer.unshift(currentChunk[j]);
                    overlapCount += currentChunk[j].split(/\s+/).length;
                }

                currentChunk = [...overlapBuffer];
                currentWordCount = overlapCount;
            }
        }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
        const chunkContent = currentChunk.join(' ').trim();
        const wordCount = chunkContent.split(/\s+/).length;
        
        if (wordCount > 20) { // Only add if substantial
            chunks.push({
                content: chunkContent,
                chunkIndex,
                pageNumber: estimatePageNumber(rawText, chunkContent),
                wordCount
            });
        } else if (chunks.length > 0) {
            // Merge tiny last chunk into previous
            const lastChunk = chunks[chunks.length - 1];
            lastChunk.content += ' ' + chunkContent;
            lastChunk.wordCount += wordCount;
        }
    }

    return chunks;
}

/**
 * Estimate page number based on position in original text.
 * Assumes ~500 words per page. Returns null if can't determine.
 */
function estimatePageNumber(fullText, chunkContent) {
    const firstLine = chunkContent.substring(0, 100);
    const position = fullText.indexOf(firstLine);
    if (position === -1) return null;
    
    const textBefore = fullText.substring(0, position);
    const wordsBefore = textBefore.split(/\s+/).length;
    
    // ~500 words per page
    return Math.ceil(wordsBefore / 500) || 1;
}

module.exports = chunkText;
