# 📌 Smart Bookmark Manager — Full-Stack AI Web Application

A modern full-stack web application powered by **FastAPI**, **LangGraph**, **Gemini 3.5 Flash**, **Server-Sent Events (SSE)**, **SQLite**, and **Next.js**.

Paste any URL to have an AI agent fetch the page, summarize its contents, auto-categorize it, and save it to your searchable bookmark library in real-time.

---

## 🏗️ Monorepo Architecture

```
bookmark-agent/
├── backend/                  # Python FastAPI + LangGraph + SQLite
│   ├── app/
│   │   ├── main.py           # REST APIs + SSE Stream Endpoint
│   │   ├── agent.py          # LangGraph & Gemini 3.5 Flash Engine
│   │   ├── database.py       # SQLite CRUD operations
│   │   └── schemas.py        # Pydantic structured output models
│   └── requirements.txt
└── frontend/                 # Next.js (App Router) + Tailwind CSS
    ├── app/
    │   ├── page.tsx          # Bookmarks Dashboard
    │   └── components/       # AddBookmark (SSE Stream), BookmarkCard, SearchBar
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

Open a terminal window:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
*(Backend runs at `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`)*

### 2. Start the Next.js Frontend

Open a second terminal window:
```bash
cd frontend
npm run dev
```
*(Frontend dashboard runs at `http://localhost:3000`)*

---

## ⚡ Real-Time SSE Streaming Flow

1. You paste a URL in the Next.js UI (`http://localhost:3000`).
2. Next.js opens an `EventSource` connection to FastAPI `GET /api/bookmarks/stream?url=...`.
3. The LangGraph agent runs asynchronously and streams live logs:
   - `Connecting to URL...`
   - `Extracting clean readable page text...`
   - `Analyzing & generating summary with Gemini 3.5 Flash...`
   - `Saving to SQLite database...`
4. The dashboard receives the final `bookmark` event and automatically refreshes the card grid.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| Backend API | FastAPI, Uvicorn, sse-starlette |
| AI Engine | LangGraph, Gemini 3.5 Flash (`langchain-google-genai`) |
| Web Scraping | `httpx`, `BeautifulSoup4` |
| Database | SQLite 3 (`bookmarks.db`) |
| Structured Output | Pydantic v2 |
