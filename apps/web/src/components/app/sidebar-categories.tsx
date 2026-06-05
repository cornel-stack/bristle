"use client";

import { useCategories } from "@/components/app/categories/categories-context";

// The sidebar's watched-categories list — a client consumer of the shell context
// (the one server→client conversion of slice 4.9), so an ephemerally-added custom
// category appears here immediately. Renders the watched set (incl. custom).
export function SidebarCategories() {
  const { categories } = useCategories();
  const watched = categories.filter((c) => c.watched);
  return (
    <div className="flex flex-col gap-tight">
      <p className="px-snug text-body-sm font-semibold uppercase tracking-wide text-text-tertiary">
        Categories
      </p>
      {watched.map((c) => (
        <div
          key={c.key}
          className="flex items-center justify-between px-snug py-1 text-body-md text-text-secondary"
        >
          <span>{c.label}</span>
          <span className="text-body-sm text-text-tertiary">{c.count}</span>
        </div>
      ))}
    </div>
  );
}
