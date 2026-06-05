// Compare — /app/compare. A READ slice: the compare-set lives entirely in the URL
// (?compare=slug1,slug2,…, ≤4) — shareable, deep-linkable, no DB write (there is
// no comparisons table). Server Component in the gated shell (the layout's auth()
// is the gate; the data is global problem data, so — like the Library — NO
// getAppUser). Reuses getProblemDetail (≤4×) so packages/db is untouched; the
// compare-adapter validates compare_card at the boundary.

import { getDashboardProblems, getProblemDetail } from "@bristle/db";

import { CompareView } from "@/components/app/compare/compare-view";
import { adaptCompareColumn } from "@/lib/compare-adapter";

const MAX_COMPARE = 4;

function parseSlugs(sp: Record<string, string | string[] | undefined>): string[] {
  const raw = Array.isArray(sp.compare) ? sp.compare[0] : sp.compare;
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slugs = parseSlugs(await searchParams);
  const [details, allProblems] = await Promise.all([
    Promise.all(slugs.map((s) => getProblemDetail(s))),
    getDashboardProblems(), // all 15 — the picker source (read-only)
  ]);
  const columns = details
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => adaptCompareColumn(d));
  const selectedSlugs = columns.map((c) => c.slug);
  const pickable = allProblems.map((p) => ({ slug: p.slug, title: p.title }));
  return (
    <CompareView columns={columns} selectedSlugs={selectedSlugs} pickable={pickable} />
  );
}
