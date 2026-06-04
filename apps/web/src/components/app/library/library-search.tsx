"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Search island — updates ?q= (debounced) so the RSC re-filters server-side.
// State lives in the URL, not localStorage (§9.6).
export function LibrarySearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reflect external URL changes (e.g. Clear all) back into the input.
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
  }

  return (
    <label className="relative flex min-w-0 flex-1 items-center sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 size-4 text-text-tertiary"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="sr-only">Search problems by keyword</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search problems by keyword"
        className="w-full rounded-button border border-border-default bg-surface-card py-1.5 pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      />
    </label>
  );
}
