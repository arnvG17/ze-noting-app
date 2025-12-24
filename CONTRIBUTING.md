# Contributing Guide & Architecture Documentation

## High-Level Overview

The **Noting App** is a backend-heavy application designed to ingest documents (PDF/DOCX), summarize them, and allow users to interact with the content through Q&A and Quizzes.

The system uses a dual-LLM architecture:
1.  **Google Gemini 2.0 Flash**: Latest model with 1M token context window, responsible for initial document summarization and notes generation upon upload.
2.  **Together AI (Llama 3.3 70B Instruct)**: High-performance model with 128K context window, responsible for interactive Q&A and generating quizzes from the document content.

Currently, the system is **stateless regarding vector storage**. It does not persist embeddings in a vector database. Instead, the raw text content of the document is returned to the frontend after upload and passed back to the server for every Q&A or Quiz request.

---

## Detailed Implementation Flows

### 1. Document Upload & Auto-Summarization

**Route Definition**: [`server/routes/upload.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/routes/upload.js)

```js
// POST /api/upload
router.post('/', upload.single('file'), handleUpload);
```

**Controller**: [`server/controllers/uploadController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/uploadController.js)

#### Step 1: Document Ingestion

The `uploadController` function receives the uploaded file via `multer`:

```js
const uploadController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const ext = path.extname(filePath).toLowerCase();

  let textContent = '';
  if (ext === '.pdf') {
    textContent = await parsePDF(filePath);
  } else if (ext === '.docx') {
    textContent = await parseDOCX(filePath);
  }
  // ...
}
```

**Document Parsers**:
- PDF: [`server/utils/parsePDF.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/parsePDF.js) - Uses `pdf-parse`
- DOCX: [`server/utils/parseDOCX.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/parseDOCX.js) - Uses `mammoth`

#### Step 2: LLM Summarization (Gemini)

**LLM Module**: [`server/utils/llm.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/llm.js)

```js
// In uploadController.js (lines 75-82)
const llmPrompt = [
  { 
    role: "system", 
    content: "You are a helpful assistant. Summarize the following document for a student. The summary should be clear, concise, and cover the main points, key ideas, and important details. Use markdown headings (##, ###) for section titles and - for lists. Do NOT use the bullet character (•). Do NOT copy the text verbatim—write a summary in your own words. Use markdown formatting for headings, lists, and emphasis." 
  },
  { role: "user", content: textContent.slice(0, 50000) }
];

const llmResponse = await chat.call(llmPrompt);
const summary = llmResponse.content || 'No summary available.';
```

**Gemini API Call** (`utils/llm.js`):

```js
async function geminiChat(messages) {
  const prompt = messages.map(msg => msg.content).join('\n');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      })
    }
  );
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content };
}

module.exports = { call: geminiChat };
```

#### Step 3: PDF Generation

The markdown summary is rendered to PDF using `pdfkit`:

```js
// uploadController.js (lines 85-103)
const notesFileName = `notes_${path.basename(filePath, ext)}.pdf`;
const notesFilePath = path.join(__dirname, '../uploads', notesFileName);
const doc = new PDFDocument();
const writeStream = fs.createWriteStream(notesFilePath);

doc.pipe(writeStream);
doc.fontSize(18).font('Helvetica-Bold').text('AI Summarized Notes', { underline: true });
doc.moveDown();
renderMarkdownToPDF(doc, summary);
doc.end();

writeStream.on('finish', () => {
  res.json({ downloadUrl: `/uploads/${notesFileName}`, textContent });
});
```

The helper function `renderMarkdownToPDF` (lines 12-48) parses markdown tokens and styles them accordingly.

---

### 2. Question & Answer (Q&A)

**Route Definition**: [`server/routes/ask.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/routes/ask.js)

```js
// POST /api/ask
router.post('/', handleAsk);
```

**Controller**: [`server/controllers/askController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/askController.js#L7-L34)

```js
exports.handleAsk = async (req, res) => {
  try {
    const { text, question } = req.body;

    // Validate inputs
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text is required and must be a string" });
    }
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: "Question is required and must be a string" });
    }

    // Use the full text as context (no chunking or embedding)
    const context = text;

    const response = await chat.call([
      { 
        role: "system", 
        content: "You are a helpful assistant. When providing code, always format it as a markdown code block with the correct language (e.g., ```js for JavaScript, ```python for Python, etc). Use clear explanations and include code examples in markdown format. Use markdown for all output." 
      },
      { 
        role: "user", 
        content: `Context:\n\n${context}\n\nQuestion: ${question}\n\nPlease provide a detailed, well-explained answer, including examples and extra insights if possible. Format all code as markdown code blocks with the correct language.` 
      }
    ]);

    res.json({ answer: response.content });

  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
};
```

**LLM Module (Together AI)**: [`server/utils/llm3.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/llm3.js#L27-L96)

```js
async chat(messages, options = {}) {
  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  const config = { ...this.defaultConfig, ...options };

  try {
    const response = await this.client.chat.completions.create({
      messages,
      ...config
    });

    const result = {
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
      finish_reason: response.choices[0].finish_reason,
      created: response.created,
      id: response.id
    };

    return result;

  } catch (error) {
    // Error handling...
  }
}
```

**Default Configuration** (lines 11-18):

```js
this.defaultConfig = {
  model: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo",
  temperature: 0.7,
  max_tokens: 16000,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0
};
```

---

### 3. Quiz Generation

