# Novel Writer Assistant

A focused book writing and editing application with integrated AI knowledge tools. Writers create and edit books with a rich text editor, while the Knowledge Assistant provides research support and story analysis powered by LLM.

## Features

- **Rich Text Editor** -- TipTap-based editor with font customization, headings, lists, blockquotes, and auto-save
- **Book Organization** -- Chapters and sections with drag-to-reorder support
- **Knowledge Assistant** -- Research panel for querying general knowledge (history, science, culture) during writing
- **Story Context Analysis** -- Background processing extracts characters, plot events, settings, and themes from your sections
- **Book-Aware Queries** -- Ask questions about your own book content ("What color are Elena's eyes?", "Are there plot inconsistencies in chapters 3-5?")
- **Multi-Provider LLM** -- Supports local llama.cpp, OpenAI, and Google Gemini as LLM backends
- **Semantic Caching** -- Avoids redundant LLM calls with exact-match and vector similarity deduplication

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Database**: MySQL via Prisma ORM
- **UI**: TailwindCSS 4 + DaisyUI
- **Editor**: TipTap 3
- **Vector DB**: Qdrant (for semantic search and caching)
- **Embeddings**: Xenova/all-MiniLM-L6-v2 (runs in-process, 384 dimensions)
- **LLM**: Configurable -- local llama.cpp, OpenAI API, or Gemini API

## Prerequisites

- Node.js 20+
- MySQL 8+
- Docker and Docker Compose (for Qdrant, and optionally llama.cpp)

## Setup

### 1. Create the MySQL database

Connect to MySQL and create a database for the application:

```bash
mysql -u root
```

```sql
CREATE DATABASE writerassistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

If you use a dedicated MySQL user instead of root, grant it full access:

```sql
CREATE USER 'nwa'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON writerassistant.* TO 'nwa'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

#### Database connection

Set `DATABASE_URL` to point to the database you created above:

```env
DATABASE_URL="mysql://root@localhost:3306/writerassistant"
```

Or if you created a dedicated user:

```env
DATABASE_URL="mysql://nwa:your_password@localhost:3306/writerassistant"
```

The format is `mysql://USER:PASSWORD@HOST:PORT/DATABASE`.

#### Session secret

Generate a random string of at least 32 characters for session encryption:

```bash
openssl rand -base64 32
```

```env
SESSION_SECRET="paste-the-generated-string-here"
```

#### LLM provider

Choose one of the three supported backends:

**Option A -- OpenAI** (recommended for quickest setup):

```env
LLM_PROVIDER="openai"
LLM_API_KEY="sk-..."
```

Uses `gpt-4o-mini` by default. Override with `LLM_MODEL_ID="gpt-4o"` or any other OpenAI model.

**Option B -- Google Gemini**:

```env
LLM_PROVIDER="gemini"
LLM_API_KEY="your-gemini-api-key"
```

Uses `gemini-2.5-flash` by default. Override with `LLM_MODEL_ID`.

**Option C -- Local llama.cpp** (no API key needed, runs via Docker):

```env
LLM_PROVIDER="local"
```

Uses `Qwen/Qwen3-8B-GGUF:Q4_K_M` by default. The model is downloaded automatically on first start. Requires Docker and a working internet connection from within Docker for the initial download.

### 4. Start services

```bash
# Start Qdrant (and llama if using local provider)
docker compose up -d
```

### 5. Initialize database

```bash
npx prisma migrate dev
```

### 6. Create an admin user

```bash
npm run add-admin admin@example.com YourPassword123! "Admin"
```

### 7. Run the application

```bash
npm run dev
```

This starts three processes concurrently:
- `[next]` -- Next.js dev server on http://localhost:3000
- `[docker]` -- Docker services (Qdrant + llama)
- `[worker]` -- Story context background worker

### Running components individually

```bash
npm run dev:next      # Next.js only
npm run dev:docker    # Docker services only
npm run dev:worker    # Background worker only
```

## LLM Provider Configuration

| Provider | `LLM_PROVIDER` | `LLM_API_KEY` | Default Model |
|----------|----------------|---------------|---------------|
| Local llama.cpp | `local` | Not needed | Qwen/Qwen3-8B-GGUF:Q4_K_M |
| OpenAI | `openai` | Required | gpt-4o-mini |
| Google Gemini | `gemini` | Required | gemini-2.5-flash |

