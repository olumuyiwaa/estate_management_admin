"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  path: string;
  icon: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Residents", path: "/residents", icon: "🏠" },
  { name: "Staff", path: "/staff", icon: "👷" },
  { name: "Users & Roles", path: "/users", icon: "👤" },
  { name: "Visitors", path: "/visitors", icon: "🚪" },
  { name: "Vehicle Access", path: "/vehicles", icon: "🚗" },
  { name: "Service Requests", path: "/service-requests", icon: "🛠️" },
  { name: "Collections", path: "/collections", icon: "💰" },
  { name: "Announcements", path: "/announcements", icon: "📢" },
  { name: "Issues", path: "/issues", icon: "⚠️" },
  { name: "Marketplace", path: "/marketplace", icon: "🛒" },
];

const accountItems: NavItem[] = [
  { name: "Profile", path: "/profile", icon: "⚙️" },
];

export default function AppSidebar() {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  // Desktop: expand or hover shows labels. Mobile: always show when open.
  const showLabels = isExpanded || isHovered || isMobileOpen;
  const widthClass = showLabels ? "w-[260px]" : "w-[80px]";

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobileOpen) toggleMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.path}>
          <Link
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            } ${!showLabels ? "justify-center" : ""}`}
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            {showLabels && <span className="truncate">{item.name}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
          ${widthClass}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full px-4 py-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold shrink-0">
                C
              </div>
              {showLabels && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white block leading-tight">
                    Corvanta
                  </span>
                  <span className="text-xs text-gray-500">Estate Admin</span>
                </div>
              )}
            </Link>
            {/* Close on mobile */}
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto no-scrollbar">
            <div className="mb-6">
              {showLabels && (
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Menu
                </p>
              )}
              {renderItems(navItems)}
            </div>
            <div>
              {showLabels && (
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Account
                </p>
              )}
              {renderItems(accountItems)}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
