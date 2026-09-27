# 📌 Recall — Autonomous AI Knowledge Engine

<div align="center">

**A full-stack, autonomous web curation platform that ingests, converts to Markdown, synthesizes with Gemini AI, and organizes web content in real-time.**

Built with **Next.js 15**, **FastAPI**, **Gemini Flash**, **Supabase PostgreSQL**, **Jina Reader**, **NextAuth OAuth**, and **Server-Sent Events (SSE)**.

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🌟 Key Features

* **⚡ Real-Time SSE Agent Streaming**: When you paste a URL, the Next.js UI connects to FastAPI via Server-Sent Events (`EventSource`), streaming the agent's internal progress live step-by-step (*Connecting* ➔ *Markdown Extraction* ➔ *Gemini Synthesis* ➔ *Supabase Commit*).
* **📑 Markdown-First Web Extraction**: Scrapes web pages directly into clean, structured Markdown using **Jina Reader** (`r.jina.ai`). Automatically renders dynamic JavaScript (SPAs like React/Vue), strips navigation bars, ads, and cookie banners, preserving headings, code snippets, and lists.
* **🧠 Structured AI Synthesis**: Uses Gemini Flash with **Pydantic v2 schemas** (`BookmarkSchema`) to enforce strict type-safe outputs (page title, concise 2–3 sentence summary, category tags, and keywords).
* **🔐 Multi-User OAuth & Private Libraries**: Integrated with NextAuth for seamless **Google** and **GitHub** OAuth authentication. Every user gets a private, user-isolated bookmark collection stored securely in Supabase.
* **☁️ Supabase PostgreSQL Cloud Persistence**: Fully backed by Supabase with connection pooling (Supavisor) and automatic relational schema initialization (with SQLite fallback for offline local dev).
* **📚 Reader View & Inline Expand**: View full summaries via an inline toggle or open the focused **Reader View Modal** with one-click copy buttons.
* **🔍 Instant Search & Categorization**: Filter by category pills (`AI`, `Dev`, `Design`, `Finance`, `Productivity`, `News`) or search across titles, summaries, and tags in real time.
* **🎨 Aceternity-Inspired Minimal UI**: Modern light slate palette with ambient lighting orbs, radial grid masks, favicon integration, and category-colored hairline card accents.

---

## 🏗️ Architecture

```
                                  USER (Browser)
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              NextAuth SSO (Google/GitHub)     Next.js 15 (Frontend Dashboard)
              • JWT Session Management         • EventSource SSE Consumer
                         │                     • Real-time Library Views
                         └──────────────┬──────────────┘
                                        │
                             HTTP REST / SSE Stream
                           (Bearer User Auth Header)
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │         FastAPI (Backend Server)        │
                    │  • User-Scoped Dependency Injection     │
                    │  • Async Routes & CORS Handling         │
                    │  • sse-starlette Streaming Pipeline     │
                    └────────────────────┬────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
       ┌──────────────────────────────────┐    ┌───────────────────────────────┐
       │      Agent Ingestion Engine      │    │       Supabase Cloud DB       │
       │  • Jina Reader (Markdown API)    │    │  • PostgreSQL (Port 6543)     │
       │  • BeautifulSoup (Local Fallback)│    │  • Scoped by user_id          │
       │  • Gemini Flash Synthesis        │    │  • Tables: users, bookmarks   │
       │  • Pydantic Structured Output    │    │  • SQLite bookmarks.db (dev)  │
       └──────────────────────────────────┘    └───────────────────────────────┘
```

---

## 📁 Monorepo Structure

```text
bookmark-agent/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI REST & SSE stream endpoints
│   │   ├── agent.py            # Markdown scraper & Gemini synthesis engine
│   │   ├── database.py         # Dual-mode DB layer (Supabase PostgreSQL / SQLite)
│   │   ├── auth.py             # NextAuth JWT & Bearer user verification
│   │   └── schemas.py          # Pydantic schema models (BookmarkSchema)
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Secrets (DATABASE_URL, GEMINI_API_KEY, AUTH_SECRET)
│
├── frontend/                   # Next.js 15 App Router
│   ├── app/
│   │   ├── page.tsx            # Main Dashboard & bookmark state
│   │   ├── layout.tsx          # App Shell & AuthProvider wrapper
│   │   ├── globals.css         # Theme, grid masks & depth styles
│   │   ├── api/auth/[...nextauth]/route.ts # NextAuth OAuth handlers (Google, GitHub)
│   │   └── components/
│   │       ├── Navbar.tsx      # Sticky Glass Header & User Profile
│   │       ├── AddBookmark.tsx # Command Bar & Live SSE Timeline
│   │       ├── SearchBar.tsx   # Search input & Category pills
│   │       ├── BookmarkCard.tsx# Grid Card with Favicon & Expand
│   │       ├── BookmarkModal.tsx# Reader View Popup Dialog
│   │       └── LoginModal.tsx  # OAuth Sign-In Modal
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
* **Supabase Project** *(Free)*

---

### Step 1: Configure Backend Environment

Create or edit `backend/.env`:
```env
# 1. Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Supabase PostgreSQL Connection String (Transaction Pooler - Port 6543)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# 3. NextAuth JWT Shared Secret
AUTH_SECRET=your_super_secret_jwt_key_here
```

> [!TIP]
> If your Supabase password contains special characters like `@`, URL-encode it (e.g. `@` becomes `%40`).

---

### Step 2: Configure Frontend Environment

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_jwt_key_here

# Optional: OAuth Providers (Google & GitHub)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

---

### Step 3: Start the FastAPI Backend (Terminal 1)

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

### Step 4: Start the Next.js Frontend (Terminal 2)

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
| `GET` | `/api/bookmarks` | Fetch bookmarks for the authenticated user (supports `?category=AI`) |
| `GET` | `/api/bookmarks/search?q={query}` | Keyword search across user's titles, summaries, and tags |
| `DELETE`| `/api/bookmarks/{id}` | Delete a user bookmark by ID |
| `GET` | `/api/bookmarks/stream?url={url}&token={token}` | **SSE EventStream**: Ingests URL in Markdown, synthesizes via Gemini, and saves to user's Supabase storage |
| `GET` | `/api/user/sync` | Syncs/upserts authenticated OAuth user record into Supabase |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15, React, Tailwind CSS | Modern light slate dashboard interface |
| **Authentication** | NextAuth.js | Google & GitHub OAuth SSO + Demo Account |
| **Backend** | FastAPI, Uvicorn, sse-starlette | High-performance async REST & SSE streaming API |
| **Database** | Supabase (PostgreSQL 15) | User-isolated persistent cloud storage with Supavisor pooling |
| **Scraping** | Jina Reader (`r.jina.ai`) + `httpx` | Markdown-first extraction with dynamic JavaScript & SPA support |
| **AI Synthesis** | Google Gemini Flash | High-speed structured summarization via Pydantic schemas |
| **Validation** | Pydantic v2 | Strict type safety for agent outputs |

---

<div align="center">
Built as part of the <b>Cadence Labs</b> AI Agent & Full-Stack Architecture Series.
</div>
