// vectorstores/inMemory.js
const { embedTexts } = require('../utils/geminiEmbeddings');

class GeminiEmbeddings {
  // LangChain expects an embedDocuments method
  async embedDocuments(texts) {
    console.log('DEBUG: Embedding documents:', texts.length);
    const result = await embedTexts(texts);
    console.log('DEBUG: Documents embedded');
    return result;
  }
  async embedQuery(text) {
    console.log('DEBUG: Embedding query');
    const result = await embedTexts([text]);
    console.log('DEBUG: Query embedded');
    return result[0];
  }
}

const { MemoryVectorStore } = require('langchain/vectorstores/memory');

const createVectorStore = async (documents) => {
  console.log('DEBUG: Creating vector store with documents:', documents.length);
  const embeddings = new GeminiEmbeddings();
  const store = await MemoryVectorStore.fromDocuments(documents, embeddings);
  console.log('DEBUG: MemoryVectorStore created');
  return store;
};

module.exports = createVectorStore;
