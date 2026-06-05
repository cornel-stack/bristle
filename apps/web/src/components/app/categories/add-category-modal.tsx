"use client";

import { SOURCE_BADGES } from "@bristle/shared";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCategories } from "./categories-context";

// Add-category modal — name (required) + optional keywords + the 5 live source
// badges (SOURCE_BADGES — no PH/Google Play). Create appends to the shell context
// (ephemeral — no DB write); the new category then appears cross-route. role=dialog
// focus-trapped (focus-on-open / Tab trap / Esc / focus-return), the slice-4.4
// mobile-drawer pattern.
export function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const { addCategory } = useCategories();
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        onClose();
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
  }, [onClose]);

  function toggleSource(key: string) {
    setSources((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  }

  const field =
    "mt-1 w-full rounded-button border border-border-default bg-surface-card px-2 py-1.5 text-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-text-primary/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add category"
        className="relative mt-24 w-full max-w-md rounded-modal border border-border-default bg-surface-card p-grid shadow-xl"
      >
        <div className="mb-grid flex items-center justify-between">
          <h2 className="font-serif text-heading-h3 text-text-primary">Add category</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-button text-text-secondary hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addCategory({ name, keywords, sources });
            onClose();
          }}
          className="flex flex-col gap-grid"
        >
          <label className="block text-body-sm text-text-secondary">
            Name
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Edge Runtime"
              className={field}
            />
          </label>
          <label className="block text-body-sm text-text-secondary">
            Keywords <span className="text-text-tertiary">(optional)</span>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma-separated"
              className={field}
            />
          </label>
          <fieldset className="border-0 p-0">
            <legend className="text-body-sm text-text-secondary">Watch sources</legend>
            <div className="mt-1 flex flex-col gap-1.5">
              {SOURCE_BADGES.map((b) => (
                <label key={b.badgeKey} className="flex items-center gap-2 text-body-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={sources.includes(b.badgeKey)}
                    onChange={() => toggleSource(b.badgeKey)}
                    className="size-4 accent-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              Create category
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-button px-3 py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
