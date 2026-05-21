"use client";

import { useState, type ReactNode } from "react";

// Throwaway manual theme toggle for the Slice 003 showcase only — the real
// theme system (next-themes) arrives later. Sets [data-theme] on <html> so the
// token layer's [data-theme="dark"] block restyles the server-rendered cards.
// No browser storage (project rule); refresh resets to Editorial Light.
export function ThemeShowcase({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "";
  }

  return (
    <main className="mx-auto max-w-5xl px-grid py-section">
      <div className="flex items-center justify-between gap-grid">
        <h1 className="font-serif text-h1 text-text-primary">Bristle</h1>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={dark}
          aria-label="Toggle Editorial Dark theme"
          className="rounded-button border border-border-default bg-surface-card px-snug py-1 text-body-sm font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bristle"
        >
          {dark ? "Editorial Light" : "Editorial Dark"}
        </button>
      </div>

      <section className="mt-section">
        <h2 className="font-serif text-h2 text-text-primary">Problem cards</h2>
        <div className="mt-grid grid gap-grid md:grid-cols-2">{children}</div>
      </section>
    </main>
  );
}
