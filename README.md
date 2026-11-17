# Quillora AI 🪶

**Live Production Frontend:** [https://quillora-ai.vercel.app](https://quillora-ai.vercel.app)  
**Live Production Backend:** [https://quillora-ai.onrender.com](https://quillora-ai.onrender.com)  
**Interactive API Documentation:** [https://quillora-ai.onrender.com/docs](https://quillora-ai.onrender.com/docs)

Quillora AI is an intelligent English-writing assistant designed to help students, fiction writers, and professionals elevate their writing without losing their unique voice.

It offers two core features:
1. **Writing Checker** — Pinpoints spelling errors, grammatical mistakes, punctuation issues, sentence structure problems, and paragraph-level flow. Explains every issue in plain language and allows individual or batch correction.
2. **Word Enhancer** — Detects weak, vague, or repetitive words and suggests 3 ranked contextual alternatives tailored to a selected tone (*Neutral*, *Formal*, *Casual*, *Creative*, *Academic*, *Professional*).

---

## Key Highlights

- **Multi-Pass Writing Analysis**: Full paragraph-level contextual analysis, subject-verb agreement, irregular verb forms, cross-sentence tense consistency, pronoun case, comma splices, and dialogue punctuation.
- **Automated Model Failover**: Built-in failover from `openai/gpt-oss-20b` to `openai/gpt-oss-120b` and `qwen/qwen3.8-27b`, completely eliminating HTTP 429 token limit blocks.
- **Token-Optimized Prompting**: Minimal token footprint (~600 tokens) providing 5x higher throughput under standard provider quotas.
- **Interactive Side-by-Side Correction Preview**: Preview all detected changes side-by-side with visual diff badges (red strikethrough for removals, green for additions). Includes an issue stepper, individual accept/reject toggles, summary metrics, and offset-safe batch application.
- **ChatGPT-Style Writing History**: Collapsible document history sidebar organized chronologically into *Today*, *Yesterday*, *Previous 7 Days*, and *Older*. Features instant document search, auto-generated titles from first sentences, three-dot rename/delete menus, and localStorage autosave.
- **Demo Authentication & SaaS Onboarding**: Split-screen SaaS authentication with built-in evaluation credentials (`user` / `123`), quick one-click direct login, registration modal with local validation, and session persistence across page refreshes.
- **Accurate Global Offsets & Anchor Search**: Character offsets are calculated server-side, never trusted to the LLM. Highlights map 1:1 to original text, preventing hallucinated replacements and offset drifting.
- **Privacy First**: User text is never saved to a database or logged. Optional MongoDB stores only non-sensitive operational metadata (word counts, processing time).
- **In-Memory Caching & Performance**: Response caching with SHA256 hashing to eliminate redundant API requests.

---

## Production Deployment URLs

- **Frontend (Vercel)**: `https://quillora-ai.vercel.app`
- **Backend (Render)**: `https://quillora-ai.onrender.com`
- **API Health Check**: `https://quillora-ai.onrender.com/api/health`

---

## Quick Start (Local Development)

### 1. Start the Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
