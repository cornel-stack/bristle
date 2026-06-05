"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Adds a problem to the comparison — a select of problems not already in the set,
// appending its slug to ?compare= (capped at `max`). URL is the only state.
export interface Pickable {
  slug: string;
  title: string;
}

export function ComparePicker({
  pickable,
  selected,
  max,
}: {
  pickable: Pickable[];
  selected: string[];
  max: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSet = new Set(selected);
  const options = pickable.filter((p) => !selectedSet.has(p.slug));
  const atMax = selected.length >= max;

  function add(slug: string) {
    if (atMax || !slug) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("compare", [...selected, slug].join(","));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
      <Plus className="size-4 text-text-tertiary" strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only">Add a problem to compare</span>
      <select
        value=""
        disabled={atMax || options.length === 0}
        onChange={(e) => add(e.target.value)}
        className="rounded-button border border-border-default bg-surface-card px-2 py-1.5 text-body-sm text-text-primary disabled:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        <option value="">{atMax ? "Up to 4 — remove one to add" : "Add a problem…"}</option>
        {options.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.title}
          </option>
        ))}
      </select>
    </label>
  );
}
