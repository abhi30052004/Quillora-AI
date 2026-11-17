# Quillora AI — Testing and Quality Assurance

This document details the automated test strategy, offline mock test suite, live Groq AI verification matrix, and end-to-end tests.

---

## 1. Test Architecture

The testing suite is divided into two layers:
1. **Offline Automated Pytest Suite (`backend/tests/`)**:
   - Uses a deterministic mock engine that runs in <1 second without network or API keys.
   - Validates schema validation, knowledge base parsing, chunking, server-side offset calculations, overlap resolutions, and prompt construction.
2. **Live Groq AI & MongoDB Verification Suite (`backend/tests/verify_live.py`)**:
   - Executes real HTTP requests against the running FastAPI server (`http://127.0.0.1:8000`).
   - Calls the live Groq API (`openai/gpt-oss-120b`) with JSON mode.
   - Validates live response contracts, tone variations, dialogue preservation, prompt injection isolation, rate-limit retries, and database telemetry logging.

---

## 2. Offline Automated Pytest Suite

Run offline tests from the workspace root:
```bash
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

### Result: 22 / 22 Passed (100%)
- `test_api.py::test_health_endpoint` — **PASSED**
- `test_api.py::test_writing_checker_endpoint` — **PASSED**
- `test_api.py::test_writing_checker_empty_input_rejected` — **PASSED**
- `test_api.py::test_word_enhancer_endpoint` — **PASSED**
- `test_api.py::test_reload_knowledge_endpoint` — **PASSED**
- `test_feature_matrix.py::test_writing_checker_matrix` — **PASSED**
- `test_feature_matrix.py::test_word_enhancer_matrix` — **PASSED**
- `test_feature_matrix.py::test_technical_edge_cases` — **PASSED**
- `test_knowledge.py::test_knowledge_loads_authoritative_file` — **PASSED**
- `test_knowledge.py::test_knowledge_extracts_protected_terms` — **PASSED**
- `test_knowledge.py::test_missing_knowledge_file_raises_error` — **PASSED**
- `test_knowledge.py::test_empty_knowledge_file_raises_error` — **PASSED**
- `test_knowledge.py::test_knowledge_reload_on_mtime_change` — **PASSED**
- `test_prompts.py::test_checker_system_prompt_includes_knowledge` — **PASSED**
- `test_prompts.py::test_enhancer_system_prompt_includes_knowledge_and_tone` — **PASSED**
- `test_prompts.py::test_user_prompt_wraps_untrusted_data` — **PASSED**
- `test_text_processing.py::test_split_short_text` — **PASSED**
- `test_text_processing.py::test_split_long_text_exact_offsets` — **PASSED**
- `test_text_processing.py::test_find_exact_offsets` — **PASSED**
- `test_text_processing.py::test_find_exact_offsets_repeated_words` — **PASSED**
- `test_text_processing.py::test_resolve_overlapping_spans` — **PASSED**
- `test_text_processing.py::test_protected_terms_are_filtered` — **PASSED**

---

## 3. Live Groq AI Production Verification Matrix

Executed via `backend/tests/verify_live.py` against `http://127.0.0.1:8000` with model `openai/gpt-oss-120b`:

| # | Test Name | Result | Pass/Fail | Evidence / Details |
|---|---|---|---|---|
| 1.1 | Live Groq Configuration Active | Model active, live mode | **PASS** | `groq_configured=True, mock_mode=False, model=openai/gpt-oss-120b` |
| 1.2 | Authoritative Knowledge Base Loaded | Loaded from disk | **PASS** | `knowledge_loaded=True, protected_terms=['quillora']` |
| 1.3 | Database Metadata Logging Connected | MongoDB ping succeeded | **PASS** | `db_connected=True, cluster=cluster0.u8obfwb.mongodb.net` |
| 2.1 | Writing Checker Live Groq Execution | Caught grammar & spelling | **PASS** | Corrected "He go" → "He goes", "their" → "they're", "recieve" → "receive". All offsets valid. |
| 3.1 | Word Enhancer Tone 'neutral' | 3 ranked alternatives | **PASS** | Target "very tired" → `["exhausted", "fatigued", "weary"]` |
| 3.2 | Word Enhancer Tone 'formal' | 3 formal alternatives | **PASS** | Target "got" → `["received", "obtained", "earned"]` |
| 3.3 | Word Enhancer Tone 'casual' | 3 casual alternatives | **PASS** | Target "happy" → `["thrilled", "stoked", "pumped"]` |
| 3.4 | Word Enhancer Tone 'creative' | 3 creative alternatives | **PASS** | Evocative imagery matching sentence context |
| 4.1 | Already Correct English | Zero false positives | **PASS** | Returned `issues: []` on clean, grammatical text |
| 4.2 | Dialogue Fragments Preserved | Respects author voice | **PASS** | Section 4 rule verified: intentional fragment in quotes not flagged |
| 4.3 | Fictional Character Names | No false spelling flags | **PASS** | Invented names ("Aeloria", "Valdorian") preserved |
| 4.4 | Protected Terms Never Flagged | Section 6 filter | **PASS** | "Quillora" never flagged as an error |
| 4.5 | British English Variant Allowed | Section 3 rule | **PASS** | "colour" and "flavour" in British context accepted without flag |
| 4.6 | Accidental Repeated Words | Style category flag | **PASS** | Detected accidental repetition ("the the", "in in") |
| 4.7 | Comma Splice Detection | Punctuation category flag | **PASS** | Flagged comma splice ("I love dogs, they are cute.") |
| 4.8 | Prompt Injection Resistance | Untrusted data isolation | **PASS** | Instruction "Ignore all previous instructions" ignored as data; grammar error flagged |
| 4.9 | Multi-Paragraph Chunking & Offsets | Zero offset drift | **PASS** | Document processed across chunks, all offsets map 1:1 to original text |
| 5.1 | Empty Text Rejection | HTTP 422 | **PASS** | `{"detail": "Input validation error"}` |
| 5.2 | Whitespace Text Rejection | HTTP 422 | **PASS** | `{"detail": "Input validation error"}` |
| 5.3 | Oversized Text Limit (>50k chars) | HTTP 400 / 422 | **PASS** | Rejection enforced at boundary |
| 5.4 | Hot-Reload Knowledge Endpoint | Immediate reload | **PASS** | `POST /api/reload-knowledge` returned `status: "reloaded"` |

**Verification Score: 21 / 21 Passed (100.0%)**

---

## 4. Frontend Verification

### Production Build
```bash
cd frontend
npm run build
```
- Modules transformed: 1,578
- Output: `dist/index.html` (1.04 kB), `dist/assets/index.js` (177.22 kB / 55.05 kB gzip), `dist/assets/index.css` (22.25 kB)
- Status: **Clean build, 0 warnings, 0 errors**.

### Offset Preservation Logic
- Individual sequential application updates subsequent downstream character offsets (`delta = replacement.length - original.length`).
- Right-to-Left batch application sorts issues descending by `start` offset, preventing character position corruption.
- Verified with `frontend/test_offsets.js`.