Override the default model with `LLM_MODEL_ID` and the base URL with `LLM_BASE_URL`.

## Project Structure

```
app/
  (main)/
    auth/           # Login, register, password recovery
    dashboard/
      books/        # Book management and editor
      users/        # Admin user management
  api/
    knowledge-assistant/   # General knowledge query API
    story-context/         # Book content analysis API
components/
  editor/           # TipTap editor, toolbar, knowledge panel
lib/
  llm-client.ts     # Multi-provider LLM transport
  story-context.ts  # Section analysis and book querying
  knowledge-assistant.ts  # General knowledge queries
  embedding.ts      # In-process text embeddings
  qdrant.ts         # Vector database client
workers/
  story-context-worker.ts  # Background section analysis
```

## User Management Scripts

```bash
npm run add-user          # Create a user (default role: CREATOR)
npm run add-admin         # Create an admin user
npm run list-users        # List all users
npm run change-password   # Reset a user's password
npm run change-role       # Change a user's role
```

### Adding users

```bash
# Create a writer (CREATOR role, default)
npm run add-user writer@example.com MyPassword123! "Jane Doe"

# Create a writer with explicit role
npm run add-user writer@example.com MyPassword123! "Jane Doe" CREATOR

# Create an admin
npm run add-user admin@example.com MyPassword123! "Admin" ADMINISTRATOR

# Create a viewer (read-only access)
npm run add-user viewer@example.com MyPassword123! "Reader" VIEWER
```

Available roles:
- **CREATOR** — Can create and edit books, use the Knowledge Assistant
- **ADMINISTRATOR** — Full access including user management
- **VIEWER** — Read-only access to the dashboard

## How Story Context Analysis Works

1. You edit a book section in the editor
2. After 30 seconds of idle time, the background worker detects the change
3. The section text is sent to the LLM, which extracts characters, plot events, settings, themes, and more
4. The extraction is stored in Qdrant as a vector for semantic search
5. When you ask a question about your book in the Knowledge Assistant, it searches these vectors, gathers relevant sections, and synthesizes an answer with source references

## Agentic Automation Overview

The application uses several autonomous and semi-autonomous processes that work together to assist the writer without manual intervention.

### Background Story Context Worker

A standalone Node.js process (`workers/story-context-worker.ts`) runs continuously alongside the application. It operates as an autonomous agent that:

- **Monitors** all book sections for content changes by comparing SHA-256 hashes of extracted plain text against previously analyzed versions
- **Detects idle sections** — only processes sections that haven't been edited for 30+ seconds, using the auto-save timestamp as a heartbeat signal
- **Extracts narrative elements** by sending section text to the LLM with a structured extraction prompt, producing: characters (names, traits, relationships), plot events, settings, timeline details, themes, conflicts, and foreshadowing
- **Stores results** as vectors in Qdrant for semantic retrieval and as structured JSON in MySQL for direct access
- **Self-heals** — recovers sections stuck in "processing" state for over 10 minutes (crash recovery), retries failed sections on subsequent cycles, and enters a health-check loop when the LLM is unreachable

### Query Classification Agent

When a user submits a question in the Knowledge Assistant, the system automatically determines whether it's a general knowledge question or a question about the user's own book:

- **Fast-path heuristics** catch obvious cases without an LLM call (e.g., "in my book" triggers book mode, "what is photosynthesis" triggers general mode)
- **LLM classification** handles ambiguous queries, returning a confidence score
- **User override** — the detected mode is shown as a badge, and the user can switch modes with one click if the classification was wrong

### Agentic Book Query Processing

When the user asks a question about their book, the system orchestrates multiple LLM calls and search operations through a decision-driven pipeline. The agent decides how to approach each query based on its complexity, executes a variable number of steps, and adapts its strategy based on intermediate results.

#### Two-path routing

The agent first determines the query's complexity using pattern matching against indicators like comparison words ("compare", "between", "vs"), consistency-checking language ("plot hole", "contradiction"), cross-chapter references ("across chapters", "throughout"), and exhaustive requests ("all characters", "every mention"). This determines which execution path to follow:

