import os
import json
import asyncio
from typing import AsyncGenerator
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
import langchain_google_genai.chat_models as chat_models

from .schemas import BookmarkSchema
from .database import add_bookmark

# Load env variables
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# --- MONKEYPATCH for thought_signature on Gemini 3+ models ---
orig_parse_chat_history = chat_models._parse_chat_history

def patched_parse_chat_history(*args, **kwargs):
    system_instruction, history = orig_parse_chat_history(*args, **kwargs)
    for content in history:
        for part in content.parts:
            if part.function_call:
                part.thought_signature = b"skip_thought_signature_validator"
    return system_instruction, history

chat_models._parse_chat_history = patched_parse_chat_history
# -------------------------------------------------------------

# Initialize structured summarizer model
summarizer_llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    temperature=0.3,
    google_api_key=api_key,
).with_structured_output(BookmarkSchema)


async def process_bookmark_stream(url: str) -> AsyncGenerator[str, None]:
    """
    Async generator that fetches, analyzes, summarizes, and saves a bookmark,
    emitting Server-Sent Events (SSE) progress logs to the caller.
    """
    try:
        # Step 1: Emit initial status event
        yield json.dumps({"event": "status", "data": f"Connecting to {url}..."})
        await asyncio.sleep(0.2)

        # Step 2: Fetch web page content using httpx
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; BookmarkAgent/2.0)"}
            response = await client.get(url, headers=headers)
            response.raise_for_status()

        yield json.dumps({"event": "status", "data": "Extracting clean readable page text..."})
        await asyncio.sleep(0.2)

        # Step 3: Parse text using BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        raw_text = soup.get_text(separator="\n", strip=True)
        truncated_text = raw_text[:3500]

        yield json.dumps({"event": "status", "data": "Analyzing content & generating summary with Gemini 3.5 Flash..."})
        await asyncio.sleep(0.2)

        # Step 4: Run Gemini Structured Output (in threadpool to keep async loop non-blocking)
        prompt = f"Analyze this web page content and provide a structured summary:\n\nURL: {url}\n\nContent:\n{truncated_text}"
        result: BookmarkSchema = await asyncio.to_thread(summarizer_llm.invoke, prompt)

        yield json.dumps({"event": "status", "data": "Saving bookmark to SQLite database..."})
        await asyncio.sleep(0.2)

        # Step 5: Save to SQLite database
        saved_record = add_bookmark(
            url=url,
            title=result.title,
            summary=result.summary,
            category=result.category,
            tags=result.tags
        )

        # Step 6: Emit final bookmark result event
        yield json.dumps({"event": "bookmark", "data": saved_record})

    except httpx.TimeoutException:
        yield json.dumps({"event": "error", "data": f"Request to {url} timed out."})
    except httpx.HTTPStatusError as e:
        yield json.dumps({"event": "error", "data": f"HTTP {e.response.status_code} error fetching page."})
    except Exception as e:
        yield json.dumps({"event": "error", "data": f"Failed to process URL: {str(e)}"})
