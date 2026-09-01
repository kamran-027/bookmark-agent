"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles, LogIn } from "lucide-react";
import { API_URL } from "../config";

interface AddBookmarkProps {
  onBookmarkAdded: () => void;
  onRequireAuth?: () => void;
}

const DEMO_PRESETS = [
  { label: "LangGraph Docs", url: "https://python.langchain.com/docs/concepts/architecture/" },
  { label: "Anthropic Research", url: "https://www.anthropic.com/research" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
];

export const AddBookmark: React.FC<AddBookmarkProps> = ({ onBookmarkAdded, onRequireAuth }) => {
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSynthesized, setJustSynthesized] = useState(false);

  const isAuthenticated = status === "authenticated";

  const handleSubmit = (targetUrlString?: string) => {
    const inputUrl = (targetUrlString || url).trim();
    if (!inputUrl || loading) return;

    let formattedUrl = inputUrl;
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    setUrl(formattedUrl);
    setLoading(true);
    setStatusLog([]);
    setErrorMessage(null);
    setJustSynthesized(false);

    // Open EventSource SSE stream to FastAPI backend with optional auth token
    const token = (session as any)?.accessToken?.userId || (session?.user as any)?.id || "";
    let streamUrl = `${API_URL}/api/bookmarks/stream?url=${encodeURIComponent(formattedUrl)}`;
    if (token) {
      streamUrl += `&token=${encodeURIComponent(token)}`;
    }

    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === "status") {
          setStatusLog((prev) => [...prev, payload.data]);
        } else if (payload.event === "bookmark") {
          setStatusLog((prev) => [...prev, "Saved to library"]);
          setUrl("");
          onBookmarkAdded();
          eventSource.close();
          setLoading(false);
          if (!isAuthenticated) {
            setJustSynthesized(true);
          }
        } else if (payload.event === "error") {
          setErrorMessage(payload.data);
          eventSource.close();
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setErrorMessage("Lost connection to server while analyzing URL.");
      eventSource.close();
      setLoading(false);
    };
  };

  return (
    <div className="mb-6 sm:mb-8 max-w-2xl mx-auto">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Paste any article or website URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50/90 border border-slate-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-white px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Ingest & Save</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>
        </form>

        {/* Quick Test Presets */}
        {!loading && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Quick test:
            </span>
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSubmit(preset.url)}
                className="px-2 py-0.5 rounded-lg bg-slate-100/70 hover:bg-slate-200/80 text-slate-600 font-medium transition-colors cursor-pointer active:scale-95 text-[10px] sm:text-[11px]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Guest Claim & Save Success Banner */}
        {justSynthesized && !isAuthenticated && (
          <div className="mt-3.5 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bookmark synthesized! Sign in to claim and save permanently.</span>
            </div>
            {onRequireAuth && (
              <button
                onClick={onRequireAuth}
                className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Claim Bookmark</span>
              </button>
            )}
          </div>
        )}

        {/* SSE Live Progress Stream Log */}
        {loading && statusLog.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100/80 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              <span>Agent Execution Pipeline</span>
              <span className="animate-pulse text-indigo-600 font-semibold">Active</span>
            </div>
            <div className="space-y-1">
              {statusLog.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-slate-600 animate-in fade-in slide-in-from-left-1 duration-150"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
