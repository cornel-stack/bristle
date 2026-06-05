"use client";

import type { CommandIndexCategory, CommandIndexProblem } from "@bristle/db";
import { Command } from "cmdk";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import { useCategories } from "@/components/app/categories/categories-context";
import { CategoryChip } from "@/components/app/library/category-chip";

import { buildActions } from "./command-actions";

// The global ⌘K command palette (the only new client island). cmdk provides the
// a11y-critical combobox + grouped listbox + active-descendant roving (the reason
// we took the dep); we own the overlay (focus-trap/Esc/focus-return), the
// substring filter (shouldFilter={false} → we control grouping + the footer
// count), and the navigation/shortcuts. Styled entirely with our tokens.
//
// The palette is a NAVIGATOR — every selection/shortcut is a router.push, never a
// DB write (A2): problem → detail, category → library filter, compare → ?compare=,
// save → the detail (where the ephemeral save lives).

export interface CommandIndex {
  problems: CommandIndexProblem[];
  categories: CommandIndexCategory[];
}

function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f.toLowerCase().includes(q));
}

export function CommandPalette({ index }: { index: CommandIndex }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const restoreFocus = useRef<HTMLElement | null>(null);
  const { categories: allCategories } = useCategories();

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("bristle:open-command", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("bristle:open-command", onOpen);
    };
  }, []);

  // Capture the trigger when opening so focus returns there on close.
  useEffect(() => {
    if (open) restoreFocus.current = document.activeElement as HTMLElement | null;
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    restoreFocus.current?.focus?.();
  }

  function go(target: string) {
    setOpen(false);
    setQuery("");
    router.push(target);
  }

  if (!open) return null;

  const problems = index.problems.filter((p) => matches(query, p.title, p.category));
  const categories = allCategories.filter((c) => matches(query, c.label));
  const actions = buildActions(query, allCategories);
  const total = problems.length + categories.length + actions.length;

  function onPaletteKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    // Action shortcuts on the highlighted problem (⌘C / \\ → compare, ⌘S → save).
    const activeSlug = (
      e.currentTarget.querySelector('[data-selected="true"][data-slug]') as HTMLElement | null
    )?.dataset.slug;
    if (!activeSlug) return;
    if ((e.metaKey && e.key.toLowerCase() === "c") || e.key === "\\") {
      e.preventDefault();
      go(`/app/compare?compare=${activeSlug}`);
    } else if (e.metaKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      go(`/app/problems/${activeSlug}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <button
        type="button"
        aria-label="Close command palette"
        onClick={close}
        className="absolute inset-0 bg-text-primary/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative mt-24 w-full max-w-xl rounded-modal border border-border-default bg-surface-card shadow-xl"
      >
        <Command
          label="Command palette"
          shouldFilter={false}
          onKeyDown={onPaletteKeyDown}
          className="flex flex-col"
        >
          <div className="flex items-center gap-snug border-b border-border-default px-grid">
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search problems, categories, actions…"
              className="flex-1 bg-transparent py-3 text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <kbd className="rounded border border-border-default px-1.5 py-0.5 font-mono text-body-sm text-text-tertiary">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-2 py-6 text-center text-body-sm text-text-secondary">
              No results.
            </Command.Empty>

            {problems.length > 0 ? (
              <Command.Group
                heading={`Problems · ${problems.length}`}
                className="px-1 text-body-sm font-medium uppercase tracking-wide text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {problems.map((p) => (
                  <Command.Item
                    key={p.slug}
                    value={`problem ${p.title} ${p.category} ${p.slug}`}
                    data-slug={p.slug}
                    onSelect={() => go(`/app/problems/${p.slug}`)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-button px-2 py-2 text-body-sm text-text-primary data-[selected=true]:bg-surface-raised"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium normal-case">{p.title}</span>
                    <CategoryChip categoryKey={p.category} />
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {categories.length > 0 ? (
              <Command.Group
                heading={`Categories · ${categories.length}`}
                className="px-1 text-body-sm font-medium uppercase tracking-wide text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {categories.map((c) => (
                  <Command.Item
                    key={c.key}
                    value={`category ${c.label} ${c.key}`}
                    onSelect={() => go(`/app/library?category=${c.key}`)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-button px-2 py-2 text-body-sm normal-case text-text-primary data-[selected=true]:bg-surface-raised"
                  >
                    <span className="font-medium">{c.label}</span>
                    <span className="text-text-tertiary">{c.count} problems</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {actions.length > 0 ? (
              <Command.Group
                heading={`Actions · ${actions.length}`}
                className="px-1 text-body-sm font-medium uppercase tracking-wide text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {actions.map((a) => (
                  <Command.Item
                    key={a.id}
                    value={`action ${a.label}`}
                    onSelect={() => go(a.target)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-button px-2 py-2 text-body-sm normal-case text-text-primary data-[selected=true]:bg-surface-raised"
                  >
                    <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    <span className="text-text-tertiary">{a.hint}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-default px-grid py-2 text-body-sm text-text-tertiary">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>⌘C Compare</span>
            <span>⌘S Save</span>
            <span className="ml-auto">{total} results</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
