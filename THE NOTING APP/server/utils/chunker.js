// server/utils/chunker.js
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

async function chunkText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid text input: must be a non-empty string');
  }
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([rawText]);
  return docs; // Array of { pageContent: ..., metadata: {} }
}

module.exports = chunkText;
