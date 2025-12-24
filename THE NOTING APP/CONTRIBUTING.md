# Contributing Guide & Architecture Documentation

## High-Level Overview

The **Noting App** is a backend-heavy application designed to ingest documents (PDF/DOCX), summarize them, and allow users to interact with the content through Q&A and Quizzes.

The system uses a dual-LLM architecture:
1.  **Google Gemini 1.5 Flash**: Responsbile for initial document summarization and notes generation upon upload.
2.  **Together AI (Llama 3.2 3B)**: Responsible for interactive Q&A and generating quizzes from the document content.

Currently, the system is **stateless regarding vector storage**. It does not persist embeddings in a vector database. Instead, the raw text content of the document is returned to the frontend after upload and passed back to the server for every Q&A or Quiz request.

---

## Detailed Implementation Flows

### 1. Document Upload & Auto-Summarization
**File**: `server/controllers/uploadController.js`

This flow handles the ingestion of user documents and the creation of "AI Summarized Notes".

1.  **Ingestion**:
    *   The user uploads a file via `POST /api/upload`.
    *   Supported formats: `.pdf`, `.docx`.
    *   The server uses `pdf-parse` (via `utils/parsePDF`) or `mammoth` (via `utils/parseDOCX`) to extract raw text.

2.  **LLM Interaction (Summarization)**:
    *   **Model**: Google Gemini 1.5 Flash (via `utils/llm.js`).
    *   **Input**: The first **8,000 characters** of the extracted text.
    *   **Prompting**:
        *   **System**: `"You are a helpful assistant. Summarize the following document for a student. The summary should be clear, concise, and cover the main points..."`
        *   **User**: The document text chunk.

3.  **PDF Generation**:
    *   The LLM returns a markdown-formatted summary.
    *   The server uses `pdfkit` to render this markdown into a designed PDF (`notes_<filename>.pdf`).
    *   The server returns the download URL for the notes and the **raw text content** to the frontend.

### 2. Question & Answer (Q&A)
**File**: `server/controllers/askController.js` (Endpoint: `handleAsk`)

This flow allows users to chat with their document.

1.  **Request**:
    *   The frontend sends a `POST /api/ask` request containing:
        *   `text`: The full raw text of the document (previously returned during upload).
        *   `question`: The user's query.

2.  **LLM Interaction (Q&A)**:
    *   **Model**: Llama-3.2-3B-Instruct-Turbo via Together AI (via `utils/llm3.js`).
    *   **Context**: The *entire* document text is passed as context (no RAG/Embeddings currently used).
    *   **Prompting**:
        *   **System**: `"You are a helpful assistant. When providing code, always format it as a markdown code block..."`
        *   **User**:
            ```text
            Context:
            <Full Document Text>

            Question: <User Question>

            Please provide a detailed, well-explained answer...
            ```

### 3. Quiz Generation
**File**: `server/controllers/askController.js` (Endpoint: `handleQuizGeneration`)

This flow generates a 10-question multiple-choice quiz based on the document.

1.  **Request**:
    *   Frontend sends `POST /api/ask/quiz` containing `text` (the document content).

2.  **LLM Interaction (Quiz)**:
    *   **Model**: Llama-3.2-3B-Instruct-Turbo via Together AI.
    *   **Input**: The first **4,000 characters** of the text.
    *   **Prompting**:
        *   **System**: `"You are an expert quiz generator. You create high-quality multiple-choice questions..."`
        *   **User**:
            ```text
            Generate a quiz of 10 multiple-choice questions based on the following text.
            Requirements:
            - Each question should have exactly 4 options...
            - Format the output as a valid JSON array
            ...
            Text to create quiz from:
            <First 4000 chars of text>
            ```

---

## LLM & Prompt Registry

### Model 1: Google Gemini 1.5 Flash
*   **Location**: `server/utils/llm.js`
*   **Configuration**:
    *   `temperature`: 0.5 (Balanced creativity)
    *   `topP`: 0.2
    *   `topK`: 40
*   **Usage**: Document Summarization only.

### Model 2: Llama 3.2 3B Instruct Turbo (Together AI)
*   **Location**: `server/utils/llm3.js`
*   **Configuration**:
    *   `temperature`: 0.7
    *   `max_tokens`: 8000
*   **Usage**: Chat/Q&A and Quiz Generation.

## Future Contribution Areas

*   **Vector Storage**: The project currently relies on passing full context strings. Contributing a Vector Store (Pinecone/Chroma) to `askController.js` would allow for handling larger documents via RAG (Retrieval Augmented Generation).
*   **Model Unification**: Consolidating to a single LLM provider (either Gemini or Together AI) for consistency.
