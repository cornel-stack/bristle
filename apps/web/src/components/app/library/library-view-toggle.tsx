"use client";

import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { LibraryView } from "@/lib/library-params";

// List/grid view toggle → ?view= (default list; no localStorage §9.6). Both views
// render the same filtered/sorted set.
export function LibraryViewToggle({ value }: { value: LibraryView }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(view: LibraryView) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") params.set("view", "grid");
    else params.delete("view");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const btn = (active: boolean) =>
    `flex size-8 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle ${
      active ? "bg-surface-raised text-text-primary" : "text-text-secondary hover:text-text-primary"
    }`;

  return (
    <div
      role="group"
      aria-label="View"
      className="inline-flex overflow-hidden rounded-button border border-border-default"
    >
      <button
        type="button"
        aria-pressed={value === "list"}
        aria-label="List view"
        onClick={() => set("list")}
        className={btn(value === "list")}
      >
        <List className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-pressed={value === "grid"}
        aria-label="Grid view"
        onClick={() => set("grid")}
        className={btn(value === "grid")}
      >
        <LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
