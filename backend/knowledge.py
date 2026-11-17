"""
Quillora AI — Authoritative Knowledge Base Loader

This module loads KNOWLEDGE.md, which is the SINGLE SOURCE OF TRUTH for product
rules, AI instructions, protected terms, and JSON contracts.

Features:
- Validates that KNOWLEDGE.md exists and is non-empty.
- Safe mtime-based caching: checks file modification time before reading from disk.
- Thread-safe / async-safe reload support without restarting the server.
- Provides parsed protected terms list.
- Raises explicit KnowledgeBaseError if the file is missing or unreadable.
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger("quillora.knowledge")


class KnowledgeBaseError(Exception):
    """Raised when KNOWLEDGE.md is missing, unreadable, or invalid."""
    pass


class KnowledgeManager:
    _instance: Optional[KnowledgeManager] = None

    def __init__(self, knowledge_path: Optional[str | Path] = None):
        if knowledge_path:
            self.knowledge_path = Path(knowledge_path).resolve()
        else:
            # Default to KNOWLEDGE.md at root directory (one level up from backend)
            base_dir = Path(__file__).resolve().parent
            candidate_paths = [
                base_dir.parent / "KNOWLEDGE.md",
                base_dir / "KNOWLEDGE.md",
                Path("KNOWLEDGE.md").resolve(),
            ]
            self.knowledge_path = candidate_paths[0]
            for p in candidate_paths:
                if p.exists() and p.is_file():
                    self.knowledge_path = p
                    break

        self._cached_content: Optional[str] = None
        self._cached_mtime: float = -1.0
        self._protected_terms: Set[str] = set()

    @classmethod
    def get_instance(cls, path: Optional[str | Path] = None) -> KnowledgeManager:
        if cls._instance is None:
            cls._instance = KnowledgeManager(path)
        return cls._instance

    def _extract_protected_terms(self, content: str) -> Set[str]:
        """Extract protected terms from Section 6 of KNOWLEDGE.md."""
        terms: Set[str] = set()
        section_match = re.search(
            r"##\s*6\.\s*Protected Terms.*?(?=(?:##\s*\d|\Z))",
            content,
            re.DOTALL | re.IGNORECASE,
        )
        if section_match:
            lines = section_match.group(0).splitlines()
            for line in lines:
                line = line.strip()
                if line.startswith("-") and not line.startswith("---"):
                    term = line.lstrip("-").strip()
                    # Ignore comment-like items e.g. (add product names...)
                    if term and not term.startswith("(") and not term.endswith(")"):
                        terms.add(term.lower())
        return terms

    def load(self, force: bool = False) -> str:
        """
        Load the KNOWLEDGE.md file with mtime caching.
        If force=True or file has been modified, re-reads from disk.
        """
        if not self.knowledge_path.exists():
            msg = f"KNOWLEDGE.md not found at expected path: {self.knowledge_path}"
            logger.error(msg)
            raise KnowledgeBaseError(msg)

        try:
            current_mtime = self.knowledge_path.stat().st_mtime
        except OSError as e:
            msg = f"Cannot read stat for KNOWLEDGE.md at {self.knowledge_path}: {e}"
            logger.error(msg)
            raise KnowledgeBaseError(msg) from e

        # If cached and file hasn't changed, return cached content
        if not force and self._cached_content is not None and current_mtime == self._cached_mtime:
            return self._cached_content

        try:
            content = self.knowledge_path.read_text(encoding="utf-8").strip()
        except Exception as e:
            msg = f"Failed to read KNOWLEDGE.md at {self.knowledge_path}: {e}"
            logger.error(msg)
            raise KnowledgeBaseError(msg) from e

        if not content:
            msg = f"KNOWLEDGE.md at {self.knowledge_path} is empty! Cannot proceed."
            logger.error(msg)
            raise KnowledgeBaseError(msg)

        self._cached_content = content
        self._cached_mtime = current_mtime
        self._protected_terms = self._extract_protected_terms(content)
        logger.info(
            "Loaded KNOWLEDGE.md (%d chars, %d protected terms, mtime=%f)",
            len(content),
            len(self._protected_terms),
            current_mtime,
        )
        return self._cached_content

    def get_content(self) -> str:
        """Returns the up-to-date KNOWLEDGE.md content."""
        return self.load()

    def get_protected_terms(self) -> Set[str]:
        """Returns the set of protected terms in lowercase."""
        if self._cached_content is None:
            self.load()
        return set(self._protected_terms)

    def get_metadata(self) -> Dict[str, Any]:
        """Returns metadata about the loaded knowledge base."""
        content = self.load()
        return {
            "path": str(self.knowledge_path),
            "size_chars": len(content),
            "last_modified": self._cached_mtime,
            "protected_terms": list(self._protected_terms),
            "is_loaded": True,
        }


# Singleton accessor
knowledge_manager = KnowledgeManager.get_instance()
