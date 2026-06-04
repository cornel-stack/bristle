import type { Problem } from "@bristle/db";

export type SortKey = "momentum" | "frequency" | "newest" | "wtp";

export function isSortKey(v: string | undefined): v is SortKey {
  return v === "momentum" || v === "frequency" || v === "newest" || v === "wtp";
}

// Sort the FULL set; the caller slices the top N afterwards. Never pre-truncate
// before sorting — otherwise Newest / WTP would surface the newest-or-highest-WTP
// *among the momentum leaders* rather than the true top of that ordering. A
// momentum-desc tiebreak keeps ties deterministic.
export function sortProblems(
  problems: Problem[],
  sort: SortKey,
  wtpCounts: Record<string, number>,
): Problem[] {
  const arr = [...problems];
  switch (sort) {
    case "frequency":
      arr.sort(
        (a, b) =>
          (b.mentionCount60d ?? 0) - (a.mentionCount60d ?? 0) ||
          b.momentumPct - a.momentumPct,
      );
      break;
    case "newest":
      arr.sort(
        (a, b) =>
          (b.firstSeenAt?.getTime() ?? 0) - (a.firstSeenAt?.getTime() ?? 0) ||
          b.momentumPct - a.momentumPct,
      );
      break;
    case "wtp":
      arr.sort(
        (a, b) =>
          (wtpCounts[b.id] ?? 0) - (wtpCounts[a.id] ?? 0) ||
          b.momentumPct - a.momentumPct,
      );
      break;
    default:
      arr.sort((a, b) => b.momentumPct - a.momentumPct);
  }
  return arr;
}