**Route Definition**: [`server/routes/ask.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/routes/ask.js)

```js
// POST /api/ask/quiz
router.post('/quiz', handleQuizGeneration);
```

**Controller**: [`server/controllers/askController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/askController.js#L37-L83)

```js
exports.handleQuizGeneration = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text is required and must be a string" });
    }

    const quizPrompt = `Generate a quiz of 10 multiple-choice questions based on the following text. 

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Mark the correct answer clearly
- Questions should test understanding of key concepts from the text
- Mix different types of questions (factual, conceptual, application)
- Ensure all options are plausible but only one is correct
- Format the output as a valid JSON array

Example format:
[
  {
    "question": "What is the main topic discussed in the text?",
    "options": ["A) Technology", "B) Science", "C) History", "D) Literature"],
    "answer": "B) Science"
  }
]

Text to create quiz from:
${text.slice(0, 20000)}

Generate the quiz in the exact JSON format shown above. Do not include any explanations or additional text outside the JSON array.`;

    const response = await chat.call([
      { 
        role: "system", 
        content: "You are an expert quiz generator. You create high-quality multiple-choice questions that test understanding of the provided content. Always respond with valid JSON arrays containing quiz questions." 
      },
      { role: "user", content: quizPrompt }
    ]);

    res.json({ answer: response.content });

  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};
```

---

## Code Location Reference

| **Functionality** | **File** | **Function/Export** |
|---|---|---|
| Upload Route | `server/routes/upload.js` | `router.post('/', ...)` |
| Upload Controller | `server/controllers/uploadController.js` | `uploadController` |
| Q&A Route | `server/routes/ask.js` | `router.post('/', handleAsk)` |
| Quiz Route | `server/routes/ask.js` | `router.post('/quiz', handleQuizGeneration)` |
| Q&A Controller | `server/controllers/askController.js` | `exports.handleAsk` |
| Quiz Controller | `server/controllers/askController.js` | `exports.handleQuizGeneration` |
| Gemini LLM | `server/utils/llm.js` | `geminiChat` (exported as `call`) |
| Together AI LLM | `server/utils/llm3.js` | `TogetherAIClient.chat` (exported as `call`) |
| PDF Parser | `server/utils/parsePDF.js` | `parsePDF` |
| DOCX Parser | `server/utils/parseDOCX.js` | `parseDOCX` |
| Text Chunking | `server/utils/chunker.js` | `chunkText` |

---

## LLM & Prompt Registry

### Model 1: Google Gemini 2.0 Flash

**Location**: [`server/utils/llm.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/llm.js)

**Configuration**:
```js
{
  temperature: 0.7,   // Balanced creativity
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
}
```

**Context Window**: 1,000,000 tokens

**API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

**Usage**: Document Summarization only (called in `uploadController.js`)

**Environment Variable Required**: `GEMINI_API_KEY`

---

### Model 2: Llama 3.3 70B Instruct Turbo (Together AI)

**Location**: [`server/utils/llm3.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/utils/llm3.js)

**Configuration**:
```js
{
  model: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo",
  temperature: 0.7,
  max_tokens: 16000,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0
}
```

**Context Window**: 128,000 tokens

**Usage**: 
- Chat/Q&A (called in `askController.handleAsk`)
- Quiz Generation (called in `askController.handleQuizGeneration`)

**Environment Variable Required**: `TOGETHER_API_KEY`

---

## Future Contribution Areas

### 1. Vector Storage & RAG Implementation

**Problem**: The system currently passes the entire document text as context to the LLM (up to 8000 chars for summarization, full text for Q&A). This is inefficient for large documents.

**Proposed Solution**: Implement a Vector Store (Pinecone/Chroma/Qdrant) with semantic search.

**Files to Modify**:
- [`server/controllers/uploadController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/uploadController.js): Add embedding generation after text extraction
- [`server/controllers/askController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/askController.js): Replace full-text context with retrieved chunks
- Create new module: `server/utils/embeddings.js` for embedding generation
- Create new module: `server/vectorStores/chromaDB.js` (or similar)

**Suggested Approach**:
```js
// In uploadController after text extraction:
const chunks = chunkText(textContent);
const embeddings = await generateEmbeddings(chunks);
await vectorStore.upsert(documentId, chunks, embeddings);

// In askController:
const relevantChunks = await vectorStore.search(question, topK=5);
const context = relevantChunks.join('\n\n');
```

---

### 2. Model Unification

**Current State**: Using Gemini for summarization and Together AI for Q&A/Quiz creates complexity.

**Suggested Consolidation**: 
- Option A: Move all operations to Together AI (Llama 3.2 or upgrade to Llama 3.3 70B)
- Option B: Move all operations to Gemini (more cost-effective, higher quality)

**Files to Update**:
- [`server/controllers/uploadController.js`](file:///c:/Users/Arnv/The%20NothingApp/ze-noting-app/THE%20NOTING%20APP/server/controllers/uploadController.js) (line 80): Change `require('../utils/llm')` to `require('../utils/llm3')`

---

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with:
   ```
   GEMINI_API_KEY=your_gemini_key
   TOGETHER_API_KEY=your_together_key
   ```
4. Start server: `npm start` (or `node server/server.js`)

---

## Testing Endpoints

### Upload Test
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/path/to/document.pdf"
```

### Q&A Test
```bash
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"text": "Your document text...", "question": "What is...?"}'
```

### Quiz Test
```bash
curl -X POST http://localhost:3001/api/ask/quiz \
  -H "Content-Type: application/json" \
  -d '{"text": "Your document text..."}'
```
