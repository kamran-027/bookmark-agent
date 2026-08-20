"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { AddBookmark } from "./components/AddBookmark";
import { SearchBar } from "./components/SearchBar";
import { BookmarkCard, Bookmark } from "./components/BookmarkCard";

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch bookmarks from FastAPI backend
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "http://localhost:8000/api/bookmarks";
      if (searchQuery.trim()) {
        endpoint = `http://localhost:8000/api/bookmarks/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } else if (selectedCategory && selectedCategory !== "All") {
        endpoint = `http://localhost:8000/api/bookmarks?category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar totalCount={bookmarks.length} />

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Add Bookmark Section with SSE Stream */}
        <AddBookmark onBookmarkAdded={fetchBookmarks} />

        {/* Search & Filter Controls */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Bookmarks Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs">Loading your bookmarks...</p>
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8">
            <div className="text-3xl mb-3">📭</div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">
              No Bookmarks Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search query or selecting a different category filter."
                : "Paste a URL above to let Gemini analyze, summarize, and save your first bookmark!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
