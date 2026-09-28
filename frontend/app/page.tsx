"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "./components/Navbar";
import { AddBookmark } from "./components/AddBookmark";
import { SearchBar } from "./components/SearchBar";
import { BookmarkCard, Bookmark } from "./components/BookmarkCard";
import { BookmarkModal } from "./components/BookmarkModal";
import { LoginModal } from "./components/LoginModal";
import { CURATED_DEMO_BOOKMARKS } from "./data/demoBookmarks";
import { API_URL } from "./config";
import {
  Inbox,
  AlertCircle,
  RefreshCw,
  Cpu,
  Database,
  Radio,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  UserCheck,
  LogIn
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isAuthenticated = status === "authenticated";

  // Sync user with backend when authenticated
  useEffect(() => {
    const userId = session?.user?.email || (session?.user as any)?.id || (session as any)?.accessToken?.userId || "";
    if (isAuthenticated && userId) {
      fetch(`${API_URL}/api/user/sync`, {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      }).catch((err) => console.error("User sync error:", err));
    }
  }, [session, isAuthenticated]);

  // Fetch bookmarks from FastAPI backend
  const fetchBookmarks = useCallback(async () => {
    // Wait until NextAuth finishes loading the session from storage/cookies
    if (status === "loading") return;

    setLoading(true);
    setBackendError(false);

    try {
      let endpoint = `${API_URL}/api/bookmarks`;
      if (searchQuery.trim()) {
        endpoint = `${API_URL}/api/bookmarks/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } else if (selectedCategory && selectedCategory !== "All") {
        endpoint = `${API_URL}/api/bookmarks?category=${encodeURIComponent(selectedCategory)}`;
      }

      const headers: Record<string, string> = {};
      const userId = session?.user?.email || (session?.user as any)?.id || "";
      if (status === "authenticated" && userId) {
        headers["Authorization"] = `Bearer ${userId}`;
      }

      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data: Bookmark[] = await res.json();

        // If authenticated, show user's own data (even if empty)
        if (status === "authenticated") {
          setBookmarks(data || []);
        } else {
          // If guest, show user bookmarks or fallback to curated demo bookmarks
          if (data && data.length > 0) {
            setBookmarks(data);
          } else {
            // Filter curated demo bookmarks by search and category
            let filteredDemo = CURATED_DEMO_BOOKMARKS;
            if (selectedCategory !== "All") {
              filteredDemo = filteredDemo.filter(
                (b) => b.category.toLowerCase() === selectedCategory.toLowerCase()
              );
            }
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              filteredDemo = filteredDemo.filter(
                (b) =>
                  b.title.toLowerCase().includes(q) ||
                  b.summary.toLowerCase().includes(q) ||
                  b.tags.some((t) => t.toLowerCase().includes(q))
              );
            }
            setBookmarks(filteredDemo);
          }
        }
      } else {
        setBackendError(true);
        if (status !== "authenticated") setBookmarks(CURATED_DEMO_BOOKMARKS);
      }
    } catch (err) {
      setBackendError(true);
      if (status !== "authenticated") setBookmarks(CURATED_DEMO_BOOKMARKS);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, session, status]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleDelete = (id: number) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Ambient Glow Background Orbs */}
      <div className="fixed top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 ambient-glow-1 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-48 right-1/4 w-72 sm:w-96 h-72 sm:h-96 ambient-glow-2 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar totalCount={bookmarks.length} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Backend Offline Alert */}
        {backendError && (
          <div className="mb-6 p-3 sm:p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Backend Server Offline:</strong> Run <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-900 font-semibold">uvicorn app.main:app --port 8000</code> to connect.
              </span>
            </div>
            <button
              onClick={fetchBookmarks}
              className="inline-flex items-center gap-1 bg-white border border-amber-300 px-2.5 py-1 rounded-xl text-amber-900 hover:bg-amber-100 font-medium transition-colors cursor-pointer shrink-0 shadow-sm text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Cohesive Hero Section */}
        <div className="mb-6 sm:mb-8 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/80 border border-slate-200/80 text-slate-600 px-3 py-1 rounded-full shadow-sm mb-2.5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Autonomous AI with Persistent Memory</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-1.5">
            Your AI Knowledge Base
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
            Paste any link to extract clean Markdown, synthesize key insights, and save to your private collection.
          </p>
        </div>

        {/* Add Bookmark Command Bar */}
        <AddBookmark
          onBookmarkAdded={fetchBookmarks}
          onRequireAuth={() => setShowLoginModal(true)}
        />

        {/* Library Section Header */}
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedCategory === "All" ? "Saved Knowledge" : `${selectedCategory} Collection`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAuthenticated
                  ? session?.user?.email || session?.user?.name || "Your personal library"
                  : "Sign in with Google to create your private collection"}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono font-medium">
              {bookmarks.length} {bookmarks.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* Bookmarks Grid / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            <p className="text-xs font-medium">Retrieving saved knowledge...</p>
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDelete}
                onSelect={(b) => setSelectedBookmark(b)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
