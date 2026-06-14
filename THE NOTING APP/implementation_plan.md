# NotebookAI — Full-Stack Implementation Plan

**Goal**: Transform "The Noting App" into a NotebookLM-style 3-panel AI knowledge workspace powered by a vectorless RAG system (PostgreSQL full-text search + LLM reasoning, NO embeddings).

---

## User Review Required

> [!IMPORTANT]
> **This is a FULL-STACK rebuild** touching both frontend and backend. The plan is organized into 6 phases that can be built sequentially. Each phase produces a working state.

> [!WARNING]
> **Breaking Changes**:
> - The current single-page scroll layout will be replaced with a routed 2-view app (Landing → Workspace)
> - The backend will shift from "send full text to LLM" to a proper chunked retrieval pipeline with PostgreSQL
> - The current production URL (`https://the-noting-app.onrender.com`) will need its backend redeployed

> [!CAUTION]
> **PostgreSQL Required**: The vectorless RAG system needs PostgreSQL. You'll need either:
> - A free hosted instance (Supabase / Neon / Railway — all have free tiers)
> - OR local PostgreSQL installation
> - Current backend uses NO database at all (just file system)

---

## Open Questions

> [!IMPORTANT]
> 1. **PostgreSQL hosting**: Do you have a PostgreSQL instance already? If not, should I use **Supabase** (free), **Neon** (free), or configure for **local PostgreSQL**?
> 2. **LLM Provider**: You currently have Together AI + Groq configured. Which should be the PRIMARY provider for the RAG pipeline? (Groq is faster, Together has larger models)
> 3. **Multi-document from Day 1?**: Should Phase 1 support multiple documents per workspace, or start with single-doc and add multi-doc later?
> 4. **Deploy target**: Still deploying to Render? (Render supports PostgreSQL add-on)

---

## Architecture Overview

### Current vs. New

```
CURRENT:
  Upload PDF → Extract text → Send FULL text to LLM → Get summary/answer
  (No database, no chunking used in retrieval, no source tracking)

NEW:
  Upload PDF → Extract text → Chunk (300-500 words) → Store in PostgreSQL with tsvector
  → User asks question → LLM rewrites query → Full-text search → Multi-query fusion
  → LLM filters relevant chunks → Inject into prompt → Generate answer with citations
```

### System Diagram

```mermaid
graph TB
    subgraph Frontend ["Frontend (Vite + React)"]
        LP["Landing Page<br/>Upload/Link"]
        WP["Workspace Page<br/>3-Panel Layout"]
        LP -->|"file processed"| WP
        
        subgraph WP_Panels ["Workspace Panels"]
            SRC["Left: Sources Panel"]
            CHAT["Center: Chat Panel"]
            STUDIO["Right: Studio Panel"]
        end
    end
    
    subgraph Backend ["Backend (Express.js)"]
        UPLOAD["/api/upload"]
        ASK["/api/ask"]
        SEARCH["/api/search"]
        QUIZ["/api/ask/quiz"]
        SUMMARY["/api/ask/summary"]
        
        subgraph RAG ["Vectorless RAG Pipeline"]
            QR["Query Rewriter<br/>(LLM)"]
            FTS["Full-Text Search<br/>(PostgreSQL)"]
            MQF["Multi-Query Fusion"]
            FILT["LLM Chunk Filter"]
            GEN["Answer Generator<br/>(LLM + citations)"]
            
            QR --> FTS --> MQF --> FILT --> GEN
        end
    end
    
    subgraph DB ["PostgreSQL"]
        DOCS["documents"]
        CHUNKS["chunks + tsvector"]
        NOTEBOOKS["notebooks"]
        MESSAGES["messages"]
    end
    
    Frontend --> Backend
    Backend --> DB
```

---

## Phase 1: Database Schema + Ingestion Pipeline

### Backend — Database Setup

#### [NEW] `server/db/schema.sql`
PostgreSQL schema — **NO embeddings, NO vectors**:

