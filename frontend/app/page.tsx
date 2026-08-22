"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { AddBookmark } from "./components/AddBookmark";
import { SearchBar } from "./components/SearchBar";
import { BookmarkCard, Bookmark } from "./components/BookmarkCard";
import { BookmarkModal } from "./components/BookmarkModal";
import { API_URL } from "./config";
import { Inbox, AlertCircle, RefreshCw, Cpu, Database, Radio, Sparkles } from "lucide-react";

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Fetch bookmarks from FastAPI backend
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setBackendError(false);
    try {
      let endpoint = `${API_URL}/api/bookmarks`;
      if (searchQuery.trim()) {
        endpoint = `${API_URL}/api/bookmarks/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } else if (selectedCategory && selectedCategory !== "All") {
        endpoint = `${API_URL}/api/bookmarks?category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      } else {
        setBackendError(true);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleDelete = (id: number) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Ambient Glow Background Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 ambient-glow-1 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-48 right-1/4 w-96 h-96 ambient-glow-2 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar totalCount={bookmarks.length} />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Backend Offline Alert */}
        {backendError && (
          <div className="mb-8 p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">FastAPI Server Offline</p>
                <p className="text-amber-700 mt-0.5">
                  Could not connect to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">http://localhost:8000</code>.
                  Please ensure backend is started via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">uvicorn app.main:app --port 8000</code>.
                </p>
              </div>
            </div>
            <button
              onClick={fetchBookmarks}
              className="inline-flex items-center gap-1 bg-white border border-amber-300 px-3 py-1.5 rounded-lg text-amber-900 hover:bg-amber-100 font-medium transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-10 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/80 border border-slate-200/90 text-slate-700 px-3 py-1 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Autonomous Web Curation & Synthesis</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-2.5">
            Your AI Knowledge Base
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Paste any link. The LangGraph agent extracts, analyzes, synthesizes, and catalogs it automatically in real time.
          </p>

          {/* Architecture Highlights Pill Strip */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-500" /> SSE Live Streaming
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-500" /> Gemini 3.5 Flash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-500" /> SQLite Embedded
            </span>
          </div>
        </div>

        {/* Add Bookmark Section with Live SSE Stream */}
        <AddBookmark onBookmarkAdded={fetchBookmarks} />

        {/* Search & Filter Toolbar */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Bookmarks Grid / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            <p className="text-xs font-medium">Retrieving saved knowledge...</p>
          </div>
        ) : bookmarks.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {selectedCategory === "All" ? "All Bookmarks" : `${selectedCategory} Collection`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {bookmarks.length} {bookmarks.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  onSelect={(b) => setSelectedBookmark(b)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              {searchQuery || selectedCategory !== "All"
                ? "No matching entries"
                : "Your knowledge base is empty"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "Try clearing your search query or selecting another category filter."
                : "Paste a URL above or click one of the quick test presets to ingest your first article."}
            </p>
          </div>
        )}
      </main>

      {/* Reader View Detail Modal */}
      <BookmarkModal
        bookmark={selectedBookmark}
        isOpen={!!selectedBookmark}
        onClose={() => setSelectedBookmark(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
