"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

// The ONLY new client island in this slice. It drives a true ARIA tablist —
// seven swapped panels, one visible at a time — with the active tab synced to
// the `?tab=` searchParam (deep-linkable, shareable). The right rail is rendered
// by the composer OUTSIDE this island, so it persists across tab changes. Panels
// are server-rendered and passed in as props (RSC composition); inactive panels
// stay in the DOM with `hidden` for instant switching + SR completeness.

export type DetailTabKey =
  | "synthesis"
  | "frequency"
  | "evidence"
  | "solutions"
  | "wtp"
  | "related"
  | "activity";

export interface DetailTab {
  key: DetailTabKey;
  label: string;
  /** Rendered as "(N)" on the evidence/solutions/wtp tabs. */
  count?: number;
}

// Canonical order — also the default-tab fallback source (index 0 = synthesis).
export const DETAIL_TAB_ORDER: DetailTabKey[] = [
  "synthesis",
  "frequency",
  "evidence",
  "solutions",
  "wtp",
  "related",
  "activity",
];

function normalizeTab(value: string | null): DetailTabKey {
  return DETAIL_TAB_ORDER.includes(value as DetailTabKey)
    ? (value as DetailTabKey)
    : "synthesis";
}

export function DetailTabs({
  tabs,
  panels,
}: {
  tabs: DetailTab[];
  panels: Record<DetailTabKey, ReactNode>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = normalizeTab(searchParams.get("tab"));
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = useCallback(
    (key: DetailTabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      // synthesis is the default — keep the canonical URL clean (no ?tab=).
      if (key === "synthesis") params.delete("tab");
      else params.set("tab", key);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    const target = tabs[next];
    if (!target) return;
    select(target.key);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Problem detail sections"
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-border-default"
      >
        {tabs.map((t, i) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-body-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle ${
                selected
                  ? "border-accent-bristle font-medium text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
              {t.count != null ? ` (${t.count})` : ""}
            </button>
          );
        })}
      </div>
      {DETAIL_TAB_ORDER.map((key) => (
        <div
          key={key}
          role="tabpanel"
          id={`${baseId}-panel-${key}`}
          aria-labelledby={`${baseId}-tab-${key}`}
          hidden={key !== active}
          tabIndex={0}
          className="pt-section focus-visible:outline-none"
        >
          {panels[key]}
        </div>
      ))}
    </div>
  );
}