```sql
-- Notebooks (workspaces)
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled Notebook',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents (sources)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'processing', -- processing | ready | error
    page_count INTEGER,
    word_count INTEGER,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chunks (the core search unit)
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    page_number INTEGER,
    tsv TSVECTOR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index (GIN for speed)
CREATE INDEX idx_chunks_tsv ON chunks USING GIN(tsv);
CREATE INDEX idx_chunks_document ON chunks(document_id);

-- Auto-update tsvector on insert/update
CREATE OR REPLACE FUNCTION update_tsv() RETURNS trigger AS $$
BEGIN
    NEW.tsv := to_tsvector('english', NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chunks_tsv_trigger
    BEFORE INSERT OR UPDATE ON chunks
    FOR EACH ROW EXECUTE FUNCTION update_tsv();

-- Chat messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### [NEW] `server/db/pool.js`
PostgreSQL connection pool using `pg`:
- Connection string from `DATABASE_URL` env var
- SSL configuration for hosted PostgreSQL
- Pool size management

#### [NEW] `server/db/migrate.js`
Script to run `schema.sql` and create tables.

---

#### [MODIFY] `server/utils/chunker.js`
Upgrade chunking:
- Change from 500 chars to **300–500 words** per chunk
- Add **50-word overlap** between chunks
- Track `chunk_index` and estimate `page_number`
- Return structured objects: `{ content, chunkIndex, pageNumber, wordCount }`

#### [NEW] `server/services/ingestionService.js`
Full ingestion pipeline:
1. Create/get notebook
2. Create document record (status: `processing`)
3. Extract text (reuse existing `parsePDF`/`parseDOCX`)
4. Chunk text with new chunker
5. Batch-insert chunks into PostgreSQL (with tsvector auto-generated)
6. Generate document summary via LLM
7. Update document status to `ready`

#### [MODIFY] `server/controllers/uploadController.js`
- Replace current logic with ingestion service call
- Return `{ notebookId, documentId, status }` immediately
- Processing happens async (or sync for small files)
- Add SSE/polling endpoint for progress

#### [MODIFY] `server/controllers/scrapeController.js`
- Same changes: use ingestion service
- Return notebook/document IDs

---

## Phase 2: Vectorless RAG Search Engine

### Core Search Pipeline

#### [NEW] `server/services/searchService.js`
PostgreSQL full-text search engine:

```js
// Core search function
async function searchChunks(query, documentIds, limit = 10) {
    const sql = `
        SELECT c.*, d.filename, 
               ts_rank(c.tsv, plainto_tsquery('english', $1)) AS rank
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.tsv @@ plainto_tsquery('english', $1)
          AND c.document_id = ANY($2)
        ORDER BY rank DESC
        LIMIT $3
    `;
    return pool.query(sql, [query, documentIds, limit]);
}
```

#### [NEW] `server/services/queryRewriter.js`
LLM-powered query expansion:
- Takes user question
- Uses LLM to generate 2–3 keyword variations
- Example: "How does fiscal policy affect inflation?" →
  - `"fiscal policy inflation impact"`
  - `"government spending inflation relationship"`
  - `"taxation inflation effects"`

#### [NEW] `server/services/fusionService.js`
Multi-query result fusion:
- Run search for each query variation
- Merge results, remove duplicates (by chunk ID)
- Re-rank by frequency across queries + ts_rank score
- Return top 5–8 chunks

#### [NEW] `server/services/filterService.js`
LLM-based chunk filtering:
- Send retrieved chunks to LLM
- Ask: "From these chunks, select ONLY the most relevant ones to answer: [query]"
- Return filtered chunks with relevance reasoning

#### [NEW] `server/services/ragPipeline.js`
Orchestrates the full pipeline:
1. `queryRewriter.rewrite(question)` → expanded queries
2. `searchService.search(queries, documentIds)` → raw chunks
3. `fusionService.fuse(allResults)` → deduplicated + ranked
4. `filterService.filter(chunks, question)` → LLM-filtered
5. `contextManager.trim(filtered, maxTokens=1500)` → token-safe context
6. Return formatted context with citation metadata

#### [NEW] `server/services/contextManager.js`
Token/context window management:
- Max 5 chunks per query
- Each chunk trimmed to ~300 tokens
- Prioritize higher-ranked chunks
- Format each chunk with source attribution

---

## Phase 3: Chat + Citation System

#### [MODIFY] `server/controllers/askController.js`
Complete rewrite of `handleAsk`:
- Accept: `{ question, notebookId, selectedDocIds }`
- Run through RAG pipeline
- Generate answer with injected context
- Include inline citations: `[Source: filename.pdf, p.4]`
- Save message to PostgreSQL
- Return chat history support

System prompt format:
```
You are an AI assistant for a knowledge workspace.
Use ONLY the context below to answer. If unsure, say so.
Always cite sources using [Source: filename, p.X] format.

Context:
[chunk1 — from Module3.pdf, page 4]
[chunk2 — from Lecture5.docx, page 12]

