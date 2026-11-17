# Quillora AI — Changelog & Implementation History

## [1.1.0] — 2026-11-17

### Application Experience & SaaS Upgrade

- **Interactive Side-by-Side Correction Preview**:
  - Implemented `WritingPreviewModal.jsx` offering a side-by-side split view of original submitted text vs. corrected preview.
  - Added visual diff styling (red strikethrough for removals, green highlights for additions).
  - Added summary metric strip reporting Total Detected, Selected to Apply, Ignored, and Estimated Words Affected.
  - Integrated suggestion stepper (Prev/Next), Accept All, Reject All, and individual toggle controls.
  - Implemented offset-safe Right-to-Left replacement algorithm (`b.start - a.start`) ensuring zero character drift when applying selected subsets.
  - Added prominent `Preview All Changes` button to `WritingCheckerPanel.jsx` and `Preview Enhancements` button to `WordEnhancerPanel.jsx`.

- **ChatGPT-Style Writing History Sidebar**:
  - Implemented `HistorySidebar.jsx` and `HistoryItem.jsx` with collapsible desktop view and responsive mobile drawer.
  - Created `historyService.js` backed by `localStorage.quillora_writing_history` with initial demo writing sessions.
  - Automatic chronological grouping into *Today*, *Yesterday*, *Previous 7 Days*, and *Older*.
  - Added real-time document search filtering and automatic document title generation from the first sentence.
  - Provided three-dot item management menus for inline document renaming and deletion with confirmation.
  - Implemented debounced auto-save preserving document text, active tab mode, issues, suggestions, tone, and statistics.

- **Frontend Demo Authentication & SaaS Onboarding**:
  - Created `authService.js` and `AuthContext.jsx` with persistent demo session management (`quillora_demo_auth`).
  - Built `LoginPage.jsx` with modern split-screen SaaS layout (left: product hero & value props, right: sign-in form).
  - Built `DemoCredentials.jsx` featuring one-click "Fill Inputs" and direct "Login with Demo Account" for evaluation (`user` / `123`).
  - Built `RegisterPage.jsx` with local client-side validation for account creation.
  - Full session persistence surviving page reloads; Sign Out terminates session and redirects to sign-in.

- **Branded Workspace Loading Experience**:
  - Implemented `AppLoader.jsx` featuring animated pulsing Quillora feather logo, subtle glow, progress bar, and "Preparing your writing workspace..." status.
  - Configured custom CSS keyframe animations in `index.css`.

- **User Profile Menu & Information Modal**:
  - Implemented `ProfileDropdown.jsx` in header displaying user avatar, name, username, and "Demo Account" badge.
  - Implemented `ProfileModal.jsx` showing full account details, evaluation role privileges, and sign-out controls.

- **Automated Verification & Artifact Generation**:
  - Authored `frontend/e2e_full_upgrade_test.js` validating all 23 verification scenarios with 100% pass rate.
  - Automatically captured and archived 6 high-resolution screenshots in `screenshots/`:
    - `login_page.png`
    - `registration_page.png`
    - `main_application.png`
    - `history_sidebar.png`
    - `correction_preview.png`
    - `profile_dropdown.png`
  - Re-verified backend pytest suite (23/23 tests passing) and production Vite build (1,590 modules transformed, 0 errors).

---

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
