"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Row-select checkbox for the Library → Compare entry (slice 4.7 wires the
// 4.4-deferred A8 checkbox). Toggles the row's slug in ?select= (URL-param —
// consistent with the Library's other islands, no storage). Disabled once `max`
// are selected (unless this row is one of them).
export function LibraryCompareSelect({
  slug,
  checked,
  atMax,
  title,
}: {
  slug: string;
  checked: boolean;
  atMax: boolean;
  title: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle() {
    const cur = new Set((searchParams.get("select") ?? "").split(",").filter(Boolean));
    if (cur.has(slug)) cur.delete(slug);
    else cur.add(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (cur.size) params.set("select", [...cur].join(","));
    else params.delete("select");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={atMax && !checked}
      onChange={toggle}
      aria-label={`Select ${title} to compare`}
      className="size-4 accent-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
    />
  );
}
