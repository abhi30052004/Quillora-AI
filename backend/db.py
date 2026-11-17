"""
Quillora AI — Database & Privacy Logging

Stores metadata ONLY (timestamps, counts, durations).
NEVER stores raw user writing or sensitive text.
Fully optional: if MongoDB is unavailable or MONGODB_URI is empty, operates seamlessly in-memory.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient

try:
    from backend.config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("quillora.db")


class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self._connected = False

    async def connect(self):
        if not settings.MONGODB_URI:
            logger.info("MongoDB URI not provided. Running in privacy-first stateless mode.")
            return

        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Quick ping to verify connection
            await self.client.admin.command("ping")
            self._connected = True
            logger.info("Connected to MongoDB successfully: %s", settings.MONGODB_DB_NAME)
        except Exception as e:
            logger.warning("MongoDB connection failed (running in stateless mode): %s", e)
            self._connected = False
            self.client = None
            self.db = None

    async def disconnect(self):
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("MongoDB connection closed.")

    def is_connected(self) -> bool:
        return self._connected

    async def log_metadata(self, event_type: str, char_count: int, word_count: int, issue_count: int, duration_ms: float):
        """
        Logs ONLY non-sensitive operational metadata.
        NO user text is stored.
        """
        if not self._connected or self.db is None:
            return

        try:
            doc = {
                "event_type": event_type,
                "char_count": char_count,
                "word_count": word_count,
                "issue_count": issue_count,
                "duration_ms": duration_ms,
                "timestamp": datetime.now(timezone.utc),
            }
            await self.db["usage_metadata"].insert_one(doc)
        except Exception as e:
            logger.warning("Failed to log metadata to MongoDB: %s", e)


db_manager = DatabaseManager()
