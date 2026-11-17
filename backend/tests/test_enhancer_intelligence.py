import asyncio
import json
import pytest
import sys
from pathlib import Path

root_dir = str(Path(__file__).resolve().parent.parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.config import settings
from backend.prompts import build_enhancer_system_prompt, build_user_prompt
from groq import AsyncGroq

@pytest.mark.asyncio
async def test_cases():
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    model = settings.GROQ_MODEL
    
    cases = [
        ("He said quietly into the receiver.", "neutral"),
        ("She got the job after three rounds of interviews.", "formal"),
        ("I am very happy today with the good news.", "casual"),
        ('"We got to run fast," he said in a hurry.', "neutral")
    ]
    
    for text, tone in cases:
        print(f"\n==========================================")
        print(f"INPUT ({tone}): {text}")
        sys_p = build_enhancer_system_prompt(tone)
        usr_p = build_user_prompt(text)
        res = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": sys_p},
                {"role": "user", "content": usr_p}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        print("RESPONSE:", res.choices[0].message.content)
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(test_cases())
