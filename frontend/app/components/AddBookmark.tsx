"use client";

import React, { useState } from "react";

interface AddBookmarkProps {
  onBookmarkAdded: () => void;
}

export const AddBookmark: React.FC<AddBookmarkProps> = ({ onBookmarkAdded }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    setLoading(true);
    setStatusLog([]);
    setErrorMessage(null);

    // Open EventSource SSE stream to FastAPI backend
    const streamUrl = `http://localhost:8000/api/bookmarks/stream?url=${encodeURIComponent(targetUrl)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === "status") {
          setStatusLog((prev) => [...prev, payload.data]);
        } else if (payload.event === "bookmark") {
          setStatusLog((prev) => [...prev, "✅ Bookmark created successfully!"]);
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
      setErrorMessage("Lost connection to backend server. Make sure FastAPI is running on port 8000.");
      eventSource.close();
      setLoading(false);
    };
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>⚡</span> Add New Bookmark
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="url"
          required
          placeholder="Paste URL here (e.g. https://python.langchain.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Bookmark</span>
          )}
        </button>
      </form>

      {/* SSE Real-Time Progress Stream Log */}
      {statusLog.length > 0 && (
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Agent Execution Log:</span>
            {loading && <span className="text-indigo-400 animate-pulse">Live Streaming...</span>}
          </p>
          <div className="space-y-1 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto">
            {statusLog.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-indigo-400">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-800/50 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
