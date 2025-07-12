require('dotenv').config();
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { OpenAIEmbeddings } = require('@langchain/openai');

(async () => {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const documents = [
    { pageContent: "This is a test chunk.", metadata: {} },
    { pageContent: "This is another test chunk.", metadata: {} }
  ];

  try {
    const store = await MemoryVectorStore.fromDocuments(documents, embeddings);
    console.log('Vector store created successfully!');
  } catch (err) {
    console.error('Error creating vector store:', err);
  }
})(); 