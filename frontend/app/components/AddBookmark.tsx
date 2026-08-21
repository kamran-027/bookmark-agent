"use client";

import React, { useState } from "react";
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface AddBookmarkProps {
  onBookmarkAdded: () => void;
}

const DEMO_PRESETS = [
  { label: "LangGraph Docs", url: "https://python.langchain.com/docs/concepts/architecture/" },
  { label: "Anthropic Research", url: "https://www.anthropic.com/research" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
];

export const AddBookmark: React.FC<AddBookmarkProps> = ({ onBookmarkAdded }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    // Open EventSource SSE stream to FastAPI backend
    const streamUrl = `http://localhost:8000/api/bookmarks/stream?url=${encodeURIComponent(formattedUrl)}`;
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
      console.error("SSE connection error:", err);
      setErrorMessage("Could not connect to FastAPI server. Please ensure backend is running on port 8000.");
      eventSource.close();
      setLoading(false);
    };
  };

  return (
    <div className="relative mb-12">
      {/* Ambient Spotlight Glow behind input */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-sky-500/20 rounded-3xl blur-xl opacity-70 transition-all pointer-events-none" />

      {/* Main Command Bar Container */}
      <div className="relative bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:shadow-[0_8px_30px_rgb(99,102,241,0.12)] focus-within:border-indigo-400/80 transition-all">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <div className="pl-3 text-slate-400 flex items-center justify-center">
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>

          <input
            type="url"
            required
            placeholder="Paste any article, documentation, or blog URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent border-0 px-2 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 font-medium"
          />

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-1.5 bg-gradient-to-b from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/10 active:scale-95 cursor-pointer shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Save with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preset demo links */}
      <div className="flex items-center gap-2 mt-3 px-1 text-xs text-slate-500 overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick test:
        </span>
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setUrl(preset.url);
              handleSubmit(preset.url);
            }}
            disabled={loading}
            className="text-[11px] text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 px-2.5 py-1 rounded-lg transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer shrink-0"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Real-Time Streaming Progress Timeline with Glow Accent */}
      {statusLog.length > 0 && (
        <div className="mt-4 p-4 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </div>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-xs font-semibold text-slate-800 tracking-tight">
                {loading ? "Agent Execution in Progress" : "Processing Complete"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {statusLog.length} steps
            </span>
          </div>

          <div className="space-y-2 relative pl-2">
            <div className="absolute left-3.5 top-1 bottom-1 w-0.5 bg-slate-100" />
            {statusLog.map((log, idx) => {
              const isLast = idx === statusLog.length - 1;
              return (
                <div key={idx} className="flex items-start gap-3 text-xs relative z-10">
                  <div className="mt-0.5 bg-white rounded-full">
                    {!isLast || !loading ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                    )}
                  </div>
                  <span className={isLast && loading ? "text-slate-900 font-medium" : "text-slate-500"}>
                    {log}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Card */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-800">Failed to process URL</p>
            <p className="text-rose-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
