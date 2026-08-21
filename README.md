# 📌 Recall — Autonomous AI Knowledge Engine

<div align="center">

**A full-stack, autonomous web curation platform that ingests, summarizes, categorizes, and searches web content in real-time.**

Built with **Next.js 15**, **FastAPI**, **LangGraph**, **Gemini 3.5 Flash**, **Server-Sent Events (SSE)**, and **SQLite**.

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com/)
[![Gemini](https://img.shields.io/badge/Gemini_3.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/SQLite_3-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

</div>

---

## 🌟 Key Features

* **⚡ Real-Time SSE Agent Streaming**: When you paste a URL, the Next.js UI connects to FastAPI via Server-Sent Events (`EventSource`), streaming the agent's internal progress live step-by-step (*Connecting* ➔ *Extracting HTML* ➔ *Gemini Synthesis* ➔ *Database Commit*).
* **🧠 Structured AI Synthesis**: Uses Gemini 3.5 Flash with **Pydantic v2 schemas** (`BookmarkSchema`) to enforce strict type-safe outputs (page title, 2–3 sentence summary, category tags, and keywords).
* **📚 Reader View & Inline Expand**: View full, un-truncated summaries via an inline toggle or open the focused **Reader View Modal** with one-click copy buttons.
* **🔍 Instant Search & Categorization**: Filter by category pills (`AI`, `Dev`, `Design`, `Finance`, `Productivity`, `News`) or search across titles, summaries, and tags in real time.
* **💾 Local SQLite Persistence**: Stores all records inside an embedded `bookmarks.db` database with zero external server dependencies.
* **🎨 Aceternity-Inspired Minimal UI**: Modern light slate palette with ambient lighting orbs, radial grid masks, favicon integration, and category-colored hairline card accents.

---

## 🏗️ Architecture

```
                                  USER (Browser)
                                        │
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │       Next.js 15 (Frontend Dashboard)   │
                   │  • EventSource SSE Consumer  • Tailwind │
                   └────────────────────┬────────────────────┘
                                        │
                             HTTP REST / SSE Stream
                                        │
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │         FastAPI (Backend Server)        │
                   │  • Async Routes  • CORS  • sse-starlette│
                   └────────────────────┬────────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
      ┌──────────────────────────────────┐    ┌──────────────────┐
      │     LangGraph & Gemini Engine    │    │  SQLite Database │
      │  • httpx (Web Scraper)           │    │  • bookmarks.db  │
      │  • BeautifulSoup (HTML Stripper) │    │  • CRUD layer    │
      │  • Pydantic Structured Output    │    └──────────────────┘
      └──────────────────────────────────┘
```

---

## 📁 Monorepo Structure

```text
bookmark-agent/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI REST & SSE stream endpoints
│   │   ├── agent.py            # LangGraph / Gemini 3.5 Flash engine
│   │   ├── database.py         # SQLite CRUD layer
│   │   └── schemas.py          # Pydantic schema models
│   ├── bookmarks.db            # Auto-generated SQLite Database
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Secrets (GEMINI_API_KEY)
│
├── frontend/                   # Next.js 15 App Router
│   ├── app/
│   │   ├── page.tsx            # Main Dashboard
│   │   ├── layout.tsx          # App Shell & Metadata
│   │   ├── globals.css         # Theme, grid masks & depth styles
│   │   ├── icon.svg            # Custom SVG Favicon
│   │   └── components/
│   │       ├── Navbar.tsx      # Sticky Glass Header & Counter
│   │       ├── AddBookmark.tsx # Command Bar & Live SSE Timeline
│   │       ├── SearchBar.tsx   # Search input & Category pills
│   │       ├── BookmarkCard.tsx# Grid Card with Favicon & Expand
│   │       └── BookmarkModal.tsx# Reader View Popup Dialog
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** 18+ & **npm**
* **Python** 3.9+
* **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) *(Free)*

---

### Step 1: Configure Environment

Create `backend/.env` and add your API key:
```bash
echo "GEMINI_API_KEY=your_actual_key_here" > backend/.env
```

---

### Step 2: Start the FastAPI Backend (Terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* **Backend API**: `http://localhost:8000`
* **Interactive Docs**: `http://localhost:8000/docs`

---

### Step 3: Start the Next.js Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```
* **Frontend App**: Open **`http://localhost:3000`** in your browser.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bookmarks` | Fetch all bookmarks (supports `?category=AI` query filter) |
| `GET` | `/api/bookmarks/search?q={query}` | Full-text search across titles, summaries, and tags |
| `DELETE`| `/api/bookmarks/{id}` | Delete a bookmark by ID |
| `GET` | `/api/bookmarks/stream?url={url}` | **SSE EventStream**: Emits real-time progress steps and returns the saved bookmark object |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15, React, Tailwind CSS | High-fidelity dashboard interface |
| **Icons** | Lucide React | Clean, scalable vector iconography |
| **Backend** | FastAPI, Uvicorn, sse-starlette | Async REST & Server-Sent Events API |
| **Agent / LLM** | LangGraph, Gemini 3.5 Flash | Autonomous reasoning, scraping, & synthesis |
| **Scraping** | `httpx`, `BeautifulSoup4` | Fast async HTTP client & HTML parsing |
| **Database** | SQLite 3 (`bookmarks.db`) | Embedded, zero-configuration local database |
| **Validation** | Pydantic v2 | Strict type enforcement for AI output |

---

<div align="center">
Built as part of the <b>Cadence Labs</b> AI Agent Mastery Series.
</div>
