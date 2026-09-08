"use client";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/app/auth/useAuth";

export default function AppHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const displayName =
    user?.displayName ||
    user?.firstName ||
    user?.userName ||
    "Admin";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              toggleMobileSidebar();
            } else {
              toggleSidebar();
            }
          }}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate hidden sm:block">
          Estate Management Portal
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[160px]">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-[160px]">
            {user?.email || user?.userName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
