"use client";

// Sort tabs (client island) — the dashboard's one piece of grid interactivity.
// Updates the `?sort=` searchParam; the server re-renders the grid (sort happens
// server-side over all 15, then slices the top 6). Momentum is the default (no
// param). §4 tokens.
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "momentum", label: "Momentum" },
  { key: "frequency", label: "Frequency" },
  { key: "newest", label: "Newest" },
  { key: "wtp", label: "Willingness-to-pay" },
] as const;

export function SortTabs({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(key: string) {
    const next = new URLSearchParams(params.toString());
    if (key === "momentum") next.delete("sort");
    else next.set("sort", key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Sort problems"
      className="flex flex-wrap items-center gap-tight"
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(t.key)}
            className={`rounded-button px-snug py-1 text-body-sm transition-colors ${
              isActive
                ? "bg-surface-raised font-medium text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
