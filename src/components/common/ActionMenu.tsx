"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ActionMenuItem = {
  label: string;
  onClick: () => void;
  /** Visual style */
  variant?: "default" | "danger" | "success" | "warning";
  /** Skip rendering when true */
  hidden?: boolean;
  disabled?: boolean;
  /** Optional divider above this item */
  divider?: boolean;
};

type Props = {
  items: ActionMenuItem[];
  /** Accessible label for the trigger */
  label?: string;
  className?: string;
};

const variantClass: Record<NonNullable<ActionMenuItem["variant"]>, string> = {
  default: "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80",
  danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10",
  success: "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10",
  warning: "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10",
};

/**
 * Compact ⋮ (more-vert) trigger that opens a dropdown of row actions.
 * Closes on outside click, Escape, and after an item is chosen.
 */
export default function ActionMenu({
  items,
  label = "Row actions",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 176; // w-44
    const estimatedHeight = visible.length * 36 + 8;
    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;
    // Flip up if near bottom of viewport
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 4);
    }
    // Keep in horizontal bounds
    left = Math.min(Math.max(8, left), window.innerWidth - menuWidth - 8);
    setCoords({ top, left });
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <div className={`inline-flex justify-end ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 transition-colors"
      >
        {/* Material-style more_vert */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 80,
            }}
            className="w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 text-sm"
          >
            {visible.map((item, idx) => (
              <React.Fragment key={`${item.label}-${idx}`}>
                {item.divider && (
                  <div
                    className="my-1 border-t border-gray-100 dark:border-gray-700"
                    role="separator"
                  />
                )}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`w-full text-left px-3 py-2 disabled:opacity-40 disabled:pointer-events-none ${
                    variantClass[item.variant || "default"]
                  }`}
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
