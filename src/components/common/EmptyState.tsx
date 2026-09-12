"use client";

import React from "react";

type Props = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
};

export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon = "📭",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-3xl mb-3 opacity-80">{icon}</div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
