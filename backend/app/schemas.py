from pydantic import BaseModel, Field
from typing import List, Optional

class BookmarkSchema(BaseModel):
    """Pydantic model used for Gemini structured output when summarizing web pages."""
    title: str = Field(..., description="The title of the web page or article")
    summary: str = Field(..., description="A concise 2-3 sentence summary of the page content")
    category: str = Field(..., description="One of: AI, Dev, Design, Finance, Productivity, News, Other")
    tags: List[str] = Field(..., description="3-5 lowercase keyword tags relevant to the content")

class BookmarkResponse(BaseModel):
    """API Response schema for a saved bookmark record."""
    id: int
    url: str
    title: str
    summary: str
    category: str
    tags: List[str]
    created_at: str

class BookmarkCreateRequest(BaseModel):
    """API Request schema for manually creating a bookmark."""
    url: str
