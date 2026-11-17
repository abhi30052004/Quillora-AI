"""
Quillora AI — Text Processing, Chunking, and Offset Resolution

This module handles:
1. Long-document chunking (~1,800 characters) at paragraph and sentence boundaries.
2. Global character offset tracking so chunk-local offsets map 1:1 to original text.
3. Accurate offset resolution (finding exact original spans in text).
4. Protected terms filtering (ensuring protected terms are never flagged).
5. Overlapping suggestion resolution and deduplication.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple


@dataclass
class TextChunk:
    text: str
    global_start: int
    global_end: int
    chunk_index: int


def split_into_chunks(text: str, target_chunk_size: int = 1800) -> List[TextChunk]:
    """
    Split long text into chunks of approximately target_chunk_size characters.
    Splits prefer:
    1. Paragraph breaks (\\n\\n)
    2. Single line breaks (\\n)
    3. Sentence terminators (. ! ?)
    4. Word boundaries (spaces)
    
    CRITICAL: chunk.text MUST equal text[chunk.global_start:chunk.global_end]
    to ensure 100% accurate global offset calculations.
    """
    if not text:
        return []

    total_len = len(text)
    if total_len <= target_chunk_size:
        return [TextChunk(text=text, global_start=0, global_end=total_len, chunk_index=0)]

    chunks: List[TextChunk] = []
    current_start = 0
    chunk_index = 0

    while current_start < total_len:
        remaining = total_len - current_start
        if remaining <= target_chunk_size:
            chunks.append(
                TextChunk(
                    text=text[current_start:total_len],
                    global_start=current_start,
                    global_end=total_len,
                    chunk_index=chunk_index,
                )
            )
            break

        ideal_end = min(current_start + target_chunk_size, total_len)

        # Look for a split point before ideal_end, but not too close to current_start
        # Search window is between current_start + target_chunk_size * 0.6 and ideal_end
        min_split_point = current_start + int(target_chunk_size * 0.5)
        window = text[min_split_point:ideal_end]

        split_pos = -1

        # Priority 1: Double newline (paragraph break)
        p_idx = window.rfind("\n\n")
        if p_idx != -1:
            split_pos = min_split_point + p_idx + 2  # Include the newlines in current chunk
        else:
            # Priority 2: Single newline
            n_idx = window.rfind("\n")
            if n_idx != -1:
                split_pos = min_split_point + n_idx + 1
            else:
                # Priority 3: Sentence terminator followed by space
                # Look for regex match of [.!?] followed by whitespace
                matches = list(re.finditer(r"[\.!\?]\s+", window))
                if matches:
                    last_match = matches[-1]
                    split_pos = min_split_point + last_match.end()
                else:
                    # Priority 4: Space
                    s_idx = window.rfind(" ")
                    if s_idx != -1:
                        split_pos = min_split_point + s_idx + 1

        # If no good split point found, split hard at ideal_end
        if split_pos <= current_start or split_pos > total_len:
            split_pos = ideal_end

        chunk_text = text[current_start:split_pos]
        chunks.append(
            TextChunk(
                text=chunk_text,
                global_start=current_start,
                global_end=split_pos,
                chunk_index=chunk_index,
            )
        )
        current_start = split_pos
        chunk_index += 1

    return chunks


def find_exact_offsets(
    full_text: str,
    original_phrase: str,
    search_start: int = 0,
    search_end: Optional[int] = None,
    occupied_spans: Optional[Set[Tuple[int, int]]] = None,
) -> Optional[Tuple[int, int]]:
    """
    Locates the exact original phrase in the text within [search_start, search_end].
    Returns (start, end) tuple or None if not found or already occupied.
    """
    if not original_phrase or not full_text:
        return None

    if search_end is None:
        search_end = len(full_text)

    occupied = occupied_spans or set()
    cleaned_orig = original_phrase.strip()
    if not cleaned_orig:
        return None

    region = full_text[search_start:search_end]

    def is_span_free(s: int, e: int) -> bool:
        for occ_s, occ_e in occupied:
            # Check overlap
            if max(s, occ_s) < min(e, occ_e):
                return False
        return True

    # 1. Exact match attempt
    pos = 0
    while True:
        idx = region.find(cleaned_orig, pos)
        if idx == -1:
            break
        actual_start = search_start + idx
        actual_end = actual_start + len(cleaned_orig)
        if is_span_free(actual_start, actual_end):
            return (actual_start, actual_end)
        pos = idx + 1

    # 2. Case-insensitive match attempt (if exact match not found)
    lower_region = region.lower()
    lower_orig = cleaned_orig.lower()
    pos = 0
    while True:
        idx = lower_region.find(lower_orig, pos)
        if idx == -1:
            break
        actual_start = search_start + idx
        actual_end = actual_start + len(cleaned_orig)
        if is_span_free(actual_start, actual_end):
            return (actual_start, actual_end)
        pos = idx + 1

    # 3. Normalized whitespace attempt (in case of double spaces or linebreaks in original)
    norm_orig = re.sub(r"\s+", r"\\s+", re.escape(cleaned_orig))
    for m in re.finditer(norm_orig, region, re.IGNORECASE):
        actual_start = search_start + m.start()
        actual_end = search_start + m.end()
        if is_span_free(actual_start, actual_end):
            return (actual_start, actual_end)

    return None


def resolve_and_deduplicate_spans(
    items: List[Dict],
    text: str,
    protected_terms: Set[str],
) -> List[Dict]:
    """
    Validates, sorts, filters protected terms, and resolves overlapping items.
    Items must have 'start', 'end', and 'original'.
    Returns non-overlapping list sorted by start offset.
    """
    valid_items: List[Dict] = []
    occupied: Set[Tuple[int, int]] = set()

    # Sort by start offset ascending, then by span length descending (longer fixes take precedence)
    sorted_items = sorted(
        items,
        key=lambda x: (x.get("start", 0), -(x.get("end", 0) - x.get("start", 0))),
    )

    for item in sorted_items:
        start = item.get("start")
        end = item.get("end")
        original = item.get("original", "").strip()

        if start is None or end is None or start >= end:
            continue

        if start < 0 or end > len(text):
            continue

        # Check protected terms (never flag protected terms)
        if original.lower() in protected_terms:
            continue

        # Check overlap with already accepted items
        has_overlap = False
        for occ_s, occ_e in occupied:
            if max(start, occ_s) < min(end, occ_e):
                has_overlap = True
                break

        if has_overlap:
            continue

        occupied.add((start, end))
        valid_items.append(item)

    # Re-sort strictly by start offset ascending
    valid_items.sort(key=lambda x: x["start"])
    return valid_items
