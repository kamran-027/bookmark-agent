"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CATEGORIES = ["All", "AI", "Dev", "Design", "Finance", "Productivity", "News", "Other"];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Search Input Box with Glassmorphic Depth */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter bookmarks by keyword, topic, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.02)] transition-all font-normal"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 border border-slate-800"
                  : "bg-white/80 backdrop-blur-sm text-slate-600 hover:text-slate-950 hover:bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