- **Simple path** — Single-pass for focused questions like "What does Elena look like?" or "Where does the battle take place?"
- **Complex path** — Multi-step for analytical questions like "How does Elena's relationship with Marcus change between chapters 2 and 5?" or "Are there timeline inconsistencies?"

#### Simple query execution

Even the simple path involves multiple coordinated steps:

1. The LLM receives the user's question and generates 1-3 search queries optimized for semantic retrieval. This is itself an LLM call — the model decides how to decompose the question into effective search terms.
2. Each search query is embedded into a 384-dimensional vector and searched against the book's story context collection in Qdrant (cosine similarity, threshold 0.55, filtered by book ID).
3. For each matched section, the full narrative extraction (characters, events, settings, conflicts) is loaded from MySQL.
4. Results are deduplicated by section ID and sorted chronologically by chapter and section order.
5. The gathered context is assembled into a structured prompt (capped at ~4000 characters) and sent to the LLM for synthesis.
6. The LLM produces a final answer with cited evidence (specific chapter/section references), identified gaps in the available information, and suggested follow-up questions.

#### Complex query execution

The complex path extends the simple path with iterative search and adaptive fallback:

1. **Query decomposition** — Same as simple: the LLM generates 1-3 sub-queries. But for complex questions, these sub-queries target different facets. For example, "Does Elena's relationship with Marcus evolve?" might produce: "Elena and Marcus relationship", "Elena interactions with Marcus conflict", "Elena Marcus chapters".
2. **Iterative search** — Instead of searching all sub-queries at once, each sub-query is searched independently (up to `maxSteps`, default 3). After each search, new sections are added to the accumulated context while deduplicating by section ID. This allows the agent to build a broader picture across different aspects of the question.
3. **Adaptive fallback** — After all sub-queries have been searched, the agent evaluates whether enough context was found. If fewer than 2 sections matched (indicating the decomposition may have been too narrow), the agent falls back to searching with the original unmodified query. This self-correcting behavior ensures the agent doesn't return empty results when the LLM's decomposition missed the right search terms.
4. **Chronological ordering** — All gathered sections are sorted by chapter order then section order, so the synthesis LLM sees the story in narrative sequence. This is critical for questions about character arcs, timeline progression, and plot evolution.
5. **Synthesis** — The full accumulated context is sent to the LLM with a system prompt that instructs it to cross-reference between sections, identify patterns or inconsistencies, cite specific sources, and flag information that's missing from the analyzed sections.

#### What makes it agentic

The query processing qualifies as agentic behavior because:

- **The LLM makes decisions** — It decides how to decompose the question into search queries rather than using fixed keyword extraction. Different questions produce different decomposition strategies.
- **Variable execution steps** — The number of search operations varies based on the decomposition (1-3 sub-queries) and whether the fallback triggers, meaning the agent takes between 2 and 5 LLM calls per query.
- **Self-correction** — The fallback mechanism detects when the initial strategy failed (too few results) and autonomously tries an alternative approach.
- **Multi-tool orchestration** — Each query coordinates between the LLM (for decomposition and synthesis), the embedding model (for vector generation), the vector database (for semantic search), and the relational database (for structured data retrieval).

### Content-Aware Query Caching

Book query responses are cached with automatic invalidation:

- A **book content fingerprint** is computed by hashing all `SectionAnalysis.contentHash` values for the book
- The query hash includes this fingerprint, so identical questions return cached responses instantly
- When any section is re-analyzed (content changed), the fingerprint changes and all cached book queries for that book are automatically invalidated
- General knowledge queries use a separate two-tier cache: exact-match (SHA-256 hash) and semantic similarity (Qdrant, cosine distance >= 0.85)

### Automation Flow Diagram

```
Writer edits section
       |
       v
Auto-save (2s debounce)
       |
       v
Worker detects idle section (30s threshold)
       |
       v
LLM extracts narrative elements ──> Qdrant (vector storage)
       |                                    |
       v                                    |
MySQL (structured data)                     |
       |                                    |
       v                                    v
Writer asks question ──> Classify ──> Book query?
       |                    |              |
       |                    v              v
       |               General ──>    Decompose query
       |               knowledge      Search Qdrant
       |               cache/LLM      Gather context
       |                    |          Synthesize answer
       v                    v              |
   Knowledge Assistant displays result <───┘
```
