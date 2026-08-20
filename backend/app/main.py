import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .database import (
    get_all_bookmarks,
    search_bookmarks,
    delete_bookmark,
    init_db
)
from .agent import process_bookmark_stream

# Initialize FastAPI application
app = FastAPI(
    title="Smart Bookmark Agent API",
    description="FastAPI Backend for LangGraph/Gemini Bookmark Agent with SSE Streaming & SQLite",
    version="2.0.0"
)

# Enable CORS for Next.js frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Ensure database table exists on startup."""
    init_db()

@app.get("/")
def read_root():
    return {"message": "Smart Bookmark Agent API is running", "docs": "/docs"}

@app.get("/api/bookmarks")
def list_bookmarks(category: Optional[str] = Query(None, description="Optional category filter")):
    """Get all bookmarks, optionally filtered by category."""
    return get_all_bookmarks(category=category)

@app.get("/api/bookmarks/search")
def search(q: str = Query(..., description="Search query string")):
    """Search bookmarks by keyword matching across title, summary, category, and tags."""
    if not q or not q.strip():
        return get_all_bookmarks()
    return search_bookmarks(q.strip())

@app.delete("/api/bookmarks/{bookmark_id}")
def remove_bookmark(bookmark_id: int):
    """Delete a bookmark by ID."""
    success = delete_bookmark(bookmark_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted successfully", "id": bookmark_id}

@app.get("/api/bookmarks/stream")
async def stream_bookmark(url: str = Query(..., description="Web page URL to analyze & save")):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time progress events as the agent fetches, analyzes, and saves the bookmark.
    """
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="A valid http/https URL is required.")

    async def event_publisher():
        async for event_data in process_bookmark_stream(url):
            yield {"data": event_data}

    return EventSourceResponse(event_publisher())
