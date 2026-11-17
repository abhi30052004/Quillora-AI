"""
Quillora AI — FastAPI Application Server

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

# Ensure project root and backend dir are in sys.path so running from root or backend/ works
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
        CheckRequest,
        CheckResponse,
        EnhanceItem,
        EnhanceRequest,
        EnhanceResponse,
        HealthResponse,
        IssueItem,
        StatsMetadata,
    )
    from backend.prompts import (
        build_checker_system_prompt,
        build_enhancer_system_prompt,
        build_user_prompt,
    )
    from backend.text_processing import (
        find_exact_offsets,
        resolve_and_deduplicate_spans,
        split_into_chunks,
    )
except ImportError:
    from config import settings
    from db import db_manager
    from knowledge import KnowledgeBaseError, knowledge_manager
    from llm import llm_client
    from models import (
        CheckRequest,
        CheckResponse,
        EnhanceItem,
        EnhanceRequest,
        EnhanceResponse,
        HealthResponse,
        IssueItem,
        StatsMetadata,
    )
    from prompts import (
        build_checker_system_prompt,
        build_enhancer_system_prompt,
        build_user_prompt,
    )
    from text_processing import (
        find_exact_offsets,
        resolve_and_deduplicate_spans,
        split_into_chunks,
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
    description="Production-ready English-writing assistant powered by authoritative knowledge injection.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
        version="1.0.0",
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
    """Forces reloading KNOWLEDGE.md from disk."""
    try:
        knowledge_manager.load(force=True)
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
    Analyzes English text for spelling, grammar, punctuation, and style issues.
    Injects authoritative KNOWLEDGE.md into system prompt.
    Splits long text into parallel chunks and calculates verified global character offsets.
    """
    start_time = time.perf_counter()
    text = req.text
    char_count = len(text)
    words = text.split()
    word_count = len(words)

    if char_count > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text length exceeds maximum allowed limit of {settings.MAX_TEXT_LENGTH} characters.",
        )

    chunks = split_into_chunks(text, target_chunk_size=settings.CHUNK_SIZE)
    system_prompt = build_checker_system_prompt(req.english_variant)
    semaphore = asyncio.Semaphore(settings.CHUNK_CONCURRENCY)

    raw_candidates: List[Dict[str, Any]] = []
    protected_terms = knowledge_manager.get_protected_terms()

    async def process_chunk(chunk):
        async with semaphore:
            user_prompt = build_user_prompt(chunk.text)
            try:
                res = await llm_client.execute_checker(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    raw_chunk_text=chunk.text,
                )
                issues = res.get("issues", [])
                for iss in issues:
                    orig = iss.get("original", "").strip()
                    sugg = iss.get("suggestion", "").strip()
                    cat = iss.get("category", "grammar").lower()
                    exp = iss.get("explanation", "")

                    if not orig or not sugg:
                        continue

                    # Validate category
                    if cat not in ("spelling", "grammar", "punctuation", "style"):
                        cat = "grammar"

                    # Locate exact span in full text, preferring chunk boundaries first
                    offsets = find_exact_offsets(
                        full_text=text,
                        original_phrase=orig,
                        search_start=chunk.global_start,
                        search_end=chunk.global_end,
                    )
                    # If not found within chunk boundaries, search whole document
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
                            "suggestion": sugg,
                            "category": cat,
                            "explanation": exp,
                            "start": start_offset,
                            "end": end_offset,
                        })
            except Exception as e:
                logger.error("Error processing chunk %d: %s", chunk.chunk_index, e)

    await asyncio.gather(*(process_chunk(c) for c in chunks))

    # Resolve overlaps, filter protected terms, and deduplicate
    final_items_data = resolve_and_deduplicate_spans(
        items=raw_candidates,
        text=text,
        protected_terms=protected_terms,
    )

    issue_items = [IssueItem(**item) for item in final_items_data]

    # Category breakdown
    spelling_cnt = sum(1 for i in issue_items if i.category == "spelling")
    grammar_cnt = sum(1 for i in issue_items if i.category == "grammar")
    punct_cnt = sum(1 for i in issue_items if i.category == "punctuation")
    style_cnt = sum(1 for i in issue_items if i.category == "style")

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    stats = StatsMetadata(
        char_count=char_count,
        word_count=word_count,
        chunks=len(chunks),
        processing_time_ms=elapsed_ms,
        total_issues=len(issue_items),
        spelling_count=spelling_cnt,
        grammar_count=grammar_cnt,
        punctuation_count=punct_cnt,
        style_count=style_cnt,
    )

    # Privacy-first logging: log metadata only, no text!
    asyncio.create_task(
        db_manager.log_metadata(
            event_type="check",
            char_count=char_count,
            word_count=word_count,
            issue_count=len(issue_items),
            duration_ms=elapsed_ms,
        )
    )

    return CheckResponse(issues=issue_items, stats=stats)


@app.post("/api/enhance", response_model=EnhanceResponse)
async def enhance_words(req: EnhanceRequest):
    """
    Word Enhancer:
    Finds weak, vague, or repetitive words and suggests 3 contextual alternatives.
    Injects authoritative KNOWLEDGE.md into system prompt and matches selected tone.
    """
    start_time = time.perf_counter()
    text = req.text
    char_count = len(text)
    words = text.split()
    word_count = len(words)

    if char_count > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text length exceeds maximum allowed limit of {settings.MAX_TEXT_LENGTH} characters.",
        )

    chunks = split_into_chunks(text, target_chunk_size=settings.CHUNK_SIZE)
    system_prompt = build_enhancer_system_prompt(req.tone)
    semaphore = asyncio.Semaphore(settings.CHUNK_CONCURRENCY)

    raw_candidates: List[Dict[str, Any]] = []
    protected_terms = knowledge_manager.get_protected_terms()

    async def process_chunk(chunk):
        async with semaphore:
            user_prompt = build_user_prompt(chunk.text)
            try:
                res = await llm_client.execute_enhancer(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    raw_chunk_text=chunk.text,
                    tone=req.tone,
                )
                suggestions = res.get("suggestions", [])
                for sugg in suggestions:
                    orig = sugg.get("original", "").strip()
                    alts = sugg.get("alternatives", [])
                    exp = sugg.get("explanation", "")

                    if not orig or not alts or not isinstance(alts, list):
                        continue

                    # Filter to exactly 3 strings
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
                        })
            except Exception as e:
                logger.error("Error processing enhance chunk %d: %s", chunk.chunk_index, e)

    await asyncio.gather(*(process_chunk(c) for c in chunks))

    final_items_data = resolve_and_deduplicate_spans(
        items=raw_candidates,
        text=text,
        protected_terms=protected_terms,
    )

    enhancement_items = [EnhanceItem(**item) for item in final_items_data]

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    stats = StatsMetadata(
        char_count=char_count,
        word_count=word_count,
        chunks=len(chunks),
        processing_time_ms=elapsed_ms,
        total_issues=len(enhancement_items),
    )

    asyncio.create_task(
        db_manager.log_metadata(
            event_type="enhance",
            char_count=char_count,
            word_count=word_count,
            issue_count=len(enhancement_items),
            duration_ms=elapsed_ms,
        )
    )

    return EnhanceResponse(suggestions=enhancement_items, tone=req.tone, stats=stats)
