"use client";

// Step 2 interactive island (design 3_2). Wraps the 18 CategoryCards in a 3–5
// multi-select grid with search, a removable-pill row, a live counter, and a
// dynamic hint. The overline + h1 + subhead (incl. the "Upgrade to Pro" link) are
// server-rendered by the page (tasks.md T016); this island carries only the
// interactive surface.
//
// Source of truth: the native checkboxes (name="categories"). ALL 18 stay mounted
// — search only hides non-matches via CSS — so a selected-then-filtered category
// still submits. `selected` state mirrors the checked boxes (for the count, pills,
// hint, disabled-at-max, and Continue gating) and is updated by a delegated
// onChange. Max is enforced by disabling unselected cards at 5 (a disabled control
// fires no change and is excluded from submission). Pills deselect by unchecking
// the matching input through the form ref (CategoryCard doesn't forward a ref and
// is a sealed Batch-A primitive). The saveCategories action is injected as a prop
// (Batch B); this island owns the SaveCategoriesState shape. Token-driven, no hex.

import { useActionState, useMemo, useRef, useState } from "react";

import { CATEGORIES } from "@bristle/shared";

import { AuthFormBanner } from "../auth/auth-form-banner";
import { CategoryCard } from "./category-card";

const CATEGORIES_MIN = 3;
const CATEGORIES_MAX = 5;

export type SaveCategoriesState =
  | { status: "idle" }
  | { status: "validation-error"; message: string; values: string[] }
  | { status: "transport-error"; message: string };

export type SaveCategoriesAction = (
  state: SaveCategoriesState,
  formData: FormData,
) => Promise<SaveCategoriesState>;

const INITIAL_STATE: SaveCategoriesState = { status: "idle" };

const LABEL_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c.label]));

interface CategorySelectorProps {
  action: SaveCategoriesAction;
  initialSelected?: string[];
}

export function CategorySelector({
  action,
  initialSelected = [],
}: CategorySelectorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [selected, setSelected] = useState<string[]>(() =>
    initialSelected
      .filter((slug) => LABEL_BY_SLUG.has(slug))
      .slice(0, CATEGORIES_MAX),
  );
  const [query, setQuery] = useState("");

  const visibleSlugs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null; // null = show all
    return new Set(
      CATEGORIES.filter((c) => c.label.toLowerCase().includes(needle)).map(
        (c) => c.slug,
      ),
    );
  }, [query]);

  const count = selected.length;
  const atMax = count >= CATEGORIES_MAX;
  const canContinue = count >= CATEGORIES_MIN;

  function deselect(slug: string) {
    const input = formRef.current?.querySelector<HTMLInputElement>(
      `input[name="categories"][value="${slug}"]`,
    );
    if (input) input.checked = false;
    setSelected((prev) => prev.filter((s) => s !== slug));
  }

  const hint =
    count < CATEGORIES_MIN
      ? `pick ${CATEGORIES_MIN - count} more to continue`
      : count < CATEGORIES_MAX
        ? `pick ${CATEGORIES_MAX - count} more to unlock instant alerts`
        : "max reached";

  const banner =
    state.status === "transport-error"
      ? state.message
      : state.status === "validation-error"
        ? state.message
        : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-busy={pending}
      onChange={(event) => {
        const target = event.target as HTMLInputElement;
        if (target.name !== "categories") return;
        setSelected((prev) =>
          target.checked
            ? prev.includes(target.value)
              ? prev
              : [...prev, target.value]
            : prev.filter((slug) => slug !== target.value),
        );
      }}
      className="flex flex-col gap-loose"
    >
      {banner ? <AuthFormBanner key={banner}>{banner}</AuthFormBanner> : null}

      <div className="flex flex-col gap-tight">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${CATEGORIES.length} categories…`}
          aria-label="Search categories"
          className="rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        />
        <p className="text-body-sm text-text-secondary">Showing all</p>
      </div>

      <div className="grid grid-cols-1 gap-grid md:grid-cols-3">
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category.slug);
          const visible = visibleSlugs === null || visibleSlugs.has(category.slug);
          return (
            <div key={category.slug} className={visible ? undefined : "hidden"}>
              <CategoryCard
                slug={category.slug}
                label={category.label}
                selected={isSelected}
                disabled={atMax && !isSelected}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-grid">
        <div className="flex flex-1 flex-wrap items-center gap-tight">
          {selected.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => deselect(slug)}
              aria-label={`Remove ${LABEL_BY_SLUG.get(slug) ?? slug}`}
              className="flex items-center gap-tight rounded-pill bg-accent-bristle/10 px-snug py-1 text-body-sm text-accent-bristle transition-colors hover:bg-accent-bristle/20"
            >
              {LABEL_BY_SLUG.get(slug) ?? slug}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <span className="text-body-sm text-text-secondary">
            {count} of {CATEGORIES_MAX} selected — {hint}
          </span>
        </div>
        <button
          type="submit"
          disabled={!canContinue || pending}
          aria-busy={pending}
          className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
        >
          {pending ? "Saving…" : "Finish →"}
        </button>
      </div>
    </form>
  );
}
