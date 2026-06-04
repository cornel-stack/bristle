"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { isSortKey, type SortKey } from "@/lib/dashboard-sort";
import { SORT_LABELS } from "@/lib/library-params";

const SORT_ORDER: SortKey[] = ["momentum", "frequency", "newest", "wtp"];

// Sort island — updates ?sort= so the RSC re-sorts the full filtered set.
export function LibrarySort({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    if (!isSortKey(next)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "momentum") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-body-sm text-text-secondary">
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        {SORT_ORDER.map((s) => (
          <option key={s} value={s}>
            Sort: {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
