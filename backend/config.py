"""
Quillora AI — Application Configuration
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent


class Settings(BaseSettings):
    # Groq Configuration & Automated Failover
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GROQ_FALLBACK_MODELS: str = "openai/gpt-oss-120b,qwen/qwen3.8-27b"
    GROQ_TEMPERATURE: float = 0.1
    GROQ_TIMEOUT_SECONDS: float = 35.0
    GROQ_MAX_RETRIES: int = 2

    # Text Processing & Chunking
    CHUNK_SIZE: int = 2200
    CHUNK_CONCURRENCY: int = 4
    MAX_TEXT_LENGTH: int = 50000

    # Caching Layer (In-memory SHA256 cache)
    ENABLE_CACHE: bool = True
    CACHE_MAX_ENTRIES: int = 500
    CACHE_TTL_SECONDS: int = 3600

    # Knowledge Base
    KNOWLEDGE_PATH: Optional[str] = None

    # Database (Optional MongoDB via Motor)
    MONGODB_URI: Optional[str] = None
    MONGODB_DB_NAME: str = "quillora"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    FRONTEND_URL: Optional[str] = "https://quillora-ai.vercel.app"
    CORS_ORIGINS: List[str] = [
        "https://quillora-ai.vercel.app",
        "https://quillora-ai.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Offline / Test fallback
    MOCK_LLM: bool = False

    model_config = SettingsConfigDict(
        env_file=(
            str(_backend_dir / ".env"),
            str(_root_dir / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
