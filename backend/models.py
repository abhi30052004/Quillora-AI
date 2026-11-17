"""
Quillora AI — Pydantic Request & Response Models

Preserves 100% backward compatibility with the frontend while providing
the extended multi-pass structured grammar, punctuation, and paragraph analysis schema.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


CategoryType = Literal["spelling", "grammar", "punctuation", "style", "clarity"]
SeverityType = Literal["low", "medium", "high"]
ToneType = Literal["neutral", "formal", "casual", "creative", "academic", "professional"]


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
    id: str = Field(default_factory=lambda: f"issue-{uuid.uuid4().hex[:8]}")
    category: CategoryType = Field(..., description="Error category")
    error_type: str = Field(default="general_grammar", description="Specific error classification")
    
    # Frontend legacy fields
    original: str = Field(..., description="Exact span containing the error")
    suggestion: str = Field(..., description="The corrected span only")
    start: int = Field(..., ge=0, description="0-based global start character offset in original text")
    end: int = Field(..., ge=0, description="0-based global end character offset in original text")
    
    # Extended structured fields
    original_text: Optional[str] = Field(None, description="Exact span containing the error (alias of original)")
    suggested_text: Optional[str] = Field(None, description="The corrected span only (alias of suggestion)")
    start_offset: Optional[int] = Field(None, ge=0, description="0-based global start character offset")
    end_offset: Optional[int] = Field(None, ge=0, description="0-based global end character offset")
    
    explanation: str = Field(..., description="Plain-language sentence explaining the correction")
    confidence: float = Field(0.95, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    severity: SeverityType = Field("high", description="Severity level: low, medium, or high")
    is_optional: bool = Field(False, description="Whether this is an optional stylistic recommendation")

    @model_validator(mode="after")
    def sync_aliases(self) -> IssueItem:
        if self.original_text is None:
            self.original_text = self.original
        if self.suggested_text is None:
            self.suggested_text = self.suggestion
        if self.start_offset is None:
            self.start_offset = self.start
        if self.end_offset is None:
            self.end_offset = self.end
        return self


class DocumentSummary(BaseModel):
    total_words: int = 0
    total_characters: int = 0
    paragraph_count: int = 0
    sentence_count: int = 0


class ParagraphAnalysisItem(BaseModel):
    paragraph_index: int
    start_offset: int
    end_offset: int
    sentence_count: int
    word_count: int
    tense_consistency: str = "consistent"
    clarity_score: float = 1.0
    feedback: str = ""


class OverallFeedback(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class AnalysisBreakdown(BaseModel):
    grammar: List[IssueItem] = Field(default_factory=list)
    spelling: List[IssueItem] = Field(default_factory=list)
    punctuation: List[IssueItem] = Field(default_factory=list)
    clarity: List[IssueItem] = Field(default_factory=list)
    style: List[IssueItem] = Field(default_factory=list)


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
    clarity_count: Optional[int] = None


class CheckResponse(BaseModel):
    # Preserves 100% frontend compatibility:
    issues: List[IssueItem]
    stats: StatsMetadata

    # Extended structured multi-pass output:
    document_summary: DocumentSummary
    analysis: AnalysisBreakdown
    paragraph_analysis: List[ParagraphAnalysisItem] = Field(default_factory=list)
    overall_feedback: OverallFeedback = Field(default_factory=OverallFeedback)


class EnhanceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="The English text to enhance")
    tone: ToneType = Field("neutral", description="Target tone: neutral, formal, casual, creative, academic, or professional")

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Input text cannot be empty or only whitespace")
        return v


class EnhanceItem(BaseModel):
    id: str = Field(default_factory=lambda: f"enhance-{uuid.uuid4().hex[:8]}")
    original: str = Field(..., description="Exact weak/vague/repetitive word or phrase in text")
    original_text: Optional[str] = None
    alternatives: List[str] = Field(..., min_length=1, max_length=3, description="Up to 3 ranked alternatives")
    explanation: str = Field(..., description="Explanation why alternatives improve the sentence")
    start: int = Field(..., ge=0, description="0-based global start character offset in original text")
    start_offset: Optional[int] = None
    end: int = Field(..., ge=0, description="0-based global end character offset in original text")
    end_offset: Optional[int] = None
    confidence: float = Field(0.92, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def sync_aliases(self) -> EnhanceItem:
        if self.original_text is None:
            self.original_text = self.original
        if self.start_offset is None:
            self.start_offset = self.start
        if self.end_offset is None:
            self.end_offset = self.end
        return self


class EnhanceResponse(BaseModel):
    suggestions: List[EnhanceItem]
    tone: ToneType
    stats: StatsMetadata
    document_summary: Optional[DocumentSummary] = None


class HealthResponse(BaseModel):
    status: str
    version: str = "2.0.0"
    knowledge_loaded: bool
    knowledge_path: str
    knowledge_mtime: float
    groq_configured: bool
    groq_model: str
    db_connected: bool
    mock_mode: bool
