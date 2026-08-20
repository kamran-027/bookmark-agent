"use client";

import React, { useState } from "react";

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Dev: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Design: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Productivity: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  News: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Other: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`http://localhost:8000/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(bookmark.id);
      }
    } catch (err) {
      console.error("Failed to delete bookmark:", err);
    } finally {
      setDeleting(false);
    }
  };

  const badgeColor = CATEGORY_COLORS[bookmark.category] || CATEGORY_COLORS.Other;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg hover:shadow-indigo-500/5">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
            {bookmark.category}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {bookmark.created_at}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-base leading-snug mb-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-start gap-1.5"
          >
            <span>{bookmark.title}</span>
            <span className="text-xs text-slate-500 shrink-0 mt-1">↗</span>
          </a>
        </h3>

        {/* Summary */}
        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
          {bookmark.summary}
        </p>
      </div>

      <div>
        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bookmark.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Link & Delete */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium truncate max-w-[200px]"
          >
            {bookmark.url.replace(/^https?:\/\//, "")}
          </a>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete Bookmark"
            className="text-slate-500 hover:text-red-400 transition-colors text-xs p-1 rounded cursor-pointer"
          >
            {deleting ? "..." : "🗑️"}
          </button>
        </div>
      </div>
    </div>
  );
};
