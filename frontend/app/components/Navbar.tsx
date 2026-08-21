"use client";

import React from "react";
import { Bookmark, Sparkles } from "lucide-react";

interface NavbarProps {
  totalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ totalCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/70 px-6 py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center shadow-md shadow-slate-900/10 border border-slate-700/40">
            <Bookmark className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Recall
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
                Live Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              Autonomous URL Ingestion & Synthesis
            </p>
          </div>
        </div>

        {/* Right side stats & links */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/70 border border-slate-200/80 px-3 py-1 rounded-full font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{totalCount} {totalCount === 1 ? "saved item" : "saved items"}</span>
          </div>

          <a
            href="https://github.com/kamran-027/bookmark-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="View Source on GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
