"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Active-filter chip summary + Clear all. Each chip removes its value from the
// owning ?param; Clear all drops the four facet params but keeps q / sort / view.
export interface ActiveChip {
  param: string;
  value: string;
  label: string;
}

const FACET_PARAMS = ["category", "source", "momentum", "signal"];

export function ActiveFilters({ chips }: { chips: ActiveChip[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (chips.length === 0) return null;

  function replace(params: URLSearchParams) {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function remove(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const cur = new Set((params.get(param) ?? "").split(",").filter(Boolean));
    cur.delete(value);
    if (cur.size) params.set(param, [...cur].join(","));
    else params.delete(param);
    replace(params);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const p of FACET_PARAMS) params.delete(p);
    replace(params);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-body-sm">
      <span className="font-medium uppercase tracking-wide text-text-secondary">Filters</span>
      {chips.map((c) => (
        <button
          key={`${c.param}:${c.value}`}
          type="button"
          onClick={() => remove(c.param, c.value)}
          className="inline-flex items-center gap-1 rounded-pill border border-border-default bg-surface-card px-2 py-0.5 text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label}
          <X className="size-3.5 text-text-tertiary" strokeWidth={1.5} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="rounded-button px-2 py-0.5 font-medium text-accent-bristle transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        Clear all
      </button>
    </div>
  );
}
