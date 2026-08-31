"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bookmark, Sparkles, LogIn, LogOut, User, CheckCircle2 } from "lucide-react";
import { LoginModal } from "./LoginModal";

interface NavbarProps {
  totalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ totalCount }) => {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isAuthenticated = status === "authenticated";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.02)] transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center shadow-md shadow-slate-900/10 border border-slate-700/40 shrink-0">
              <Bookmark className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  Recall
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
                  Cloud Sync
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal hidden xs:block sm:block truncate">
                Autonomous AI Knowledge Engine
              </p>
            </div>
          </div>

          {/* Right side stats & User Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 bg-slate-100/80 border border-slate-200/80 px-2.5 sm:px-3 py-1 rounded-full font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
              <span>{totalCount} <span className="hidden sm:inline">{totalCount === 1 ? "saved item" : "saved items"}</span></span>
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full transition-all active:scale-95 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="w-6 h-6 rounded-full object-cover border border-indigo-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[100px] truncate">{session?.user?.name || "Account"}</span>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {session?.user?.name || "User"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {session?.user?.email}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Persistent Storage Active</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          signOut({ callbackUrl: window.location.href });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/80 transition-colors font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-white rounded-full text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-300" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};
