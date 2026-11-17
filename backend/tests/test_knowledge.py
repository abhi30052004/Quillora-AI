import pytest
import shutil
from pathlib import Path
from backend.knowledge import KnowledgeManager, KnowledgeBaseError


@pytest.fixture
def local_tmp_dir():
    scratch = Path(__file__).resolve().parent / "scratch"
    scratch.mkdir(parents=True, exist_ok=True)
    yield scratch
    shutil.rmtree(scratch, ignore_errors=True)


def test_knowledge_loads_authoritative_file():
    km = KnowledgeManager()
    content = km.load()
    assert "Quillora AI — Knowledge Base" in content
    assert "SINGLE SOURCE OF TRUTH" in content
    assert "Writing Checker" in content
    assert "Word Enhancer" in content
    assert len(content) > 500


def test_knowledge_extracts_protected_terms():
    km = KnowledgeManager()
    terms = km.get_protected_terms()
    assert "quillora" in terms


def test_missing_knowledge_file_raises_error(local_tmp_dir):
    missing_file = local_tmp_dir / "NON_EXISTENT.md"
    km = KnowledgeManager(knowledge_path=missing_file)
    with pytest.raises(KnowledgeBaseError, match="not found"):
        km.load()


def test_empty_knowledge_file_raises_error(local_tmp_dir):
    empty_file = local_tmp_dir / "EMPTY_KNOWLEDGE.md"
    empty_file.write_text("   \n  ", encoding="utf-8")
    km = KnowledgeManager(knowledge_path=empty_file)
    with pytest.raises(KnowledgeBaseError, match="is empty"):
        km.load()


def test_knowledge_reload_on_mtime_change(local_tmp_dir):
    test_file = local_tmp_dir / "TEMP_KNOWLEDGE.md"
    test_file.write_text("Initial knowledge content", encoding="utf-8")
    km = KnowledgeManager(knowledge_path=test_file)

    assert km.load() == "Initial knowledge content"

    # Modify file
    test_file.write_text("Updated knowledge content", encoding="utf-8")
    # Force reload or detect mtime
    assert km.load(force=True) == "Updated knowledge content"
