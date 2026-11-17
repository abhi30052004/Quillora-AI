# Quillora AI — Technical Architecture

This document describes the architectural decisions, component interactions, text processing pipeline, and security model of Quillora AI.

---

## 1. System Components

### 1.1 Knowledge Management (`knowledge.py`)
- **Single Source of Truth**: `KNOWLEDGE.md` is loaded at runtime.
- **Safe Mtime Caching**: Inspects file modification timestamps before reading from disk to minimize unnecessary I/O while supporting hot-reloading when `KNOWLEDGE.md` is edited.
- **Protected Terms Extraction**: Extracts protected keywords (e.g. `Quillora`) from Section 6 to prevent the AI from flagging them.
- **Error Guard**: Fails loudly if the file is missing or empty, guaranteeing that no LLM request runs without authoritative instructions.

### 1.2 Prompt Construction (`prompts.py`)
- **System Prompt**:
  - Application role.
  - Complete `KNOWLEDGE.md` contents injected verbatim.
  - Active feature rules (Writing Checker or Word Enhancer).
  - Strict JSON output contract.
- **Untrusted User Data Boundary**:
  - User text is wrapped in `<untrusted_user_text>` tags.
  - System explicitly instructs the model to treat the content strictly as data and ignore any meta-instructions (prompt injection defense).

### 1.3 Text Processing Pipeline (`text_processing.py`)
- **Chunking Strategy**:
  - Long documents are split into ~1,800-character chunks.
  - Split preference order: Paragraph breaks (`\n\n`) -> Single linebreaks (`\n`) -> Sentence boundaries (`. `, `! `, `? `) -> Word boundaries.
  - Global offset tracking: `chunk.text == full_text[chunk.global_start:chunk.global_end]` ensures zero offset drift.
- **Server-Side Offset Resolution (`find_exact_offsets`)**:
  - The LLM never returns character coordinates.
  - The server locates `original` within the chunk text and computes 0-based `start` and `end` indices in the global text.
  - Discards hallucinated or unmatchable phrases.
- **Overlap Resolution & Deduplication (`resolve_and_deduplicate_spans`)**:
  - Sorts candidates by `start` ascending and span length descending.
  - Resolves overlapping regions so conflicting suggestions cannot corrupt text.
  - Filters out protected terms.

### 1.4 LLM Integration (`llm.py`)
- **Groq Client**:
  - Asynchronous calls with `AsyncGroq`.
  - JSON mode enabled (`response_format={"type": "json_object"}`).
  - Low temperature (`0.1`) for deterministic and accurate corrections.
  - Exponential backoff retry on HTTP 429 (rate limits) and 503 errors.
  - Resilient JSON parser strips markdown fences (` ```json `) or extracts top-level JSON objects.
- **Deterministic Mock Engine**:
  - Automatically activates when `GROQ_API_KEY` is not provided or `MOCK_LLM=true`.
  - Enables full test coverage and offline verification without external network dependency.

### 1.5 Database & Privacy (`db.py`)
- **Privacy-First Design**:
  - User submitted text is NEVER stored in a database or logged to disk.
  - Optional Motor MongoDB client stores only operational telemetry:
    `{ "event_type": str, "char_count": int, "word_count": int, "issue_count": int, "duration_ms": float, "timestamp": datetime }`.
  - If MongoDB is absent, the backend operates seamlessly without errors in stateless mode.

### 1.6 Frontend Architecture (`frontend/src/`)
- **React 18 + Vite + Tailwind CSS**:
  - Modular component hierarchy: `Header`, `HighlightedEditor`, `WritingCheckerPanel`, `WordEnhancerPanel`, `Toast`.
  - Dynamic highlight overlay accurately renders spans matching the backend's verified `(start, end)` offsets.
  - Two-way focus: clicking an issue card highlights the text span; clicking a highlighted word in text focuses the card.
  - Right-to-Left Batch Application: "Apply All" applies replacements from the highest character offset to the lowest, ensuring downstream offsets remain valid without shifting.
  - Dynamic Offset Relocation: Applying an individual fix dynamically computes `delta = replacement.length - original.length` and shifts subsequent pending issues accordingly.