Question: {user_question}
```

#### [MODIFY] `server/controllers/askController.js` — `handleQuizGeneration`
- Use RAG pipeline to get relevant chunks first
- Generate quiz from retrieved chunks (not full text)

#### [NEW] `server/services/citationService.js`
- Format chunk metadata into citation strings
- Track which chunks were used in each answer
- Store citations in message record

---

## Phase 4: New API Routes

#### [MODIFY] `server/server.js`
Add new routes:

```js
app.use('/api/upload', uploadRoutes);       // Modified
app.use('/api/ask', askRoutes);             // Modified
app.use('/api/scrape', scrapeRoutes);       // Modified
app.use('/api/notebooks', notebookRoutes);  // NEW
app.use('/api/documents', documentRoutes);  // NEW
app.use('/api/search', searchRoutes);       // NEW
```

#### [NEW] `server/routes/notebooks.js`
- `POST /` — Create notebook
- `GET /:id` — Get notebook with documents
- `PUT /:id` — Update title
- `DELETE /:id` — Delete notebook + cascade

#### [NEW] `server/routes/documents.js`
- `GET /notebook/:notebookId` — List documents for notebook
- `GET /:id/status` — Check processing status
- `DELETE /:id` — Remove document + chunks

#### [NEW] `server/routes/search.js`
- `POST /` — Full RAG search (for debugging/testing)

#### [MODIFY] `server/routes/ask.js`
- Update to accept `notebookId` and `selectedDocIds`

#### [MODIFY] `server/routes/upload.js`
- Accept optional `notebookId` parameter
- Create notebook if not provided

---

## Phase 5: Frontend — 3-Panel Workspace

### Routing & State

#### [MODIFY] `frontend/src/App.jsx`
- Add `/workspace/:notebookId` route → `WorkspacePage`
- Keep `/` → `LandingPage`

#### [MODIFY] `frontend/src/components/DocumentTextContext.jsx`
Expand to full workspace context:
```js
{
    notebookId, setNotebookId,
    documents, setDocuments,       // Array of { id, filename, status, ... }
    selectedDocIds, setSelectedDocIds,  // Checked documents
    summaryText, setSummaryText,
    flowchartData, setFlowchartData,
    chatMessages, setChatMessages,
}
```

#### [MODIFY] `frontend/src/components/LandingPage.jsx`
- After upload completes → `navigate(`/workspace/${notebookId}`)`
- Remove all inline content sections (notes, chat, quiz, flowchart)
- Keep hero + upload bar only

### New Workspace Components

#### [NEW] `frontend/src/components/workspace/WorkspacePage.jsx`
Master layout: CSS Grid 3-column (`280px 1fr 340px`), full viewport height.
- Fetches notebook data on mount
- Orchestrates all three panels

#### [NEW] `frontend/src/components/workspace/workspace.css`
Complete dark-theme glassmorphism styles:
- 3-column grid with resizable borders
- Glass panel backgrounds with violet/purple accents
- Smooth animations for panel interactions
- Responsive: mobile collapses to tabbed view

#### [NEW] `frontend/src/components/workspace/SourcesPanel.jsx`
Left sidebar:
- "Sources" header with count
- "Add source" button → file picker / link input
- Document list with checkboxes, status badges, file icons
- "Select all" toggle
- Search/filter input

#### [NEW] `frontend/src/components/workspace/SourceItem.jsx`
Individual source row: checkbox, icon, filename, status indicator

#### [NEW] `frontend/src/components/workspace/ChatPanel.jsx`
Center panel:
- Notebook title (editable)
- AI summary card (generated from documents)
- "N sources selected" indicator
- Chat message list with markdown rendering
- Sticky bottom chat input
- Uses RAG pipeline via API

#### [NEW] `frontend/src/components/workspace/ChatMessage.jsx`
Individual message: user/bot styling, ReactMarkdown, inline citations, code blocks

#### [NEW] `frontend/src/components/workspace/ChatInput.jsx`
Sticky input: textarea, send button, source count badge, keyboard shortcuts

#### [NEW] `frontend/src/components/workspace/StudioPanel.jsx`
Right sidebar with feature cards grid

#### [NEW] `frontend/src/components/workspace/StudioCard.jsx`
Clickable card: icon, title, description, hover animations

#### [NEW] `frontend/src/components/workspace/StudioModal.jsx`
Full-overlay modal to render studio features (quiz, notes, mindmap, flowchart)

### Existing components reused inside StudioModal (no changes needed):
- [NotesViewer.jsx](file:///c:/Users/Arnv/noting%20app/ze-noting-app/THE%20NOTING%20APP/frontend/src/components/NotesViewer.jsx)
- [FlowchartViewer.jsx](file:///c:/Users/Arnv/noting%20app/ze-noting-app/THE%20NOTING%20APP/frontend/src/components/FlowchartViewer.jsx)
- [MindMapViewer.jsx](file:///c:/Users/Arnv/noting%20app/ze-noting-app/THE%20NOTING%20APP/frontend/src/components/MindMapViewer.jsx)
- [QuizzPage.tsx](file:///c:/Users/Arnv/noting%20app/ze-noting-app/THE%20NOTING%20APP/frontend/src/components/quizz/QuizzPage.tsx)

---

## Phase 6: Polish + Advanced Features

### Conflict & Gap Detection
#### [NEW] `server/services/analysisService.js`
- Conflict detection: "Do these chunks contradict each other?"
- Gap detection: "What information is missing to fully answer this?"

### Caching
#### [NEW] `server/services/cacheService.js`
- In-memory cache for recent search results
- Cache LLM-rewritten queries (same question = same expansions)
- TTL-based expiry

### Studio Features via RAG
- **Quiz**: Use RAG chunks instead of full text → better, focused questions
- **Summary**: Generate from top chunks, not entire document
- **Mind Map**: Extract entities/relationships from chunks

---

## Complete File List

### Backend — NEW Files (13)

| File | Purpose |
|------|---------|
| `server/db/schema.sql` | PostgreSQL table definitions |
| `server/db/pool.js` | Database connection pool |
| `server/db/migrate.js` | Migration runner |
| `server/services/ingestionService.js` | Document → chunks → DB pipeline |
| `server/services/searchService.js` | PostgreSQL full-text search |
| `server/services/queryRewriter.js` | LLM query expansion |
| `server/services/fusionService.js` | Multi-query result merging |
| `server/services/filterService.js` | LLM chunk relevance filtering |
| `server/services/ragPipeline.js` | Full RAG orchestrator |
| `server/services/contextManager.js` | Token/context window management |
| `server/services/citationService.js` | Citation formatting |
| `server/routes/notebooks.js` | Notebook CRUD routes |
| `server/routes/documents.js` | Document management routes |

### Backend — MODIFIED Files (6)

| File | Changes |
|------|---------|
| `server/server.js` | New routes, DB init |
| `server/utils/chunker.js` | Word-based chunking with overlap |
| `server/controllers/uploadController.js` | Use ingestion service |
| `server/controllers/askController.js` | RAG pipeline + citations |
| `server/controllers/scrapeController.js` | Use ingestion service |
| `server/routes/ask.js` | Accept notebookId, docIds |

### Frontend — NEW Files (10)

| File | Purpose |
|------|---------|
| `workspace/WorkspacePage.jsx` | 3-panel master layout |
| `workspace/workspace.css` | All workspace styles |
| `workspace/SourcesPanel.jsx` | Left panel — sources |
| `workspace/SourceItem.jsx` | Source row component |
| `workspace/ChatPanel.jsx` | Center panel — chat + summary |
| `workspace/ChatMessage.jsx` | Chat message bubble |
| `workspace/ChatInput.jsx` | Sticky chat input |
| `workspace/StudioPanel.jsx` | Right panel — tools |
| `workspace/StudioCard.jsx` | Tool card component |
| `workspace/StudioModal.jsx` | Feature modal overlay |

### Frontend — MODIFIED Files (3)

| File | Changes |
|------|---------|
| `App.jsx` | Add `/workspace/:id` route |
| `DocumentTextContext.jsx` | Full workspace state |
| `LandingPage.jsx` | Navigate after upload |

**Total: 23 new files, 9 modified files**

---

## New Dependencies Required

### Backend
```json
{
    "pg": "^8.x",           // PostgreSQL client
    "uuid": "^9.x"          // UUID generation (or use pg gen_random_uuid)
}
```

### Frontend
No new dependencies — everything reuses existing packages.

---

## Environment Variables (New)

```env
# Existing
TOGETHER_API_KEY=...
GROQ_API_KEY=...
PORT=5000

# New
DATABASE_URL=postgresql://user:pass@host:5432/notebookai
```

---

## Verification Plan

### Phase 1 Verification
```bash
# Run migration
node server/db/migrate.js

# Upload a PDF and verify chunks in DB
curl -X POST -F "file=@test.pdf" http://localhost:5000/api/upload
# Check PostgreSQL: SELECT count(*) FROM chunks;
```

### Phase 2 Verification
```bash
# Test search directly
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test question", "documentIds": ["..."]}'
```

### Phase 3 Verification
```bash
# Test chat with citations
curl -X POST http://localhost:5000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "...", "notebookId": "...", "selectedDocIds": ["..."]}'
# Verify response contains [Source: ...] citations
```

### Phase 5 Verification
- Run `npm run dev` in frontend
- Upload PDF → auto-navigate to workspace
- Verify 3-panel layout renders
- Send chat message → get RAG-powered response with citations
- Open studio cards → existing features work in modals

### Build Verification
```bash
cd frontend && npm run build  # No compile errors
```
