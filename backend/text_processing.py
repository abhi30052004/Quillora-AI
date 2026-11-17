"""
Quillora AI — Advanced Text Processing, Context-Aware Chunking, and Linguistic Validation

Stages Implemented:
- Stage 1: Non-destructive text preprocessing, structural paragraph & sentence boundary detection,
  quotation/dialogue detection, document metric computation.
- Stage 4: Paragraph-level contextual batching with sliding context windows.
- Stage 6: Anchor-based offset resolution, false-positive suppression, overlap resolution,
  confidence-based filtering, and linguistic integrity validation.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple


@dataclass
class ParagraphInfo:
    index: int
    text: str
    global_start: int
    global_end: int
    sentences: List[Tuple[int, int, str]]
    is_dialogue: bool = False


@dataclass
class DocumentMetrics:
    total_words: int
    total_characters: int
    paragraph_count: int
    sentence_count: int
    paragraphs: List[ParagraphInfo] = field(default_factory=list)


@dataclass
class ContextChunk:
    chunk_index: int
    active_text: str
    global_start: int
    global_end: int
    preceding_context: str = ""
    following_context: str = ""
    paragraph_indices: List[int] = field(default_factory=list)


ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "e.g", "i.e",
    "inc", "ltd", "co", "corp", "dept", "univ", "fig", "al", "jan", "feb",
    "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"
}


def split_sentences_with_offsets(paragraph_text: str, para_start_offset: int) -> List[Tuple[int, int, str]]:
    """
    Splits a paragraph into sentences while preserving exact character offsets
    and honoring abbreviations and quotation boundaries.
    """
    if not paragraph_text.strip():
        return []

    sentences: List[Tuple[int, int, str]] = []
    pattern = re.compile(r'([.!?]+["\'”’]?)\s+')
    
    current_start = 0
    text_len = len(paragraph_text)

    for match in pattern.finditer(paragraph_text):
        punct_end = match.end(1)
        raw_token = paragraph_text[current_start:punct_end].strip()
        
        words = re.findall(r'[A-Za-z]+', raw_token)
        if words:
            last_word = words[-1].lower()
            if last_word in ABBREVIATIONS and punct_end < text_len and paragraph_text[match.end():match.end()+1].islower():
                continue

        end_pos = match.end()
        sent_slice = paragraph_text[current_start:end_pos]
        clean_len = len(sent_slice.rstrip())
        sentences.append((
            para_start_offset + current_start,
            para_start_offset + current_start + clean_len,
            sent_slice[:clean_len]
        ))
        current_start = end_pos

    if current_start < text_len:
        remainder = paragraph_text[current_start:]
        if remainder.strip():
            clean_len = len(remainder.rstrip())
            sentences.append((
                para_start_offset + current_start,
                para_start_offset + current_start + clean_len,
                remainder[:clean_len]
            ))

    return sentences


def analyze_document_structure(text: str) -> DocumentMetrics:
    """
    Stage 1: Preprocessing & Document Analysis.
    Never mutates or destroys the original text.
    Extracts paragraphs, sentences, dialogue markers, and document metrics.
    """
    total_characters = len(text)
    words = re.findall(r"\b[\w'-]+\b", text)
    total_words = len(words)

    if not text.strip():
        return DocumentMetrics(
            total_words=0,
            total_characters=total_characters,
            paragraph_count=0,
            sentence_count=0,
            paragraphs=[]
        )

    paragraphs: List[ParagraphInfo] = []
    para_pattern = re.compile(r'([^\r\n]+(?:\r?\n(?!\r?\n)[^\r\n]+)*)', re.UNICODE)
    
    para_idx = 0
    total_sentences = 0

    for m in para_pattern.finditer(text):
        p_text = m.group(0)
        p_start = m.start()
        p_end = m.end()

        has_dialogue = bool(re.search(r'["“][^"”]+["”]', p_text))
        sentences = split_sentences_with_offsets(p_text, p_start)
        total_sentences += len(sentences)

        paragraphs.append(
            ParagraphInfo(
                index=para_idx,
                text=p_text,
                global_start=p_start,
                global_end=p_end,
                sentences=sentences,
                is_dialogue=has_dialogue
            )
        )
        para_idx += 1

    return DocumentMetrics(
        total_words=total_words,
        total_characters=total_characters,
        paragraph_count=len(paragraphs),
        sentence_count=total_sentences,
        paragraphs=paragraphs
    )


def create_context_batches(
    text: str,
    metrics: DocumentMetrics,
    target_chunk_size: int = 2200
) -> List[ContextChunk]:
    """
    Stage 4: Paragraph-aware chunking with sliding surrounding context.
    Ensures complete paragraph boundaries are respected.
    """
    paragraphs = metrics.paragraphs
    if not paragraphs:
        return [ContextChunk(
            chunk_index=0,
            active_text=text,
            global_start=0,
            global_end=len(text)
        )]

    if len(text) <= target_chunk_size or len(paragraphs) <= 2:
        return [ContextChunk(
            chunk_index=0,
            active_text=text,
            global_start=0,
            global_end=len(text),
            paragraph_indices=list(range(len(paragraphs)))
        )]

    chunks: List[ContextChunk] = []
    current_para_start = 0
    chunk_index = 0

    while current_para_start < len(paragraphs):
        current_len = 0
        current_para_end = current_para_start

        while current_para_end < len(paragraphs):
            para = paragraphs[current_para_end]
            para_len = para.global_end - para.global_start
            if current_len > 0 and (current_len + para_len) > target_chunk_size:
                break
            current_len += para_len
            current_para_end += 1

        if current_para_end == current_para_start:
            current_para_end = current_para_start + 1

        active_start = paragraphs[current_para_start].global_start
        active_end = paragraphs[current_para_end - 1].global_end
        active_text = text[active_start:active_end]

        preceding_context = ""
        if current_para_start > 0:
            ctx_start_para = max(0, current_para_start - 1)
            ctx_start = paragraphs[ctx_start_para].global_start
            preceding_context = text[ctx_start:active_start].strip()

        following_context = ""
        if current_para_end < len(paragraphs):
            ctx_end_para = min(len(paragraphs), current_para_end + 1)
            ctx_end = paragraphs[ctx_end_para - 1].global_end
            following_context = text[active_end:ctx_end].strip()

        chunks.append(
            ContextChunk(
                chunk_index=chunk_index,
                active_text=active_text,
                global_start=active_start,
                global_end=active_end,
                preceding_context=preceding_context,
                following_context=following_context,
                paragraph_indices=list(range(current_para_start, current_para_end))
            )
        )

        current_para_start = current_para_end
        chunk_index += 1

    return chunks


def find_exact_offsets(
    full_text: str,
    original_phrase: str,
    search_start: int = 0,
    search_end: Optional[int] = None,
    occupied_spans: Optional[Set[Tuple[int, int]]] = None,
    context_hint: Optional[str] = None
) -> Optional[Tuple[int, int]]:
    """
    Locates the exact original phrase in the text with anchor-aware positioning.
    Prevents short punctuation or word tokens from matching incorrect earlier instances.
    """
    if not original_phrase or not full_text:
        return None

    if search_end is None or search_end > len(full_text):
        search_end = len(full_text)

    search_start = max(0, search_start)
    occupied = occupied_spans or set()
    cleaned_orig = original_phrase.strip()
    if not cleaned_orig:
        return None

    def is_span_free(s: int, e: int) -> bool:
        for occ_s, occ_e in occupied:
            if max(s, occ_s) < min(e, occ_e):
                return False
        return True

    region = full_text[search_start:search_end]

    # Strategy 1: Context hint match
    if context_hint and len(context_hint.strip()) > len(cleaned_orig):
        hint = context_hint.strip()
        h_idx = region.find(hint)
        if h_idx != -1:
            sub_region = region[h_idx:h_idx + len(hint)]
            o_idx = sub_region.find(cleaned_orig)
            if o_idx != -1:
                cand_s = search_start + h_idx + o_idx
                cand_e = cand_s + len(cleaned_orig)
                if is_span_free(cand_s, cand_e):
                    return (cand_s, cand_e)

    # Strategy 2: Exact match in chunk region
    pos = 0
    while True:
        idx = region.find(cleaned_orig, pos)
        if idx == -1:
            break
        cand_s = search_start + idx
        cand_e = cand_s + len(cleaned_orig)
        if is_span_free(cand_s, cand_e):
            return (cand_s, cand_e)
        pos = idx + 1

    # Strategy 3: Case-insensitive match in chunk region
    lower_region = region.lower()
    lower_orig = cleaned_orig.lower()
    pos = 0
    while True:
        idx = lower_region.find(lower_orig, pos)
        if idx == -1:
            break
        cand_s = search_start + idx
        cand_e = cand_s + len(cleaned_orig)
        if is_span_free(cand_s, cand_e):
            return (cand_s, cand_e)
        pos = idx + 1

    # Strategy 4: Normalized whitespace match
    norm_orig = re.sub(r"\s+", r"\\s+", re.escape(cleaned_orig))
    for m in re.finditer(norm_orig, region, re.IGNORECASE):
        cand_s = search_start + m.start()
        cand_e = search_start + m.end()
        if is_span_free(cand_s, cand_e):
            return (cand_s, cand_e)

    # Strategy 5: Full document search fallback
    if search_start > 0 or search_end < len(full_text):
        doc_pos = 0
        while True:
            idx = full_text.find(cleaned_orig, doc_pos)
            if idx == -1:
                break
            cand_s = idx
            cand_e = cand_s + len(cleaned_orig)
            if is_span_free(cand_s, cand_e):
                return (cand_s, cand_e)
            doc_pos = idx + 1

        lower_full = full_text.lower()
        doc_pos = 0
        while True:
            idx = lower_full.find(lower_orig, doc_pos)
            if idx == -1:
                break
            cand_s = idx
            cand_e = cand_s + len(cleaned_orig)
            if is_span_free(cand_s, cand_e):
                return (cand_s, cand_e)
            doc_pos = idx + 1

    return None


def validate_and_filter_issues(
    candidates: List[Dict[str, Any]],
    full_text: str,
    protected_terms: Set[str],
    min_confidence: float = 0.70
) -> List[Dict[str, Any]]:
    """
    Stage 6: Multi-pass validation engine.
    - Verifies original text exists in full_text at exact offsets.
    - Discards no-op corrections (original == suggestion).
    - Filters out protected terms (e.g. 'quillora').
    - Discards ungrounded or low-confidence suggestions.
    - Resolves overlapping text replacements.
    """
    if not candidates or not full_text:
        return []

    valid_candidates: List[Dict[str, Any]] = []

    category_weights = {
        "grammar": 5,
        "spelling": 4,
        "punctuation": 3,
        "clarity": 2,
        "style": 1
    }

    for item in candidates:
        orig = item.get("original", "").strip()
        sugg = item.get("suggestion", "").strip()
        start = item.get("start")
        end = item.get("end")
        confidence = float(item.get("confidence", 0.95))
        category = str(item.get("category", "grammar")).lower()

        if not orig or not sugg:
            continue
        if orig.strip().lower() == sugg.strip().lower() and orig == sugg:
            continue

        if start is None or end is None or start < 0 or end > len(full_text) or start >= end:
            continue

        actual_slice = full_text[start:end]
        if actual_slice.strip().lower() != orig.lower():
            continue

        if orig.lower() in protected_terms or sugg.lower() in protected_terms:
            continue

        if confidence < min_confidence:
            continue

        if category not in category_weights:
            category = "grammar"

        item["original"] = actual_slice
        item["category"] = category
        item["confidence"] = round(confidence, 2)
        valid_candidates.append(item)

    valid_candidates.sort(
        key=lambda x: (
            x["start"],
            -category_weights.get(x["category"], 1),
            -x.get("confidence", 0.9),
            -(x["end"] - x["start"])
        )
    )

    accepted_items: List[Dict[str, Any]] = []
    occupied_spans: List[Tuple[int, int]] = []

    for cand in valid_candidates:
        s = cand["start"]
        e = cand["end"]

        has_overlap = False
        for occ_s, occ_e in occupied_spans:
            if max(s, occ_s) < min(e, occ_e):
                has_overlap = True
                break

        if not has_overlap:
            occupied_spans.append((s, e))
            accepted_items.append(cand)

    accepted_items.sort(key=lambda x: x["start"])
    return accepted_items


def resolve_and_deduplicate_spans(
    items: List[Dict],
    text: str,
    protected_terms: Set[str],
) -> List[Dict]:
    return validate_and_filter_issues(
        candidates=items,
        full_text=text,
        protected_terms=protected_terms,
        min_confidence=0.70
    )


def split_into_chunks(text: str, target_chunk_size: int = 2200) -> List[Any]:
    metrics = analyze_document_structure(text)
    return create_context_batches(text, metrics, target_chunk_size=target_chunk_size)
