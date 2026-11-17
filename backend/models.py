"""
Quillora AI — Pydantic Request & Response Models
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


CategoryType = Literal["spelling", "grammar", "punctuation", "style"]
ToneType = Literal["neutral", "formal", "casual", "creative"]


class CheckRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="The English text to check")
    english_variant: Optional[str] = Field("American", description="American or British")

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Input text cannot be empty or only whitespace")
        return v


class IssueItem(BaseModel):
    original: str = Field(..., description="Exact span containing the error")
    suggestion: str = Field(..., description="The corrected span only")
    category: CategoryType = Field(..., description="Error category")
    explanation: str = Field(..., description="One short sentence explaining the correction")
    start: int = Field(..., ge=0, description="0-based global start character offset in original text")
    end: int = Field(..., ge=0, description="0-based global end character offset in original text")


class StatsMetadata(BaseModel):
    char_count: int
    word_count: int
    chunks: int
    processing_time_ms: float
    total_issues: Optional[int] = None
    spelling_count: Optional[int] = None
    grammar_count: Optional[int] = None
    punctuation_count: Optional[int] = None
    style_count: Optional[int] = None


class CheckResponse(BaseModel):
    issues: List[IssueItem]
    stats: StatsMetadata


class EnhanceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="The English text to enhance")
    tone: ToneType = Field("neutral", description="Target tone: neutral, formal, casual, or creative")

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Input text cannot be empty or only whitespace")
        return v


class EnhanceItem(BaseModel):
    original: str = Field(..., description="Exact weak/vague/repetitive word or phrase in text")
    alternatives: List[str] = Field(..., min_length=1, max_length=3, description="Up to 3 ranked alternatives")
    explanation: str = Field(..., description="One short sentence explaining why alternatives improve sentence")
    start: int = Field(..., ge=0, description="0-based global start character offset in original text")
    end: int = Field(..., ge=0, description="0-based global end character offset in original text")


class EnhanceResponse(BaseModel):
    suggestions: List[EnhanceItem]
    tone: ToneType
    stats: StatsMetadata


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    knowledge_loaded: bool
    knowledge_path: str
    knowledge_mtime: float
    groq_configured: bool
    groq_model: str
    db_connected: bool
    mock_mode: bool
