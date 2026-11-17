# Quillora AI 🪶

Quillora AI is an intelligent English-writing assistant designed to help students, fiction writers, and professionals elevate their writing without losing their unique voice.

It offers two core features:
1. **Writing Checker** — Pinpoints spelling errors, grammatical mistakes, punctuation issues, and accidental repetition. Explains every issue in plain language and allows individual or batch correction.
2. **Word Enhancer** — Detects weak, vague, or repetitive words and suggests 3 ranked contextual alternatives tailored to a selected tone (*Neutral*, *Formal*, *Casual*, *Creative*).

---

## Key Highlights

- **Interactive Side-by-Side Correction Preview**: Preview all detected changes side-by-side with visual diff badges (red strikethrough for removals, green for additions). Includes an issue stepper, individual accept/reject toggles, summary metrics, and offset-safe batch application.
- **ChatGPT-Style Writing History**: Collapsible document history sidebar organized chronologically into *Today*, *Yesterday*, *Previous 7 Days*, and *Older*. Features instant document search, auto-generated titles from first sentences, three-dot rename/delete menus, and localStorage autosave.
- **Demo Authentication & SaaS Onboarding**: Split-screen SaaS authentication with built-in evaluation credentials (`user` / `123`), quick one-click direct login, registration modal with local validation, and session persistence across page refreshes.
- **Branded Workspace Loading Experience**: Animated Quillora feather logo and progress indicator while initializing writing sessions.
- **Authoritative Knowledge Base (`KNOWLEDGE.md`)**: Injected into every AI prompt as the single source of truth. Supports live hot-reloading without server restarts.
- **Accurate Global Offsets**: Character offsets are calculated server-side, never trusted to the LLM. Highlights map 1:1 to original text, preventing hallucinated replacements.
- **Intelligent Chunking**: Long documents are split into ~1,800-character chunks along paragraph and sentence boundaries, processed concurrently, and cleanly merged.
- **Right-to-Left Safe Replacement**: When applying batch corrections or previewed selections, downstream character offsets are dynamically adjusted so subsequent replacements remain exact.
- **Privacy First**: User text is never saved to a database or logged. Optional MongoDB stores only non-sensitive operational metadata (word counts, processing time).
- **Graceful Offline Mode**: Includes a deterministic rule engine for offline development and test automation when a Groq API key is not present.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   React (Vite) Frontend     |
                      |   - Split Editor & Review   |
                      |   - Synchronized Highlights |
                      |   - Category / Tone Badges  |
                      +--------------+--------------+
                                     | HTTP / JSON
                                     v
                      +-----------------------------+
                      |     FastAPI Backend         |
                      |  - Knowledge Base Injection |
                      |  - Chunking & Offset Solver |
                      |  - Pydantic Validations     |
                      +-------+-------------+-------+
                              |             |
           +------------------+             +-----------------+
           |                                                  |
           v                                                  v
+-----------------------+                         +-----------------------+
|  Groq LLM Client      |                         | Optional MongoDB      |
|  - JSON Object Mode   |                         | - Metadata Only       |
|  - Rate-limit Retries |                         | - No User Text Stored |
+-----------------------+                         +-----------------------+
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend

```bash
# From workspace root
cd backend

# Create & activate virtual environment (if not already created)
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure .env (optional: add GROQ_API_KEY)
cp .env.example .env

# Run FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend

```bash
# In a separate terminal, from workspace root
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Documentation Links

- [KNOWLEDGE.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/KNOWLEDGE.md) — Authoritative product rules and AI contracts
- [ARCHITECTURE.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/ARCHITECTURE.md) — In-depth architectural design
- [API.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/API.md) — REST API specifications and schemas
- [SETUP.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/SETUP.md) — Comprehensive setup and deployment guide
- [TESTING.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/TESTING.md) — Automated testing matrix and verification
- [VERIFICATION_REPORT.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/VERIFICATION_REPORT.md) — Comprehensive final production audit and browser E2E report
- [CHANGELOG.md](file:///c:/Users/abhijitbhunia/OneDrive%20-%20virtualemployee%20P%20Ltd/Desktop/Quillora%20AI/CHANGELOG.md) — Complete implementation log
