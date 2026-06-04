// Persistent left sidebar (server component). Brand lockup, ⌘K search affordance
// (visual only — palette is 4.8), the nav island, the watched-categories list, and
// a pinned Settings link. `categories` is props-driven (placeholder until T021
// wires getWatchedCategories). §4 tokens, no hex.
import { Search, Settings } from "lucide-react";
import Link from "next/link";

import { SidebarNav } from "./sidebar-nav";

export interface SidebarCategory {
  key: string;
  label: string;
  problemCount: number;
}

export function AppSidebar({
  categories,
  className = "",
}: {
  categories: SidebarCategory[];
  className?: string;
}) {
  return (
    <aside
      className={`flex h-dvh w-64 shrink-0 flex-col gap-loose overflow-y-auto border-r border-border-default bg-surface-card p-card ${className}`}
    >
      {/* Brand lockup — rotated-square diamond + serif wordmark. */}
      <div className="flex items-center gap-snug">
        <span className="size-3 rotate-45 bg-accent-bristle" aria-hidden="true" />
        <span className="font-serif text-h4 font-semibold text-text-primary">
          Bristle
        </span>
      </div>

      {/* ⌘K search affordance — visual only (command palette is slice 4.8). */}
      <button
        type="button"
        aria-label="Search — command palette coming soon"
        className="flex items-center justify-between rounded-button border border-border-default bg-surface-canvas px-snug py-2 text-body-sm text-text-tertiary"
      >
        <span className="flex items-center gap-snug">
          <Search className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Search…
        </span>
        <kbd className="rounded bg-surface-raised px-1 font-mono text-body-sm text-text-secondary">
          ⌘K
        </kbd>
      </button>

      <SidebarNav />

      {/* Watched categories + their displayed problem counts. */}
      <div className="flex flex-col gap-tight">
        <p className="px-snug text-body-sm font-semibold uppercase tracking-wide text-text-tertiary">
          Categories
        </p>
        {categories.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between px-snug py-1 text-body-md text-text-secondary"
          >
            <span>{c.label}</span>
            <span className="text-body-sm text-text-tertiary">
              {c.problemCount}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/account"
        className="mt-auto flex items-center gap-snug px-snug py-2 text-body-md text-text-secondary transition-colors hover:text-text-primary"
      >
        <Settings className="size-5" strokeWidth={1.5} aria-hidden="true" />
        Settings
      </Link>
    </aside>
  );
}
