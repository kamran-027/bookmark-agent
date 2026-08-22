"use client";

import React, { useState } from "react";
import { ExternalLink, Trash2, Copy, Check, Calendar, Tag, Maximize2, ChevronDown, ChevronUp } from "lucide-react";
import { API_URL } from "../config";

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
  onSelect?: (bookmark: Bookmark) => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  AI: "from-purple-500 via-indigo-500 to-sky-500",
  Dev: "from-blue-500 to-cyan-500",
  Design: "from-pink-500 to-rose-500",
  Finance: "from-emerald-500 to-teal-500",
  Productivity: "from-amber-500 to-orange-500",
  News: "from-sky-500 to-indigo-500",
  Other: "from-slate-400 to-slate-600",
};

const CATEGORY_PILLS: Record<string, string> = {
  AI: "bg-purple-50/80 text-purple-700 border-purple-200/60",
  Dev: "bg-blue-50/80 text-blue-700 border-blue-200/60",
  Design: "bg-pink-50/80 text-pink-700 border-pink-200/60",
  Finance: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60",
  Productivity: "bg-amber-50/80 text-amber-700 border-amber-200/60",
  News: "bg-sky-50/80 text-sky-700 border-sky-200/60",
  Other: "bg-slate-50 text-slate-700 border-slate-200/60",
};

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onDelete, onSelect }) => {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/api/bookmarks/${bookmark.id}`, {
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let hostname = bookmark.url;
  try {
    hostname = new URL(bookmark.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = bookmark.url;
  }

  const gradientLine = CATEGORY_GRADIENTS[bookmark.category] || CATEGORY_GRADIENTS.Other;
  const pillStyle = CATEGORY_PILLS[bookmark.category] || CATEGORY_PILLS.Other;
  const isLongSummary = (bookmark.summary || "").length > 160;

  return (
    <div className="group relative bg-white/85 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/90 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-1 overflow-hidden">
      {/* Top Hairline Gradient Accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${gradientLine} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt=""
              className="w-4 h-4 rounded-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
              {hostname}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border ${pillStyle} shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`}>
              {bookmark.category}
            </span>

            {onSelect && (
              <button
                onClick={() => onSelect(bookmark)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Open Reader View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm leading-snug mb-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-start justify-between gap-2"
          >
            <span>{bookmark.title}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </a>
        </h3>

        {/* AI Summary with Inline Expand Toggle */}
        <div className="mb-4">
          <p
            className={`text-xs text-slate-600 leading-relaxed font-normal transition-all ${
              !isExpanded ? "line-clamp-3" : ""
            }`}
          >
            {bookmark.summary}
          </p>

          {isLongSummary && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium mt-1.5 cursor-pointer"
            >
              <span>{isExpanded ? "Show less" : "Read full summary"}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Keyword Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bookmark.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 text-[10px] bg-slate-50/90 text-slate-600 border border-slate-200/70 px-2 py-0.5 rounded-md font-normal shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-400">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{bookmark.created_at}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Bookmark"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
