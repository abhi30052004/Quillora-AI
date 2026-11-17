import pytest
from httpx import ASGITransport, AsyncClient
from backend.main import app
from backend.text_processing import split_into_chunks, find_exact_offsets, resolve_and_deduplicate_spans


@pytest.mark.asyncio
async def test_writing_checker_matrix():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Correct spelling & homophones
        res = await client.post("/api/check", json={"text": "I hope their going to recieve the parcel."})
        assert res.status_code == 200
        issues = res.json()["issues"]
        assert any(i["category"] == "spelling" for i in issues)

        # 2. Subject-verb agreement
        res = await client.post("/api/check", json={"text": "He go to school every morning."})
        assert res.status_code == 200
        issues = res.json()["issues"]
        assert any("goes" in i["suggestion"].lower() for i in issues)

        # 3. Comma splices & punctuation
        res = await client.post("/api/check", json={"text": "I love dogs, they are cute."})
        assert res.status_code == 200
        assert any(i["category"] == "punctuation" for i in res.json()["issues"])

        # 4. Repeated words (style)
        res = await client.post("/api/check", json={"text": "This is the the best way."})
        assert res.status_code == 200
        assert any("the the" in i["original"] for i in res.json()["issues"])

        # 5. Protected terms (Quillora must NEVER be flagged as an error)
        res = await client.post("/api/check", json={"text": "Quillora is an English-writing assistant."})
        assert res.status_code == 200
        assert not any("quillora" in i["original"].lower() for i in res.json()["issues"])

        # 6. Already correct writing returns 0 issues
        res = await client.post("/api/check", json={"text": "The swift brown fox jumped gracefully over the fence."})
        assert res.status_code == 200
        assert len(res.json()["issues"]) == 0

        # 7. Long multi-paragraph document (>5,000 characters)
        long_para = "He go to school every morning. The weather was pleasant.\n\n" * 100
        res = await client.post("/api/check", json={"text": long_para})
        assert res.status_code == 200
        data = res.json()
        assert data["stats"]["chunks"] > 1
        assert len(data["issues"]) > 0
        # Ensure all issue offsets are valid within original text
        for iss in data["issues"]:
            s, e = iss["start"], iss["end"]
            assert long_para[s:e] == iss["original"]


@pytest.mark.asyncio
async def test_word_enhancer_matrix():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Weak adjective + Neutral tone
        res = await client.post("/api/enhance", json={"text": "The athlete was very tired after the race.", "tone": "neutral"})
        assert res.status_code == 200
        suggs = res.json()["suggestions"]
        assert len(suggs) >= 1
        assert len(suggs[0]["alternatives"]) == 3

        # 2. Formal tone
        res = await client.post("/api/enhance", json={"text": "The team did a good job on the report.", "tone": "formal"})
        assert res.status_code == 200
        suggs = res.json()["suggestions"]
        assert len(suggs) >= 1
        assert "exemplary" in suggs[0]["alternatives"] or "superior" in suggs[0]["alternatives"]

        # 3. Creative tone
        res = await client.post("/api/enhance", json={"text": "'I am leaving,' she said softly.", "tone": "creative"})
        assert res.status_code == 200
        suggs = res.json()["suggestions"]
        assert len(suggs) >= 1
        assert any(word in suggs[0]["alternatives"] for word in ["whispered", "murmured", "breathed"])

        # 4. Casual tone
        res = await client.post("/api/enhance", json={"text": "We bought a big television yesterday.", "tone": "casual"})
        assert res.status_code == 200
        suggs = res.json()["suggestions"]
        assert len(suggs) >= 1
        assert any(word in suggs[0]["alternatives"] for word in ["huge", "massive", "giant"])

        # 5. Already strong vocabulary (no weak targets)
        res = await client.post("/api/enhance", json={"text": "The intricate manuscript mesmerized the scholar.", "tone": "neutral"})
        assert res.status_code == 200
        assert len(res.json()["suggestions"]) == 0


@pytest.mark.asyncio
async def test_technical_edge_cases():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Text exceeding 50,000 characters
        oversized = "a" * 50001
        res = await client.post("/api/check", json={"text": oversized})
        assert res.status_code == 422 or res.status_code == 400

        # Empty string
        res = await client.post("/api/check", json={"text": ""})
        assert res.status_code == 422

        # Whitespace only
        res = await client.post("/api/enhance", json={"text": "   \n\t  "})
        assert res.status_code == 422
