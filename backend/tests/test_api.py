import pytest
from httpx import ASGITransport, AsyncClient
from backend.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["knowledge_loaded"] is True
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_writing_checker_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"text": "He go to school every morning. I will recieve the email."}
        res = await client.post("/api/check", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "issues" in data
        assert "stats" in data
        issues = data["issues"]
        assert len(issues) >= 1

        # Check structure of issue
        first = issues[0]
        assert "original" in first
        assert "suggestion" in first
        assert "category" in first
        assert "explanation" in first
        assert "start" in first
        assert "end" in first
        assert first["start"] < first["end"]
        # Verify slice in original text
        assert payload["text"][first["start"]:first["end"]] == first["original"]


@pytest.mark.asyncio
async def test_writing_checker_empty_input_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/check", json={"text": "   "})
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_word_enhancer_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"text": "After a long run, he was very tired.", "tone": "creative"}
        res = await client.post("/api/enhance", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "suggestions" in data
        assert data["tone"] == "creative"
        suggestions = data["suggestions"]
        assert len(suggestions) >= 1
        first = suggestions[0]
        assert first["original"] == "very tired"
        assert len(first["alternatives"]) == 3
        assert payload["text"][first["start"]:first["end"]] == first["original"]


@pytest.mark.asyncio
async def test_reload_knowledge_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/reload-knowledge")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "reloaded"
        assert data["metadata"]["is_loaded"] is True
