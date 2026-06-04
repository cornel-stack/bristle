"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Mobile filter drawer (client island). Below lg, the desktop facet aside is
// hidden; this renders a "Filters · N" button that opens the rail (passed as
// children — a Server Component) as an off-canvas dialog sheet. A11y: role=dialog
// + aria-modal, focus moves into the panel on open, Tab is trapped within it,
// Escape closes, and focus returns to the trigger on close. Open state is
// ephemeral React state (not persisted — §9.6 is about storage, not UI state).
export function MobileFilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const restoreTo = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusable()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusable();
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreTo?.focus?.();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text-primary/40"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-surface-canvas p-grid"
          >
            <div className="mb-grid flex items-center justify-between">
              <span className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="flex size-9 items-center justify-center rounded-button text-text-secondary hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
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
