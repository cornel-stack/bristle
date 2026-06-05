"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Removes a problem column from the comparison by dropping its slug from
// ?compare= (the URL is the only state — no DB write).
export function CompareRemove({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function remove() {
    const kept = (searchParams.get("compare") ?? "")
      .split(",")
      .filter(Boolean)
      .filter((s) => s !== slug);
    const params = new URLSearchParams(searchParams.toString());
    if (kept.length) params.set("compare", kept.join(","));
    else params.delete("compare");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={remove}
      aria-label="Remove from comparison"
      className="text-text-tertiary hover:text-status-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
    >
      <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
