import asyncio
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .database import (
    get_all_bookmarks,
    search_bookmarks,
    delete_bookmark,
    upsert_user,
    init_db
)
from .agent import process_bookmark_stream
from .auth import get_current_user_optional

# Initialize FastAPI application
app = FastAPI(
    title="Recall AI Knowledge Engine API",
    description="FastAPI Backend for LangGraph/Gemini AI Bookmark Agent with Persistent PostgreSQL & NextAuth SSO",
    version="2.1.0"
)

# Enable CORS for Next.js frontend (production & local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://recall.kamrankhan.xyz",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Ensure database tables exist on startup."""
    init_db()

@app.get("/")
def read_root():
    return {
        "message": "Recall AI Knowledge Engine API is running",
        "version": "2.1.0",
        "docs": "/docs"
    }

@app.get("/api/user/sync")
def sync_user(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Upserts the authenticated user into the database upon login."""
    if not current_user:
        return {"status": "guest", "user_id": "default_guest"}
    
    user_record = upsert_user(
        user_id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        avatar_url=current_user.get("image")
    )
    return {"status": "authenticated", "user": user_record}

@app.get("/api/bookmarks")
def list_bookmarks(
    category: Optional[str] = Query(None, description="Optional category filter"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Get all bookmarks for the authenticated user (or guest)."""
    user_id = current_user["id"] if current_user else "default_guest"
    return get_all_bookmarks(user_id=user_id, category=category)

@app.get("/api/bookmarks/search")
def search(
    q: str = Query(..., description="Search query string"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Search bookmarks by keyword matching across title, summary, category, and tags."""
    user_id = current_user["id"] if current_user else "default_guest"
    if not q or not q.strip():
        return get_all_bookmarks(user_id=user_id)
    return search_bookmarks(user_id=user_id, query=q.strip())

@app.delete("/api/bookmarks/{bookmark_id}")
def remove_bookmark(
    bookmark_id: int,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Delete a bookmark by ID belonging to the authenticated user."""
    user_id = current_user["id"] if current_user else "default_guest"
    success = delete_bookmark(user_id=user_id, bookmark_id=bookmark_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bookmark not found or unauthorized")
    return {"message": "Bookmark deleted successfully", "id": bookmark_id}

@app.get("/api/bookmarks/stream")
async def stream_bookmark(
    url: str = Query(..., description="Web page URL to analyze & save"),
    token: Optional[str] = Query(None, description="Optional auth token for EventSource"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time progress events as the agent fetches, analyzes, and saves the bookmark for the authenticated user.
    """
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="A valid http/https URL is required.")

    # Determine user_id from Bearer header or optional query token
    user_id = "default_guest"
    if current_user:
        user_id = current_user["id"]
    elif token:
        # Fallback decode query token for SSE connections where headers cannot be set in native EventSource
        from .auth import AUTH_SECRET
        import jwt
        try:
            payload = jwt.decode(token, AUTH_SECRET, algorithms=["HS256", "HS512"])
            user_id = str(payload.get("userId") or payload.get("sub") or payload.get("email") or "default_guest")
        except Exception:
            user_id = "default_guest"

    async def event_publisher():
        async for event_data in process_bookmark_stream(url=url, user_id=user_id):
            yield {"data": event_data}

    return EventSourceResponse(event_publisher())
