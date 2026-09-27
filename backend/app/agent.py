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
    
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    return ChatGoogleGenerativeAI(
        model=gemini_model,
        temperature=0.3,
        google_api_key=api_key.strip(),
    ).with_structured_output(BookmarkSchema)


async def fetch_webpage_markdown(url: str) -> str:
    """
    Fetches the webpage content in structured Markdown format.
    Uses Jina Reader (https://r.jina.ai/) as the primary high-fidelity extractor
    (handles client-side JS rendering, strips navs/ads/cookie banners),
    with an automatic fallback to direct HTTP fetching + HTML cleanup.
    """
    headers = {"User-Agent": "Mozilla/5.0 (compatible; BookmarkAgent/2.0)"}

    # Tier 1: Jina Reader API (Zero-config, pristine Markdown output)
    try:
        jina_url = f"https://r.jina.ai/{url}"
        jina_headers = {
            "User-Agent": "Mozilla/5.0 (compatible; BookmarkAgent/2.0)",
            "X-Return-Format": "markdown"
        }
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            res = await client.get(jina_url, headers=jina_headers)
            if res.status_code == 200 and len(res.text.strip()) > 150:
                return res.text.strip()
    except Exception:
        pass  # Fall back to direct fetch if Jina is slow or unreachable

    # Tier 2: Direct HTTP fetch + HTML extraction fallback
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        res = await client.get(url, headers=headers)
        res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe"]):
        tag.decompose()

    # Prefer main article content if semantic tags exist
    main_content = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", {"id": ["content", "main"]})
        or soup.body
        or soup
    )
    return main_content.get_text(separator="\n\n", strip=True)


async def process_bookmark_stream(url: str, user_id: str = "default_guest") -> AsyncGenerator[str, None]:
    """
    Async generator that fetches the page in Markdown format, analyzes & summarizes
    it with Gemini AI, and saves it to user-scoped Supabase storage.
    Emits Server-Sent Events (SSE) progress logs to the caller.
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

        # Step 2: Fetch webpage in structured Markdown format
        yield json.dumps({"event": "status", "data": "Extracting clean structured Markdown from page..."})
        markdown_content = await fetch_webpage_markdown(url)
        truncated_markdown = markdown_content[:25000]

        yield json.dumps({"event": "status", "data": "Analyzing Markdown & synthesizing summary with Gemini AI..."})
        await asyncio.sleep(0.2)

        # Step 3: Run Gemini Structured Output (in threadpool to keep async loop non-blocking)
        llm = get_summarizer_llm()
        prompt = (
            "You are an expert knowledge curator. Analyze the following webpage content "
            "(provided in structured Markdown format) and provide a concise, high-signal structured summary "
            "with an accurate category and 3-5 lowercase keyword tags:\n\n"
            f"URL: {url}\n\n"
            f"Markdown Content:\n{truncated_markdown}"
        )
        result: BookmarkSchema = await asyncio.to_thread(llm.invoke, prompt)

        yield json.dumps({"event": "status", "data": "Saving bookmark to Supabase database..."})
        await asyncio.sleep(0.2)

        # Step 4: Save to user-scoped database
        saved_record = add_bookmark(
            user_id=user_id,
            url=url,
            title=result.title,
            summary=result.summary,
            category=result.category,
            tags=result.tags
        )

        # Step 5: Emit final bookmark result event
        yield json.dumps({"event": "bookmark", "data": saved_record})

    except httpx.TimeoutException:
        yield json.dumps({"event": "error", "data": f"Request to {url} timed out."})
    except httpx.HTTPStatusError as e:
        yield json.dumps({"event": "error", "data": f"HTTP {e.response.status_code} error fetching page."})
    except Exception as e:
        yield json.dumps({"event": "error", "data": f"Failed to process URL: {str(e)}"})
