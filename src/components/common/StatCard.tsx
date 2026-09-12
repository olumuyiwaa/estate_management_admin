"use client";

import Link from "next/link";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  accent?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  href,
  accent = "bg-brand-500",
}: Props) {
  const inner = (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg ${accent} opacity-90 flex items-center justify-center text-white text-sm shrink-0`}
        >
          →
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${accent} opacity-40`} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}
