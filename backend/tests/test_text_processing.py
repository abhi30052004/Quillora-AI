import pytest
from backend.text_processing import (
    split_into_chunks,
    find_exact_offsets,
    resolve_and_deduplicate_spans,
)


def test_split_short_text():
    text = "This is a short sentence."
    chunks = split_into_chunks(text, target_chunk_size=1800)
    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].global_start == 0
    assert chunks[0].global_end == len(text)


def test_split_long_text_exact_offsets():
    para1 = "Paragraph 1 is here. " * 50  # ~1050 chars
    para2 = "Paragraph 2 is here. " * 50  # ~1050 chars
    para3 = "Paragraph 3 is here. " * 50  # ~1050 chars
    full_text = f"{para1}\n\n{para2}\n\n{para3}"

    chunks = split_into_chunks(full_text, target_chunk_size=1800)
    assert len(chunks) >= 2

    # Verify that each chunk's slice matches original exactly
    for c in chunks:
        assert full_text[c.global_start:c.global_end] == c.text

    # Reconstructed text must equal original
    reconstructed = "".join(c.text for c in chunks)
    assert reconstructed == full_text


def test_find_exact_offsets():
    text = "She told him that he go to school every morning."
    phrase = "he go"
    res = find_exact_offsets(text, phrase)
    assert res is not None
    start, end = res
    assert text[start:end] == "he go"


def test_find_exact_offsets_repeated_words():
    text = "The dog chased the cat because the dog was energetic."
    # With context
    first_res = find_exact_offsets(text, "The dog chased")
    assert first_res is not None
    assert text[first_res[0]:first_res[1]] == "The dog chased"

    second_res = find_exact_offsets(text, "the dog was energetic")
    assert second_res is not None
    assert text[second_res[0]:second_res[1]] == "the dog was energetic"


def test_resolve_overlapping_spans():
    text = "The quick brown fox jumps over the lazy dog."
    # Overlapping items: 4-15 ("quick brown") and 10-19 ("brown fox")
    items = [
        {"start": 4, "end": 15, "original": "quick brown", "suggestion": "fast brown"},
        {"start": 10, "end": 19, "original": "brown fox", "suggestion": "red fox"},
        {"start": 35, "end": 43, "original": "lazy dog", "suggestion": "sleepy dog"},
    ]
    resolved = resolve_and_deduplicate_spans(items, text, protected_terms=set())
    # Should keep first non-overlapping items
    assert len(resolved) == 2
    assert resolved[0]["original"] == "quick brown"
    assert resolved[1]["original"] == "lazy dog"


def test_protected_terms_are_filtered():
    text = "We are using Quillora for our writing."
    items = [
        {"start": 13, "end": 21, "original": "Quillora", "suggestion": "Quill"},
    ]
    resolved = resolve_and_deduplicate_spans(items, text, protected_terms={"quillora"})
    assert len(resolved) == 0
