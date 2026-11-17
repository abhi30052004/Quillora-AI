"""
Quillora AI — Groq LLM Client & Mock Fallback Engine

Handles:
- Async Groq API requests with timeout and exponential backoff retry.
- JSON mode enforcement with resilient parsing and markdown fence stripping.
- Deterministic mock engine for offline tests and development when GROQ_API_KEY is not set.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional
from groq import AsyncGroq, APIConnectionError, RateLimitError, APIStatusError

try:
    from backend.config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("quillora.llm")


def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Safely parse JSON response from LLM, stripping markdown fences or trailing commas.
    """
    text = raw_text.strip()

    # Strip markdown code blocks ```json ... ``` or ``` ... ```
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Attempt direct json.loads
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Attempt regex extraction of outer JSON object { ... }
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    logger.warning("Failed to parse LLM JSON response: %s", raw_text[:200])
    return {}


class LLMClient:
    def __init__(self):
        self._groq_client: Optional[AsyncGroq] = None

    def _get_client(self) -> AsyncGroq:
        if self._groq_client is None:
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY is not configured")
            self._groq_client = AsyncGroq(
                api_key=settings.GROQ_API_KEY,
                timeout=settings.GROQ_TIMEOUT_SECONDS,
            )
        return self._groq_client

    async def call_groq(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Calls Groq API with retries and exponential backoff."""
        client = self._get_client()
        retries = settings.GROQ_MAX_RETRIES
        delay = 1.0

        for attempt in range(1, retries + 1):
            try:
                response = await client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=settings.GROQ_TEMPERATURE,
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content or "{}"
                return clean_and_parse_json(content)

            except RateLimitError as e:
                logger.warning("Groq rate limit hit (attempt %d/%d): %s", attempt, retries, e)
                if attempt == retries:
                    raise
                await asyncio.sleep(delay)
                delay *= 2.0

            except (APIConnectionError, APIStatusError) as e:
                logger.warning("Groq API error (attempt %d/%d): %s", attempt, retries, e)
                if attempt == retries:
                    raise
                await asyncio.sleep(delay)
                delay *= 1.5

            except Exception as e:
                logger.error("Unexpected error during Groq call: %s", e)
                raise

        return {}

    async def mock_checker(self, text: str) -> Dict[str, Any]:
        """
        Deterministic mock checker for testing and offline development.
        Identifies common grammar, spelling, and punctuation errors.
        """
        issues = []

        rules = [
            ("He go to school", "He goes to school", "grammar", "Use 'goes' because the subject 'He' is third-person singular."),
            ("He go", "He goes", "grammar", "Use 'goes' because the subject is singular."),
            ("recieve", "receive", "spelling", "Remember the rule: 'i' before 'e' except after 'c'."),
            ("seperate", "separate", "spelling", "Spell with an 'a' after the 'p': 'separate'."),
            ("their going", "they're going", "spelling", "Use the contraction 'they're' for 'they are'."),
            ("your right", "you're right", "spelling", "Use 'you're' as the contraction for 'you are'."),
            ("its a nice day", "it's a nice day", "punctuation", "Use the apostrophe in 'it's' for 'it is'."),
            ("I love dogs, they are cute.", "I love dogs; they are cute.", "punctuation", "Avoid comma splices by using a semicolon or a coordinating conjunction."),
            ("the the", "the", "style", "Remove the accidental repeated word."),
            ("a apple", "an apple", "grammar", "Use 'an' before words starting with a vowel sound."),
            ("between you and I", "between you and me", "grammar", "Use the objective pronoun 'me' following a preposition."),
        ]

        for orig, sugg, cat, exp in rules:
            if orig in text:
                issues.append({
                    "original": orig,
                    "suggestion": sugg,
                    "category": cat,
                    "explanation": exp,
                })

        return {"issues": issues}

    async def mock_enhancer(self, text: str, tone: str) -> Dict[str, Any]:
        """
        Deterministic mock enhancer for testing and offline development.
        Suggests 3 alternatives according to selected tone.
        """
        suggestions = []

        enhancements = {
            "very tired": {
                "neutral": ["exhausted", "worn out", "fatigued"],
                "formal": ["fatigued", "exhausted", "depleted"],
                "casual": ["wiped out", "beat", "drained"],
                "creative": ["bone-weary", "spent", "hollow with exhaustion"],
                "exp": "These alternatives express tiredness with greater precision.",
            },
            "very happy": {
                "neutral": ["delighted", "thrilled", "overjoyed"],
                "formal": ["gratified", "pleased", "delighted"],
                "casual": ["stoked", "thrilled", "pumped"],
                "creative": ["radiant", "exuberant", "walking on air"],
                "exp": "These alternatives convey happiness more vividly.",
            },
            "good": {
                "neutral": ["excellent", "effective", "valuable"],
                "formal": ["exemplary", "commendable", "superior"],
                "casual": ["great", "awesome", "solid"],
                "creative": ["splendid", "superb", "exceptional"],
                "exp": "These words offer stronger, more descriptive quality.",
            },
            "bad": {
                "neutral": ["poor", "negative", "substandard"],
                "formal": ["detrimental", "unfavorable", "deficient"],
                "casual": ["lousy", "terrible", "awful"],
                "creative": ["dismal", "wretched", "atrocious"],
                "exp": "These alternatives provide clearer descriptive impact.",
            },
            "big": {
                "neutral": ["large", "substantial", "significant"],
                "formal": ["substantial", "considerable", "extensive"],
                "casual": ["huge", "massive", "giant"],
                "creative": ["colossal", "towering", "monumental"],
                "exp": "These terms evoke scale more specifically.",
            },
            "said": {
                "neutral": ["stated", "replied", "remarked"],
                "formal": ["declared", "asserted", "indicated"],
                "casual": ["mentioned", "added", "chatted"],
                "creative": ["whispered", "murmured", "breathed"],
                "exp": "Contextual speech verbs bring dialogue to life.",
            },
        }

        tone_key = tone.lower() if tone.lower() in ("neutral", "formal", "casual", "creative") else "neutral"

        for target, data in enhancements.items():
            pattern = rf"\b{re.escape(target)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                # Locate exact case in text
                m = re.search(pattern, text, re.IGNORECASE)
                matched_orig = m.group(0) if m else target
                alts = data.get(tone_key, data["neutral"])
                suggestions.append({
                    "original": matched_orig,
                    "alternatives": alts[:3],
                    "explanation": data["exp"],
                })

        return {"suggestions": suggestions}

    async def execute_checker(self, system_prompt: str, user_prompt: str, raw_chunk_text: str) -> Dict[str, Any]:
        """Runs Writing Checker via Groq if key present, else mock."""
        use_mock = settings.MOCK_LLM or not settings.GROQ_API_KEY.strip()
        if use_mock:
            return await self.mock_checker(raw_chunk_text)
        return await self.call_groq(system_prompt, user_prompt)

    async def execute_enhancer(self, system_prompt: str, user_prompt: str, raw_chunk_text: str, tone: str) -> Dict[str, Any]:
        """Runs Word Enhancer via Groq if key present, else mock."""
        use_mock = settings.MOCK_LLM or not settings.GROQ_API_KEY.strip()
        if use_mock:
            return await self.mock_enhancer(raw_chunk_text, tone)
        return await self.call_groq(system_prompt, user_prompt)


llm_client = LLMClient()
