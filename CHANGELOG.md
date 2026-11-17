# Quillora AI — Changelog & Implementation History

## [1.0.1] — 2026-11-17

### Production Verification & Model Alignment
- **Groq Model Update**:
  - Identified that `llama-3.3-70b-versatile` was not provisioned for the current Groq API key, throwing HTTP 404 `model_not_found`.
  - Surveyed available Groq models via `client.models.list()` and validated `openai/gpt-oss-120b` (120B parameter model with native JSON mode support).
  - Updated `backend/.env`, `backend/.env.example`, and `backend/config.py` default model to `openai/gpt-oss-120b`.
- **Import & Execution Path Flexibility**:
  - Enhanced `backend/main.py`, `backend/prompts.py`, `backend/llm.py`, `backend/db.py`, and `backend/__init__.py` with dynamic `sys.path` injection.
  - Allows running Uvicorn seamlessly from both the project root (`uvicorn backend.main:app`) and the backend directory (`uvicorn main:app`).
- **Live Groq & MongoDB Verification**:
  - Implemented `backend/tests/verify_live.py` covering 21 live end-to-end production scenarios.
  - Verified 100% pass rate with real Groq completions, prompt injection resistance, tone variation, dialogue voice preservation, and rate-limit backoff handling.
- **Documentation Updates**:
  - Updated `TESTING.md` with complete 21-scenario verification matrix and exact evidence.
  - Published comprehensive `VERIFICATION_REPORT.md` detailing all live Groq completions, E2E browser test logs, and security audits.

---

## [1.0.0] — 2026-11-17

### Initial Complete Implementation

#### Authoritative Knowledge Management
- Implemented `backend/knowledge.py`:
  - Dynamically discovers and loads `KNOWLEDGE.md` from the workspace root.
  - Safe mtime-based disk caching to avoid redundant file reads.
  - Hot-reloading support without server restart via `/api/reload-knowledge`.
  - Automatically parses Section 6 Protected Terms (e.g., `Quillora`).
  - Strict error handling: fails loudly if `KNOWLEDGE.md` is missing or empty.

#### Backend Architecture (FastAPI)
- Implemented `backend/config.py`: Pydantic settings loading from `.env` and environment variables.
- Implemented `backend/models.py`: Pydantic V2 schemas for `CheckRequest`, `CheckResponse`, `IssueItem`, `EnhanceRequest`, `EnhanceResponse`, `EnhanceItem`, and `HealthResponse`.
- Implemented `backend/prompts.py`: Authoritative prompt builder injecting the full contents of `KNOWLEDGE.md`, feature rules, JSON contracts, and untrusted user data boundary wrappers (`<untrusted_user_text>`).
- Implemented `backend/text_processing.py`:
  - Intelligent ~1,800 character chunker respecting paragraph and sentence boundaries.
  - Strict preservation of global character offsets (`chunk.text == text[start:end]`).
  - Server-side exact offset solver (`find_exact_offsets`) with occurrence context.
  - Span overlap resolver and deduplicator (`resolve_and_deduplicate_spans`).
  - Protected terms filter preventing false positives on product/character names.
- Implemented `backend/llm.py`:
  - Asynchronous Groq API client with JSON object mode.
  - Safe retry with exponential backoff on HTTP 429 and 503.
  - Resilient JSON parsing with markdown fence stripping and regex fallback.
  - Built-in deterministic mock engine for testing and offline development.
- Implemented `backend/db.py`:
  - Privacy-first MongoDB client via Motor.
  - Logs only non-sensitive operational telemetry (character counts, processing durations).
  - Never logs or stores user submitted text.
  - Graceful degradation: operates seamlessly in stateless mode if MongoDB is absent.
- Implemented `backend/main.py`:
  - Lifespan management for knowledge loading and database connection.
  - CORS middleware configured for frontend ports.
  - Routes: `GET /api/health`, `POST /api/check`, `POST /api/enhance`, `POST /api/reload-knowledge`.

#### Frontend Architecture (React + Vite + Tailwind CSS)
- Initialized and built modern, responsive, premium UI:
  - `Header.jsx`: Branding, navigation tabs, live backend and knowledge base status pill, and hot-reload trigger.
  - `HighlightedEditor.jsx`: Dual-mode text workspace (raw text editor and synchronized interactive highlight overlay).
  - `WritingCheckerPanel.jsx`: Category-coded issue cards (spelling, grammar, punctuation, style), explanation display, individual "Apply", "Ignore", and right-to-left "Apply All Safe Corrections".
  - `WordEnhancerPanel.jsx`: Tone selector pills (*Neutral*, *Formal*, *Casual*, *Creative*), 3 ranked alternatives per target word, 1-click alternative application.
  - `Toast.jsx`: Feedback notifications for copy, batch application, and reset actions.
  - `sampleTexts.js`: 4 curated test samples for instant testing.
  - `App.jsx`: Full state orchestration, dynamic offset relocation, undo snapshots, and `Ctrl+Enter` keyboard shortcuts.
