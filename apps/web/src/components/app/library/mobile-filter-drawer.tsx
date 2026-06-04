"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";

// Mobile filter drawer (client island). Below lg, the desktop facet aside is
// hidden; this renders a "Filters · N" button that opens the rail (passed as
// children — a Server Component) as an off-canvas sheet. Open state is ephemeral
// React state (not persisted — §9.6 is about storage, not UI state).
export function MobileFilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text-primary/40"
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-surface-canvas p-grid">
            <div className="mb-grid flex items-center justify-between">
              <span className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="flex size-9 items-center justify-center rounded-button text-text-secondary hover:bg-surface-raised"
              >
                <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
