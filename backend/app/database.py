import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bookmarks.db")

is_postgres = bool(DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")))

if is_postgres:
    import psycopg2
    import psycopg2.extras
    # Clean up postgres URL if needed (Render/Supabase format)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def get_connection():
    """
    Returns a database connection:
    - PostgreSQL if DATABASE_URL is set (e.g. Supabase / Neon / Render)
    - SQLite if DATABASE_URL is not set (local dev)
    """
    if is_postgres:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn


def init_db():
    """
    Initializes the database schema for users and bookmarks.
    Supports both PostgreSQL and SQLite dialect.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        if is_postgres:
            # PostgreSQL Schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    avatar_url TEXT,
                    created_at TEXT NOT NULL
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    category TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    CONSTRAINT unique_user_bookmark UNIQUE (user_id, url)
                );
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
            """)
        else:
            # SQLite Schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    avatar_url TEXT,
                    created_at TEXT NOT NULL
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL DEFAULT 'default_guest',
                    url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    category TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, url)
                );
            """)

            # Auto-migrate existing SQLite table if user_id column is missing
            cursor.execute("PRAGMA table_info(bookmarks)")
            columns = [row[1] for row in cursor.fetchall()]
            if "user_id" not in columns:
                cursor.execute("ALTER TABLE bookmarks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_guest'")

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
            """)
        
        conn.commit()
    finally:
        conn.close()


def upsert_user(user_id: str, email: str, name: Optional[str] = None, avatar_url: Optional[str] = None) -> Dict[str, Any]:
    """Ensures user record exists in the users table."""
    conn = get_connection()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    try:
        cursor = conn.cursor()
        if is_postgres:
            cursor.execute("""
                INSERT INTO users (id, email, name, avatar_url, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE 
                SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, users.name), avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
                RETURNING *;
            """, (user_id, email, name, avatar_url, created_at))
            user = cursor.fetchone()
            conn.commit()
            return dict(user) if user else {}
        else:
            cursor.execute("""
                INSERT OR REPLACE INTO users (id, email, name, avatar_url, created_at)
                VALUES (?, ?, ?, ?, ?);
            """, (user_id, email, name, avatar_url, created_at))
            conn.commit()
            return {"id": user_id, "email": email, "name": name, "avatar_url": avatar_url, "created_at": created_at}
    finally:
        conn.close()


def add_bookmark(user_id: str, url: str, title: str, summary: str, category: str, tags: List[str]) -> Dict[str, Any]:
    """
    Inserts a new bookmark scoped to a specific user.
    If the bookmark URL already exists for this user, returns existing entry.
    """
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    tags_json = json.dumps(tags)
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        if is_postgres:
            cursor.execute("""
                INSERT INTO bookmarks (user_id, url, title, summary, category, tags, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, url) DO UPDATE
                SET title = EXCLUDED.title, summary = EXCLUDED.summary, category = EXCLUDED.category, tags = EXCLUDED.tags
                RETURNING *;
            """, (user_id, url, title, summary, category, tags_json, created_at))
            row = cursor.fetchone()
            conn.commit()
            return dict_from_row(row)
        else:
            try:
                cursor.execute("""
                    INSERT INTO bookmarks (user_id, url, title, summary, category, tags, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (user_id, url, title, summary, category, tags_json, created_at))
                conn.commit()
                bookmark_id = cursor.lastrowid
                return {
                    "id": bookmark_id,
                    "user_id": user_id,
                    "url": url,
                    "title": title,
                    "summary": summary,
                    "category": category,
                    "tags": tags,
                    "created_at": created_at
                }
            except sqlite3.IntegrityError:
                cursor.execute("SELECT * FROM bookmarks WHERE user_id = ? AND url = ?", (user_id, url))
                row = cursor.fetchone()
                if row:
                    return dict_from_row(row)
                raise ValueError(f"Bookmark for URL '{url}' already exists.")
    finally:
        conn.close()


def get_all_bookmarks(user_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all bookmarks for a specific user, optionally filtered by category."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if is_postgres:
            if category and category.strip() and category.lower() != "all":
                cursor.execute(
                    "SELECT * FROM bookmarks WHERE user_id = %s AND LOWER(category) = LOWER(%s) ORDER BY id DESC",
                    (user_id, category.strip())
                )
            else:
                cursor.execute("SELECT * FROM bookmarks WHERE user_id = %s ORDER BY id DESC", (user_id,))
            rows = cursor.fetchall()
            return [dict_from_row(row) for row in rows]
        else:
            if category and category.strip() and category.lower() != "all":
                cursor.execute(
                    "SELECT * FROM bookmarks WHERE user_id = ? AND LOWER(category) = LOWER(?) ORDER BY id DESC",
                    (user_id, category.strip())
                )
            else:
                cursor.execute("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY id DESC", (user_id,))
            rows = cursor.fetchall()
            return [dict_from_row(row) for row in rows]
    finally:
        conn.close()


def search_bookmarks(user_id: str, query: str) -> List[Dict[str, Any]]:
    """Searches bookmarks for a specific user matching the query."""
    conn = get_connection()
    query_pattern = f"%{query.strip().lower()}%"
    try:
        cursor = conn.cursor()
        if is_postgres:
            cursor.execute("""
                SELECT * FROM bookmarks 
                WHERE user_id = %s AND (
                    LOWER(title) LIKE %s 
                    OR LOWER(summary) LIKE %s 
                    OR LOWER(category) LIKE %s 
                    OR LOWER(tags) LIKE %s
                )
                ORDER BY id DESC
            """, (user_id, query_pattern, query_pattern, query_pattern, query_pattern))
            rows = cursor.fetchall()
            return [dict_from_row(row) for row in rows]
        else:
            cursor.execute("""
                SELECT * FROM bookmarks 
                WHERE user_id = ? AND (
                    LOWER(title) LIKE ? 
                    OR LOWER(summary) LIKE ? 
                    OR LOWER(category) LIKE ? 
                    OR LOWER(tags) LIKE ?
                )
                ORDER BY id DESC
            """, (user_id, query_pattern, query_pattern, query_pattern, query_pattern))
            rows = cursor.fetchall()
            return [dict_from_row(row) for row in rows]
    finally:
        conn.close()


def delete_bookmark(user_id: str, bookmark_id: int) -> bool:
    """Deletes a bookmark by ID, verifying that it belongs to the authenticated user."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if is_postgres:
            cursor.execute("DELETE FROM bookmarks WHERE id = %s AND user_id = %s", (bookmark_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
        else:
            cursor.execute("DELETE FROM bookmarks WHERE id = ? AND user_id = ?", (bookmark_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
    finally:
        conn.close()


def dict_from_row(row: Any) -> Dict[str, Any]:
    """Helper to convert a SQL row (sqlite3 or psycopg2) to a standard dict."""
    if not row:
        return {}
    d = dict(row)
    if "tags" in d:
        if isinstance(d["tags"], str):
            try:
                d["tags"] = json.loads(d["tags"])
            except (json.JSONDecodeError, TypeError):
                d["tags"] = []
        elif not isinstance(d["tags"], list):
            d["tags"] = []
    return d


# Initialize DB tables
init_db()
