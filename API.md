# Quillora AI — API Specification

**Production Backend:** `https://quillora-ai.onrender.com/api`  
**Production Web App:** `https://quillora-ai.vercel.app`  
**Local Development:** `http://localhost:8000/api`

---

## 1. Health Status

### `GET /api/health`

Returns application runtime status, knowledge base synchronization, and LLM configuration.

#### Response `200 OK`
```json
{
  "status": "ok",
  "version": "2.0.0",
  "knowledge_loaded": true,
  "knowledge_path": "/path/to/KNOWLEDGE.md",
  "knowledge_mtime": 1794891961.01,
  "groq_configured": true,
  "groq_model": "openai/gpt-oss-20b",
  "db_connected": false,
  "mock_mode": false
}
```

---

## 2. Writing Checker

### `POST /api/check`

Multi-pass grammatical, punctuation, spelling, and paragraph-level contextual analysis.

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
      "id": "iss-1",
      "category": "grammar",
      "error_type": "subject_verb_agreement",
      "original": "He go to school",
      "original_text": "He go to school",
      "suggestion": "He goes to school",
      "suggested_text": "He goes to school",
      "explanation": "The singular subject 'He' requires the verb form 'goes'.",
      "start": 0,
      "start_offset": 0,
      "end": 15,
      "end_offset": 15,
      "confidence": 0.98,
      "severity": "high",
      "is_optional": false
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
    "style_count": 0,
    "clarity_count": 0
  },
  "document_summary": {
    "total_words": 13,
    "total_characters": 72,
    "paragraph_count": 1,
    "sentence_count": 2
  },
  "analysis": {
    "grammar": [],
    "spelling": [],
    "punctuation": [],
    "clarity": [],
    "style": []
  },
  "paragraph_analysis": [
    {
      "paragraph_index": 0,
      "start_offset": 0,
      "end_offset": 72,
      "sentence_count": 2,
      "word_count": 13,
      "tense_consistency": "consistent",
      "clarity_score": 0.95,
      "feedback": "Paragraph structure is cohesive."
    }
  ],
  "overall_feedback": {
    "strengths": ["Clear narrative progression."],
    "improvements": ["Review subject-verb agreement."]
  }
}
```

---

## 3. Word Enhancer

### `POST /api/enhance`

Identifies weak, vague, or repetitive words and suggests 3 contextual alternatives according to target tone.

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
| `tone` | string | Yes | `"neutral"`, `"formal"`, `"casual"`, `"creative"`, `"academic"`, or `"professional"`. |

#### Response `200 OK`
```json
{
  "suggestions": [
    {
      "id": "enh-1",
      "original": "very tired",
      "alternatives": [
        "fatigued",
        "exhausted",
        "depleted"
      ],
      "explanation": "These alternatives express tiredness with greater precision.",
      "start": 42,
      "end": 52,
      "confidence": 0.92
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

Forces an immediate re-read of `KNOWLEDGE.md` from disk and clears the LLM cache.

#### Response `200 OK`
```json
{
  "status": "reloaded",
  "metadata": {
    "path": "embedded",
    "size_chars": 5600,
    "last_modified": 0.0,
    "protected_terms": ["quillora"],
    "is_loaded": true
  }
}
```
