import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

# Database path (stored in backend/bookmarks.db)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bookmarks.db")

def get_connection():
    """Create a database connection with dictionary row formatting."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the SQLite database schema if it doesn't exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT NOT NULL,  -- Stored as JSON array string
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()

def add_bookmark(url: str, title: str, summary: str, category: str, tags: List[str]) -> Dict:
    """Insert a new bookmark into SQLite. Throws ValueError if URL already exists."""
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    tags_json = json.dumps(tags)

    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO bookmarks (url, title, summary, category, tags, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (url, title, summary, category, tags_json, created_at)
            )
            conn.commit()
            bookmark_id = cursor.lastrowid
            return {
                "id": bookmark_id,
                "url": url,
                "title": title,
                "summary": summary,
                "category": category,
                "tags": tags,
                "created_at": created_at
            }
        except sqlite3.IntegrityError:
            # URL already exists, fetch and return existing entry
            cursor.execute("SELECT * FROM bookmarks WHERE url = ?", (url,))
            row = cursor.fetchone()
            if row:
                return dict_from_row(row)
            raise ValueError(f"Bookmark for URL '{url}' already exists.")

def get_all_bookmarks(category: Optional[str] = None) -> List[Dict]:
    """Retrieve all bookmarks, optionally filtered by category."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if category and category.strip() and category.lower() != "all":
            cursor.execute(
                "SELECT * FROM bookmarks WHERE LOWER(category) = LOWER(?) ORDER BY id DESC",
                (category.strip(),)
            )
        else:
            cursor.execute("SELECT * FROM bookmarks ORDER BY id DESC")
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]

def search_bookmarks(query: str) -> List[Dict]:
    """Search bookmarks matching query across title, summary, category, and tags."""
    query_pattern = f"%{query.strip().lower()}%"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM bookmarks 
            WHERE LOWER(title) LIKE ? 
               OR LOWER(summary) LIKE ? 
               OR LOWER(category) LIKE ? 
               OR LOWER(tags) LIKE ?
            ORDER BY id DESC
            """,
            (query_pattern, query_pattern, query_pattern, query_pattern)
        )
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]

def delete_bookmark(bookmark_id: int) -> bool:
    """Delete a bookmark by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bookmarks WHERE id = ?", (bookmark_id,))
        conn.commit()
        return cursor.rowcount > 0

def dict_from_row(row: sqlite3.Row) -> Dict:
    """Helper to convert a sqlite3 Row to a standard Python dictionary."""
    d = dict(row)
    try:
        d["tags"] = json.loads(d["tags"])
    except (json.JSONDecodeError, TypeError):
        d["tags"] = []
    return d

# Ensure table is initialized on module import
init_db()
