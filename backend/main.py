"""
Quillora AI — FastAPI Application Server (Advanced Multi-Pass Writing Engine)

Exposes:
- GET  /api/health
- POST /api/check
- POST /api/enhance
- POST /api/reload-knowledge
"""

from __future__ import annotations

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List

# Ensure project root and backend dir are in sys.path
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from backend.config import settings
    from backend.db import db_manager
    from backend.knowledge import KnowledgeBaseError, knowledge_manager
    from backend.llm import llm_client
    from backend.models import (
        AnalysisBreakdown,
        CheckRequest,
        CheckResponse,
        DocumentSummary,
        EnhanceItem,
        EnhanceRequest,
        EnhanceResponse,
        HealthResponse,
        IssueItem,
        OverallFeedback,
        ParagraphAnalysisItem,
        StatsMetadata,
    )
    from backend.prompts import (
        build_checker_system_prompt,
        build_enhancer_system_prompt,
        build_user_prompt,
    )
    from backend.text_processing import (
        analyze_document_structure,
        create_context_batches,
        find_exact_offsets,
        validate_and_filter_issues,
    )
except ImportError:
    from config import settings
    from db import db_manager
    from knowledge import KnowledgeBaseError, knowledge_manager
    from llm import llm_client
    from models import (
        AnalysisBreakdown,
        CheckRequest,
        CheckResponse,
        DocumentSummary,
        EnhanceItem,
        EnhanceRequest,
        EnhanceResponse,
        HealthResponse,
        IssueItem,
        OverallFeedback,
        ParagraphAnalysisItem,
        StatsMetadata,
    )
    from prompts import (
        build_checker_system_prompt,
        build_enhancer_system_prompt,
        build_user_prompt,
    )
    from text_processing import (
        analyze_document_structure,
        create_context_batches,
        find_exact_offsets,
        validate_and_filter_issues,
    )

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("quillora.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load authoritative knowledge base and connect DB
    try:
        knowledge_manager.load()
        logger.info("Knowledge base initialized successfully.")
    except Exception as e:
        logger.critical("Failed to load knowledge base on startup: %s", e)
        raise

    await db_manager.connect()
    yield
    # Shutdown
    await db_manager.disconnect()


app = FastAPI(
    title="Quillora AI API",
    description="Advanced English grammar, punctuation, and paragraph-level writing intelligence engine.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS setup
cors_origins = list(settings.CORS_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Input validation error", "errors": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(KnowledgeBaseError)
async def knowledge_exception_handler(request: Request, exc: KnowledgeBaseError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Knowledge base error: {str(exc)}"},
    )


@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    """Returns application health and configuration status."""
    try:
        meta = knowledge_manager.get_metadata()
        knowledge_loaded = meta.get("is_loaded", False)
        knowledge_path = meta.get("path", "")
        knowledge_mtime = meta.get("last_modified", 0.0)
    except Exception:
        knowledge_loaded = False
        knowledge_path = ""
        knowledge_mtime = 0.0

    groq_configured = bool(settings.GROQ_API_KEY.strip())
    mock_mode = settings.MOCK_LLM or not groq_configured

    return HealthResponse(
        status="ok",
        version="2.0.0",
        knowledge_loaded=knowledge_loaded,
        knowledge_path=knowledge_path,
        knowledge_mtime=knowledge_mtime,
        groq_configured=groq_configured,
        groq_model=settings.GROQ_MODEL,
        db_connected=db_manager.is_connected(),
        mock_mode=mock_mode,
    )


@app.post("/api/reload-knowledge")
async def reload_knowledge():
    """Forces reloading KNOWLEDGE.md from disk and clears the LLM cache."""
    try:
        knowledge_manager.load(force=True)
        llm_client._cache.clear()
        meta = knowledge_manager.get_metadata()
        return {"status": "reloaded", "metadata": meta}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reload knowledge base: {e}",
        )


@app.post("/api/check", response_model=CheckResponse)
async def check_writing(req: CheckRequest):
    """
    Writing Checker:
    Multi-pass grammatical, punctuation, spelling, and paragraph-level contextual analysis.
    - Stage 1: Document structural analysis without destroying original text.
    - Stage 2 & 3: Granular grammar and punctuation detection.
    - Stage 4: Paragraph-level context retention with sliding context windows.
    - Stage 5: AI correction generation with confidence scores and error taxonomy.
    - Stage 6: Anchor-based offset resolution, false-positive suppression, and overlap resolution.
    """
    start_time = time.perf_counter()
    text = req.text
    char_count = len(text)

    if char_count > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text length exceeds maximum allowed limit of {settings.MAX_TEXT_LENGTH} characters.",
        )

    # Stage 1: Preprocessing & Document Analysis
    metrics = analyze_document_structure(text)

    # Stage 4: Paragraph-aware chunking with sliding surrounding context
    chunks = create_context_batches(text, metrics, target_chunk_size=settings.CHUNK_SIZE)
    system_prompt = build_checker_system_prompt(req.english_variant)
    semaphore = asyncio.Semaphore(settings.CHUNK_CONCURRENCY)

    raw_candidates: List[Dict[str, Any]] = []
    collected_para_analyses: List[Dict[str, Any]] = []
    all_strengths: List[str] = []
    all_improvements: List[str] = []
    protected_terms = knowledge_manager.get_protected_terms()

    async def process_chunk(chunk):
        async with semaphore:
            user_prompt = build_user_prompt(
                active_text=chunk.active_text,
                preceding_context=chunk.preceding_context,
                following_context=chunk.following_context,
            )
            try:
                res = await llm_client.execute_checker(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    raw_chunk_text=chunk.active_text,
                    english_variant=req.english_variant or "American",
                )

                issues = res.get("issues", [])
                for iss in issues:
                    orig = iss.get("original", "").strip()
                    sugg = iss.get("suggestion", "").strip()
                    cat = iss.get("category", "grammar").lower()
                    err_type = iss.get("error_type", "general_grammar")
                    exp = iss.get("explanation", "")
                    conf = float(iss.get("confidence", 0.95))
                    sev = iss.get("severity", "high").lower()
                    if sev not in ("low", "medium", "high"):
                        sev = "high"
                    is_opt = bool(iss.get("is_optional", False))

                    if not orig or not sugg:
                        continue

                    offsets = find_exact_offsets(
                        full_text=text,
                        original_phrase=orig,
                        search_start=chunk.global_start,
                        search_end=chunk.global_end,
                    )
                    if offsets is None:
                        offsets = find_exact_offsets(
                            full_text=text,
                            original_phrase=orig,
                            search_start=0,
                            search_end=len(text),
                        )

                    if offsets is not None:
                        start_offset, end_offset = offsets
                        raw_candidates.append({
                            "id": iss.get("id"),
                            "original": text[start_offset:end_offset],
                            "suggestion": sugg,
                            "category": cat,
                            "error_type": err_type,
                            "explanation": exp,
                            "start": start_offset,
                            "end": end_offset,
                            "confidence": conf,
                            "severity": sev,
                            "is_optional": is_opt,
                        })

                for p_analysis in res.get("paragraph_analysis", []):
                    collected_para_analyses.append(p_analysis)

                feedback = res.get("overall_feedback", {})
                for st in feedback.get("strengths", []):
                    if st not in all_strengths:
                        all_strengths.append(st)
                for imp in feedback.get("improvements", []):
                    if imp not in all_improvements:
                        all_improvements.append(imp)

            except Exception as e:
                logger.error("Error processing chunk %d: %s", chunk.chunk_index, e)

    await asyncio.gather(*(process_chunk(c) for c in chunks))

    # Stage 6: Validation, deduplication, and overlap resolution
    final_items_data = validate_and_filter_issues(
        candidates=raw_candidates,
        full_text=text,
        protected_terms=protected_terms,
        min_confidence=0.70,
    )

    issue_items = [IssueItem(**item) for item in final_items_data]

    breakdown = AnalysisBreakdown(
        grammar=[i for i in issue_items if i.category == "grammar"],
        spelling=[i for i in issue_items if i.category == "spelling"],
        punctuation=[i for i in issue_items if i.category == "punctuation"],
        clarity=[i for i in issue_items if i.category == "clarity"],
        style=[i for i in issue_items if i.category == "style"],
    )

    doc_summary = DocumentSummary(
        total_words=metrics.total_words,
        total_characters=metrics.total_characters,
        paragraph_count=metrics.paragraph_count,
        sentence_count=metrics.sentence_count,
    )

    paragraph_items: List[ParagraphAnalysisItem] = []
    for idx, p_info in enumerate(metrics.paragraphs):
        p_res = next(
            (pa for pa in collected_para_analyses if pa.get("paragraph_index") == idx),
            None
        )
        tense_val = p_res.get("tense_consistency", "consistent") if p_res else "consistent"
        clarity_val = float(p_res.get("clarity_score", 0.95)) if p_res else 0.95
        feedback_val = (
            p_res.get("feedback", "Paragraph structure is cohesive and clear.")
            if p_res
            else "Paragraph structure is cohesive and clear."
        )

        p_words = len(p_info.text.split())
        paragraph_items.append(
            ParagraphAnalysisItem(
                paragraph_index=idx,
                start_offset=p_info.global_start,
                end_offset=p_info.global_end,
                sentence_count=len(p_info.sentences),
                word_count=p_words,
                tense_consistency=tense_val,
                clarity_score=clarity_val,
                feedback=feedback_val,
            )
        )

    if not all_strengths:
        all_strengths = ["Writing exhibits solid core vocabulary and clear progression."]
    if not all_improvements and issue_items:
        all_improvements = ["Review highlighted grammar and punctuation suggestions to enhance precision."]

    overall_feedback = OverallFeedback(
        strengths=all_strengths,
        improvements=all_improvements,
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    stats = StatsMetadata(
        char_count=metrics.total_characters,
        word_count=metrics.total_words,
        chunks=len(chunks),
        processing_time_ms=elapsed_ms,
        total_issues=len(issue_items),
        spelling_count=len(breakdown.spelling),
        grammar_count=len(breakdown.grammar),
        punctuation_count=len(breakdown.punctuation),
        style_count=len(breakdown.style),
        clarity_count=len(breakdown.clarity),
    )

    # Privacy-first telemetry logging
    asyncio.create_task(
        db_manager.log_metadata(
            event_type="check",
            char_count=metrics.total_characters,
            word_count=metrics.total_words,
            issue_count=len(issue_items),
            duration_ms=elapsed_ms,
        )
    )

    return CheckResponse(
        issues=issue_items,
        stats=stats,
        document_summary=doc_summary,
        analysis=breakdown,
        paragraph_analysis=paragraph_items,
        overall_feedback=overall_feedback,
    )


@app.post("/api/enhance", response_model=EnhanceResponse)
async def enhance_words(req: EnhanceRequest):
    """
    Word Enhancer:
    Finds weak, vague, or repetitive words and suggests 3 contextual alternatives.
    Preserves author's voice, matches selected tone, and preserves dialogue.
    """
    start_time = time.perf_counter()
    text = req.text
    char_count = len(text)

    if char_count > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text length exceeds maximum allowed limit of {settings.MAX_TEXT_LENGTH} characters.",
        )

    metrics = analyze_document_structure(text)
    chunks = create_context_batches(text, metrics, target_chunk_size=settings.CHUNK_SIZE)
    system_prompt = build_enhancer_system_prompt(req.tone)
    semaphore = asyncio.Semaphore(settings.CHUNK_CONCURRENCY)

    raw_candidates: List[Dict[str, Any]] = []
    protected_terms = knowledge_manager.get_protected_terms()

    async def process_chunk(chunk):
        async with semaphore:
            user_prompt = build_user_prompt(
                active_text=chunk.active_text,
                preceding_context=chunk.preceding_context,
                following_context=chunk.following_context,
            )
            try:
                res = await llm_client.execute_enhancer(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    raw_chunk_text=chunk.active_text,
                    tone=req.tone,
                )
                suggestions = res.get("suggestions", [])
                for sugg in suggestions:
                    orig = sugg.get("original", "").strip()
                    alts = sugg.get("alternatives", [])
                    exp = sugg.get("explanation", "")

                    if not orig or not alts or not isinstance(alts, list):
                        continue

                    clean_alts = [str(a).strip() for a in alts if str(a).strip()][:3]
                    if not clean_alts:
                        continue

                    offsets = find_exact_offsets(
                        full_text=text,
                        original_phrase=orig,
                        search_start=chunk.global_start,
                        search_end=chunk.global_end,
                    )
                    if offsets is None:
                        offsets = find_exact_offsets(
                            full_text=text,
                            original_phrase=orig,
                            search_start=0,
                            search_end=len(text),
                        )

                    if offsets is not None:
                        start_offset, end_offset = offsets
                        raw_candidates.append({
                            "original": text[start_offset:end_offset],
                            "alternatives": clean_alts,
                            "explanation": exp,
                            "start": start_offset,
                            "end": end_offset,
                            "confidence": 0.92,
                            "category": "style",
                        })
            except Exception as e:
                logger.error("Error processing enhance chunk %d: %s", chunk.chunk_index, e)

    await asyncio.gather(*(process_chunk(c) for c in chunks))

    final_items_data = validate_and_filter_issues(
        candidates=raw_candidates,
        full_text=text,
        protected_terms=protected_terms,
        min_confidence=0.70,
    )

    enhancement_items = [
        EnhanceItem(
            original=item["original"],
            alternatives=item["alternatives"],
            explanation=item["explanation"],
            start=item["start"],
            end=item["end"],
            confidence=item.get("confidence", 0.92),
        )
        for item in final_items_data
    ]

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    stats = StatsMetadata(
        char_count=metrics.total_characters,
        word_count=metrics.total_words,
        chunks=len(chunks),
        processing_time_ms=elapsed_ms,
        total_issues=len(enhancement_items),
    )

    doc_summary = DocumentSummary(
        total_words=metrics.total_words,
        total_characters=metrics.total_characters,
        paragraph_count=metrics.paragraph_count,
        sentence_count=metrics.sentence_count,
    )

    asyncio.create_task(
        db_manager.log_metadata(
            event_type="enhance",
            char_count=metrics.total_characters,
            word_count=metrics.total_words,
            issue_count=len(enhancement_items),
            duration_ms=elapsed_ms,
        )
    )

    return EnhanceResponse(
        suggestions=enhancement_items,
        tone=req.tone,
        stats=stats,
        document_summary=doc_summary,
    )
