import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

import { ChangelogHero } from "./changelog-hero";
import { ChangelogJumpNav } from "./changelog-jump-nav";
import { ChangelogMonthSection } from "./changelog-month-section";
import { RssSubscribeCard } from "./rss-subscribe-card";
import type {
  ChangelogEntry,
  ChangelogJumpItem,
  ChangelogMonthGroup,
} from "./types";

interface ChangelogLayoutProps {
  entries: ReadonlyArray<ChangelogEntry>;
}

// 4-step month-grouping + currentMonthKey + jumpItems projection per plan §D4.
// Single consumer of this algorithm (this layout); intentionally inline
// instead of extracted to a helper. All comparisons use direct ISO yyyy-mm-dd
// string compare — works because lexicographic order matches chronological
// order for that format.
export function ChangelogLayout({ entries }: ChangelogLayoutProps) {
  // Step 1: derive uniqueMonthKeys preserving source order. CHANGELOG_ENTRIES
  // is already reverse-chronological in source; [...new Set(...)] preserves
  // insertion order per ES2015 spec.
  const uniqueMonthKeys = [...new Set(entries.map((e) => e.monthKey))];

  // Step 2: group entries by monthKey, tracking each month's label from the
  // first entry encountered. Single pass that resolves the index-access
  // safety concern that pure `byMonth.get(k)![0].monthLabel` would raise
  // under noUncheckedIndexedAccess (tsconfig.base.json).
  const byMonth = new Map<
    string,
    { monthLabel: string; entries: ChangelogEntry[] }
  >();
  for (const entry of entries) {
    const group = byMonth.get(entry.monthKey);
    if (group) group.entries.push(entry);
    else
      byMonth.set(entry.monthKey, {
        monthLabel: entry.monthLabel,
        entries: [entry],
      });
  }

  // Step 3: currentMonthKey = entry with max(date) → its monthKey.
  const currentMonthKey = entries.reduce((max, e) =>
    e.date > max.date ? e : max,
  ).monthKey;

  // Step 4: emit ChangelogMonthGroup[] in source order with isCurrent flag.
  const months: ChangelogMonthGroup[] = uniqueMonthKeys.map((monthKey) => {
    const group = byMonth.get(monthKey);
    if (!group) throw new Error(`Missing group for ${monthKey}`);
    return {
      monthKey,
      monthLabel: group.monthLabel,
      entries: group.entries,
      isCurrent: monthKey === currentMonthKey,
    };
  });

  // Project to ChangelogJumpItem[] for the rail. Pick-style boundary per
  // slice-009 TocItem / slice-010 BlogTocItem — keeps paragraph prose +
  // figure data out of the client hydration payload.
  const jumpItems: ChangelogJumpItem[] = months.map((m) => ({
    monthKey: m.monthKey,
    displayLabel: m.monthLabel,
  }));

  return (
    <>
      <TopNav />
      <main>
        <div className="mx-auto max-w-5xl px-grid pb-section">
          <ChangelogHero />
          <div className="mt-section md:grid md:grid-cols-[14rem_1fr] md:gap-section">
            <aside className="flex flex-col gap-loose md:sticky md:top-grid md:self-start">
              <ChangelogJumpNav items={jumpItems} />
              <RssSubscribeCard />
            </aside>
            <div className="mt-section flex flex-col gap-section md:mt-0">
              {months.map((m) => (
                <ChangelogMonthSection key={m.monthKey} month={m} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
