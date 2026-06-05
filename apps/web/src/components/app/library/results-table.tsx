import type { Problem } from "@bristle/db";
import { isSourceKey, resolveBadge } from "@bristle/shared";
import { SourceIcon } from "@bristle/ui";
import Link from "next/link";

import { BADGE_TO_ICON } from "@/lib/problem-detail-adapter";
import { relativeTime } from "@/lib/relative-time";

import { CategoryChip } from "./category-chip";
import { LibraryCompareSelect } from "./library-compare-select";

// Library list/table (the page-3 primary view). Semantic <table>; the Problem
// cell is the row's single navigation link (whole-row hover affordance + a
// chevron). A8: the per-row selection checkbox column is OMITTED this slice — a
// non-functional checkbox would read as broken; slice 4.7 adds it when Compare
// is wired. Source badges + category route through the shared registry/tokens.
function sourceIconKeys(p: Problem) {
  return [
    ...new Set(
      p.sources.filter(isSourceKey).map((k) => BADGE_TO_ICON[resolveBadge(k).badgeKey]),
    ),
  ];
}

const TH = "py-2 pr-grid font-medium";

const MAX_COMPARE = 4;

export function ResultsTable({
  results,
  selected = [],
}: {
  results: Problem[];
  selected?: string[];
}) {
  const selectedSet = new Set(selected);
  const atMax = selectedSet.size >= MAX_COMPARE;
  return (
    <table className="w-full min-w-[44rem] border-collapse text-body-sm">
      <thead>
        <tr className="border-b border-border-strong text-left text-text-secondary">
          <th scope="col" className="py-2 pr-2">
            <span className="sr-only">Select to compare</span>
          </th>
          <th scope="col" className={TH}>Problem</th>
          <th scope="col" className={TH}>Category</th>
          <th scope="col" className={`${TH} text-right`}>Mentions</th>
          <th scope="col" className={`${TH} text-right`}>Momentum</th>
          <th scope="col" className={TH}>Sources</th>
          <th scope="col" className={TH}>Updated</th>
          <th scope="col" className="py-2">
            <span className="sr-only">Open</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {results.map((p) => {
          const up = p.momentumPct >= 0;
          return (
            <tr key={p.slug} className="border-b border-border-default hover:bg-surface-raised">
              <td className="py-3 pr-2 align-middle">
                <LibraryCompareSelect
                  slug={p.slug}
                  checked={selectedSet.has(p.slug)}
                  atMax={atMax}
                  title={p.title}
                />
              </td>
              <td className="max-w-[22rem] py-3 pr-grid">
                <Link
                  href={`/app/problems/${p.slug}`}
                  className="font-medium text-text-primary hover:text-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
                >
                  {p.title}
                </Link>
              </td>
              <td className="py-3 pr-grid">
                <CategoryChip categoryKey={p.category} />
              </td>
              <td className="py-3 pr-grid text-right font-mono text-text-secondary">
                {p.mentionCount60d ?? "—"}
              </td>
              <td className="py-3 pr-grid text-right font-mono">
                <span className={up ? "text-accent-bristle" : "text-status-warning"}>
                  <span aria-hidden="true">{up ? "↑" : "↓"} </span>
                  {up ? "+" : ""}
                  {p.momentumPct}%
                </span>
              </td>
              <td className="py-3 pr-grid">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  {sourceIconKeys(p).map((key) => (
                    <SourceIcon key={key} source={key} className="size-4" />
                  ))}
                </span>
              </td>
              <td className="whitespace-nowrap py-3 pr-grid text-text-secondary">
                {p.updatedAt ? relativeTime(p.updatedAt) : "—"}
              </td>
              <td className="py-3 text-text-tertiary">
                <Link href={`/app/problems/${p.slug}`} aria-label={`Open ${p.title}`}>
                  ›
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
