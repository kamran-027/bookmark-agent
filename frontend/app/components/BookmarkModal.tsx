"use client";

import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, Calendar, Tag, Sparkles, Trash2 } from "lucide-react";
import { Bookmark } from "./BookmarkCard";

interface BookmarkModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  bookmark,
  isOpen,
  onClose,
  onDelete,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !bookmark) return null;

  let hostname = bookmark.url;
  try {
    hostname = new URL(bookmark.url).hostname.replace(/^www\./, "");
  } catch {
    hostname = bookmark.url;
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(bookmark.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container: Bottom sheet on mobile, floating dialog on desktop */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden z-10 max-h-[92vh] sm:max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt=""
              className="w-4 h-4 rounded-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="text-xs font-medium text-slate-500 truncate max-w-[130px] sm:max-w-[200px]">
              {hostname}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 shrink-0">
              {bookmark.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline sm:inline">{copiedUrl ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 sm:space-y-6 flex-1 -mr-1">
          {/* Article Title */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug break-words">
              {bookmark.title}
            </h2>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline mt-2 font-medium break-all"
            >
              <span>Visit Original Article</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Full AI Summary Box */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="flex items-center justify-between mb-2.5 border-b border-slate-200/60 pb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Complete AI Synthesis
              </span>
              <button
                onClick={handleCopySummary}
                className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
              >
                {copiedSummary ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSummary ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line break-words">
              {bookmark.summary}
            </p>
          </div>

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Identified Topics & Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bookmark.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-white text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-medium shadow-sm"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Meta & Actions */}
        <div className="flex items-center justify-between pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-normal">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{bookmark.created_at}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onDelete(bookmark.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 sm:px-4 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
