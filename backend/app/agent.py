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

# --- MONKEYPATCH for thought_signature on Gemini models ---
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

def get_summarizer_llm():
    """Lazy-initializes the Gemini model with structured output."""
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise ValueError("GEMINI_API_KEY is not set in backend/.env. Please add your Gemini API Key.")
    
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    return ChatGoogleGenerativeAI(
        model=gemini_model,
        temperature=0.3,
        google_api_key=api_key.strip(),
    ).with_structured_output(BookmarkSchema)


async def process_bookmark_stream(url: str, user_id: str = "default_guest") -> AsyncGenerator[str, None]:
    """
    Async generator that fetches, analyzes, summarizes, and saves a bookmark,
    emitting Server-Sent Events (SSE) progress logs to the caller.
    """
    try:
        # Check API key before proceeding
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key or not api_key.strip():
            yield json.dumps({
                "event": "error",
                "data": "GEMINI_API_KEY is missing in backend/.env. Please add your Google AI Studio key."
            })
            return

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

        yield json.dumps({"event": "status", "data": "Analyzing content & generating summary with Gemini AI..."})
        await asyncio.sleep(0.2)

        # Step 4: Run Gemini Structured Output (in threadpool to keep async loop non-blocking)
        llm = get_summarizer_llm()
        prompt = f"Analyze this web page content and provide a structured summary:\n\nURL: {url}\n\nContent:\n{truncated_text}"
        result: BookmarkSchema = await asyncio.to_thread(llm.invoke, prompt)

        yield json.dumps({"event": "status", "data": "Saving bookmark to persistent database..."})
        await asyncio.sleep(0.2)

        # Step 5: Save to user-scoped database
        saved_record = add_bookmark(
            user_id=user_id,
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
