import React from "react";

interface NavbarProps {
  totalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ totalCount }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            📌
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Bookmark Agent
            </h1>
            <p className="text-xs text-slate-400">
              Powered by LangGraph & Gemini 3.5 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full font-medium">
            {totalCount} {totalCount === 1 ? "Bookmark" : "Bookmarks"} Saved
          </span>
        </div>
      </div>
    </header>
  );
};
