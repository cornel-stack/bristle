"use client";

import { Search } from "lucide-react";

// The topbar "Search…" affordance, now functional — dispatches a window event the
// globally-mounted palette listens for (decoupled; no context provider threaded
// through the shell).
export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("bristle:open-command"))}
      aria-label="Open command palette"
      className="hidden w-64 items-center gap-snug rounded-button border border-border-default bg-surface-canvas px-snug py-1.5 text-body-sm text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle md:flex"
    >
      <Search className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Search…
      <kbd className="ml-auto rounded border border-border-default px-1 font-mono text-body-sm text-text-tertiary">
        ⌘K
      </kbd>
    </button>
  );
}
