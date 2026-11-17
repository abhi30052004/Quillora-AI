# Quillora AI — API Specification

Base URL: `http://localhost:8000/api`

---

## 1. Health Status

### `GET /api/health`

Returns application runtime status, knowledge base synchronization, and LLM configuration.

#### Response `200 OK`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "knowledge_loaded": true,
  "knowledge_path": "/path/to/KNOWLEDGE.md",
  "knowledge_mtime": 1794891961.01,
  "groq_configured": true,
  "groq_model": "llama-3.3-70b-versatile",
  "db_connected": false,
  "mock_mode": false
}
```

---

## 2. Writing Checker

### `POST /api/check`

Analyzes English text for spelling, grammar, punctuation, and style issues.

#### Request Body
```json
{
  "text": "He go to school every morning. I hope their going to recieve the parcel.",
  "english_variant": "American"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | 1 to 50,000 characters. Cannot be empty or whitespace. |
| `english_variant` | string | No | `"American"` (default) or `"British"`. |

#### Response `200 OK`
```json
{
  "issues": [
    {
      "original": "He go to school",
      "suggestion": "He goes to school",
      "category": "grammar",
      "explanation": "Use 'goes' because the subject 'He' is third-person singular.",
      "start": 0,
      "end": 15
    },
    {
      "original": "their going",
      "suggestion": "they're going",
      "category": "spelling",
      "explanation": "Use the contraction 'they're' for 'they are'.",
      "start": 38,
      "end": 49
    },
    {
      "original": "recieve",
      "suggestion": "receive",
      "category": "spelling",
      "explanation": "Remember the rule: 'i' before 'e' except after 'c'.",
      "start": 53,
      "end": 60
    }
  ],
  "stats": {
    "char_count": 72,
    "word_count": 13,
    "chunks": 1,
    "processing_time_ms": 142.5,
    "total_issues": 3,
    "spelling_count": 2,
    "grammar_count": 1,
    "punctuation_count": 0,
    "style_count": 0
  }
}
```

---

## 3. Word Enhancer

### `POST /api/enhance`

Identifies weak, vague, or repetitive words and suggests 3 contextual alternatives.

#### Request Body
```json
{
  "text": "After running a marathon, the athlete was very tired.",
  "tone": "formal"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | 1 to 50,000 characters. |
| `tone` | string | Yes | `"neutral"`, `"formal"`, `"casual"`, or `"creative"`. |

#### Response `200 OK`
```json
{
  "suggestions": [
    {
      "original": "very tired",
      "alternatives": [
        "fatigued",
        "exhausted",
        "depleted"
      ],
      "explanation": "These alternatives express tiredness with greater precision.",
      "start": 42,
      "end": 52
    }
  ],
  "tone": "formal",
  "stats": {
    "char_count": 53,
    "word_count": 8,
    "chunks": 1,
    "processing_time_ms": 98.4,
    "total_issues": 1
  }
}
```

---

## 4. Hot-Reload Knowledge Base

### `POST /api/reload-knowledge`

Forces an immediate re-read of `KNOWLEDGE.md` from disk without restarting the server.

#### Response `200 OK`
```json
{
  "status": "reloaded",
  "metadata": {
    "path": "/path/to/KNOWLEDGE.md",
    "size_chars": 5600,
    "last_modified": 1794892000.0,
    "protected_terms": ["quillora"],
    "is_loaded": true
  }
}
```

---

## 5. Error Responses

- `400 Bad Request`: Text length exceeds limit (50,000 characters).
- `422 Unprocessable Content`: Empty or whitespace-only text or missing required fields.
- `500 Internal Server Error`: `KNOWLEDGE.md` missing/unreadable or unhandled LLM service error.
