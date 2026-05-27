# Contracts: UI + DB surfaces (Slice 011)

## `@bristle/db` — **no change**

This slice does not modify, add, or remove any DB query helper. No DB reads. No schema change. The slice-005 through slice-010 surface is preserved as-is.

## `@bristle/ui` — **no API change; no new dep**

No new components exported. No existing exports modified. No new package dependency.

## `@bristle/shared` — **no change**

`SITE_URL` is consumed (not modified) by both new routes' metadata + by the Atom feed builder (feed-level `<id>`, `<link rel="self">`, `<link rel="alternate" type="text/html">`, and per-entry `<id>` + `<link>` URLs).

## `apps/web` — **no new top-level dependency**

`apps/web/package.json` is **unchanged**. `pnpm-lock.yaml` is unchanged. `ChangelogJumpNav` is hand-rolled `IntersectionObserver` (verbatim slice-010 `BlogRailToc` pattern, which itself mirrored slices 009 + 006). `ChangelogFigure` is hand-rolled inline SVG (no chart/image library). The Atom feed is hand-rolled template-string XML with an explicit `escapeXml()` helper (no `xmlbuilder2`, no `feed`, no `fast-xml-parser`, no `node-xml-stream`). Date formatting via pre-formatted `displayDay` strings per entry (no runtime `Intl.DateTimeFormat`, no date library).

## New app-local files (no public package surface)

These live under `apps/web/src/components/changelog/` (new directory) and `apps/web/src/app/changelog/` + `apps/web/src/app/changelog.atom/` — page-specific, not re-exported.

### Shared type module

```ts
// apps/web/src/components/changelog/types.ts (TS module, no JSX)

export type ChangelogType = "feature" | "improvement" | "fix";

export interface ChangelogFigureContent {
  /** Visible caption rendered inside the figure placeholder; e.g. "compare view". */
  caption: string;
  // Forward-compatible: a future content slice can add `src?: string` to carry
  // real screenshot URLs without changing consumers. NOT used this slice.
}

export interface ChangelogEntry {
  /**
   * kebab-case; serves as the <article id="entry-{slug}"> anchor target on
   * the page AND the per-entry Atom <id> permalink fragment.
   */
  slug: string;
  /** ISO yyyy-mm-dd; used for sorting + Atom <updated> RFC 3339 derivation. */
  date: string;
  /**
   * Pre-formatted display string, e.g. "MAY 8" / "APR 22". Per clarification
   * (g) carried from slice 010 — fixed compile-time strings to avoid runtime
   * Intl.DateTimeFormat (no locale drift between SSR and hydration).
   */
  displayDay: string;
  /**
   * kebab-case month identifier, e.g. "may-2026". Used by ChangelogJumpNav's
   * IntersectionObserver via the [data-changelog-month] attribute AND as the
   * <section> id for native anchor-link behavior.
   */
  monthKey: string;
  /** e.g. "May 2026". Rendered in ChangelogMonthSection's <h2>. */
  monthLabel: string;
  title: string;
  type: ChangelogType;
  /**
   * Single paragraph. Rendered as <p> in the entry body on the page AND as
   * <summary type="text"> in the Atom feed.
   */
  body: string;
  /** Only set on entries that ship with a placeholder figure (May 8 only this slice). */
  figure?: ChangelogFigureContent;
}

/**
 * Projection ChangelogLayout creates after grouping by monthKey + computing
 * the current-month flag. Passed into ChangelogMonthSection. Exactly one
 * group has isCurrent: true — the one containing max(entry.date).
 */
export interface ChangelogMonthGroup {
  monthKey: string;
  monthLabel: string;
  /** Entries are in source order (most-recent first within the month). */
  entries: ReadonlyArray<ChangelogEntry>;
  isCurrent: boolean;
}

/**
 * Minimal projection consumed by ChangelogJumpNav. ChangelogLayout derives
 * this from the month groups before passing into the rail. Same Pick-style
 * boundary discipline as slice-010 BlogTocItem — keeps paragraph prose +
 * figure data out of the client hydration payload.
 */
export interface ChangelogJumpItem {
  monthKey: string;
  displayLabel: string;
}
```

### Atom XML helper module

```ts
// apps/web/src/components/changelog/atom-xml.ts (TS module, no JSX)

import type { ChangelogEntry } from "./types";

/**
 * Escape the five XML predefined entities per RFC 4287 / XML 1.0 §2.4.
 * Order matters: ampersand FIRST, so subsequent `&lt;`/`&gt;`/`&quot;`/
 * `&apos;` are not double-escaped.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a valid Atom 1.0 feed body from CHANGELOG_ENTRIES + SITE_URL.
 *
 * Atom 1.0 spec: RFC 4287. Output validated against the spec by element-
 * presence greps in the implementing PR's test plan + optionally by
 * `xmllint --noout` parse-check.
 *
 * Entry <updated> uses 12:00:00Z (midday UTC) as the stable convention:
 * the data store carries date-only precision (yyyy-mm-dd), and midday UTC
 * is timezone-fair (within ±12 hours of every timezone's local "that day").
 */
export function buildAtomFeed(
  entries: ReadonlyArray<ChangelogEntry>,
  siteUrl: string,
): string;
//   feedId = `${siteUrl}/changelog`
//   feedSelfHref = `${siteUrl}/changelog.atom`
//   feedHtmlHref = `${siteUrl}/changelog`
//   maxDate = max by ISO string comparison over entries
//   feedUpdated = `${maxDate}T12:00:00Z`
//
//   Template structure:
//     <?xml version="1.0" encoding="utf-8"?>
//     <feed xmlns="http://www.w3.org/2005/Atom">
//       <id>{escapeXml(feedId)}</id>
//       <title>Bristle Changelog</title>
//       <subtitle>Public, dated, attributable. The shape of our pace.</subtitle>
//       <updated>{feedUpdated}</updated>
//       <link rel="self" type="application/atom+xml" href="{escapeXml(feedSelfHref)}"/>
//       <link rel="alternate" type="text/html" href="{escapeXml(feedHtmlHref)}"/>
//       <author><name>Bristle</name></author>
//       <generator uri="https://bristle.dev">Bristle hand-rolled</generator>
//       {entries.map(entry => `
//         <entry>
//           <id>{escapeXml(siteUrl + "/changelog#entry-" + entry.slug)}</id>
//           <title>{escapeXml(entry.title)}</title>
//           <updated>{entry.date}T12:00:00Z</updated>
//           <link rel="alternate" type="text/html" href="{escapeXml(...)}"/>
//           <summary type="text">{escapeXml(entry.body)}</summary>
//           <category term="{escapeXml(entry.type)}"/>
//           <author><name>Bristle</name></author>
//         </entry>
//       `).join("\n")}
//     </feed>
```

### Content data store

```ts
// apps/web/src/components/changelog/changelog-entries.ts (sketch — head + first entry)
// [PLACEHOLDER — changelog entries awaiting founder review before production launch]

import type { ChangelogEntry } from "./types";

export const CHANGELOG_ENTRIES: ReadonlyArray<ChangelogEntry> = [
  // ─────────────────────────────────────────────────────────────────────────
  // MAY 2026 (3 entries) — May 8 is the most-recent → "Current" pill lands here
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "compare-view-supports-four-problems",
    date: "2026-05-08",
    displayDay: "MAY 8",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Compare view now supports up to four problems",
    type: "feature",
    body: "You asked. We over-engineered. The comparison grid now aligns six rows of metrics across four columns with a sticky header. Available on Pro and Team.",
    figure: { caption: "compare view" },
  },
  {
    slug: "slack-delivery-for-alerts",
    date: "2026-05-03",
    displayDay: "MAY 3",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Slack delivery for alerts",
    type: "feature",
    body: "Connect Slack from Settings → Integrations and your alerts can post into any channel with full report links and momentum.",
  },
  {
    slug: "smaller-faster-dashboard",
    date: "2026-05-01",
    displayDay: "MAY 1",
    monthKey: "may-2026",
    monthLabel: "May 2026",
    title: "Smaller, faster dashboard",
    type: "improvement",
    body: "Initial JS bundle dropped from 264KB to 178KB gzipped. Dashboard LCP is now 1.4s on mid-range mobile over 4G.",
  },

  // APRIL 2026 (3 entries) — daily-digest-yesterday-comparison, fix-command-palette-firefox-138, source-apple-app-store-reviews
  // MARCH 2026 (3 entries) — improved-similarity-clustering, fix-missing-momentum-backfilled-problems, export-to-csv
  // FEBRUARY 2026 (2 entries) — source-product-hunt, faster-ingest
  // JANUARY 2026 (2 entries) — public-launch, initial-sources-live
  // (8 more entries — verbatim per spec §15 / FR-026)
];
```

### Server components

```tsx
// apps/web/src/components/changelog/changelog-hero.tsx (server)
export function ChangelogHero(): JSX.Element;
//   <section className="pt-section pb-loose">
//     <p eyebrow className="text-accent-bristle">CHANGELOG</p>
//     <h1 serif className="font-serif text-display-lg">What's new in Bristle.</h1>
//     <p subhead className="text-text-secondary">
//       Public, dated, attributable. The shape of our pace.
//     </p>
//   </section>

// apps/web/src/components/changelog/changelog-badge.tsx (server)
export interface ChangelogBadgeProps { type: ChangelogType; }
export function ChangelogBadge(props: ChangelogBadgeProps): JSX.Element;
//   LABEL[type] → "Feature" / "Improvement" / "Fix"
//   CLASSES[type]:
//     feature     → "bg-accent-bristle text-surface-card"
//     improvement → "bg-surface-raised text-text-primary"
//     fix         → "text-text-secondary border border-border-default"
//   <span className="inline-flex items-center rounded-pill px-2 py-0.5 text-body-sm font-medium {CLASSES[type]}">
//     {LABEL[type]}
//   </span>

// apps/web/src/components/changelog/changelog-figure.tsx (server)
export interface ChangelogFigureProps { figure: ChangelogFigureContent; }
export function ChangelogFigure(props: ChangelogFigureProps): JSX.Element;
//   <figure className="my-grid">
//     <svg viewBox="0 0 1280 720" role="img" aria-label="Screenshot placeholder for {caption}"
//          className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
//       <defs>
//         <pattern id="diagonal-stripes" patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(45)">
//           <rect width="24" height="24" className="fill-surface-raised" />
//           <line x1="0" y1="0" x2="0" y2="24" className="stroke-border-strong opacity-30" strokeWidth="2"/>
//         </pattern>
//       </defs>
//       <rect width="1280" height="720" fill="url(#diagonal-stripes)" />
//       <text x="640" y="370" textAnchor="middle" className="fill-text-secondary font-mono" fontSize="22">
//         screenshot · {figure.caption} · 1280×720
//       </text>
//     </svg>
//   </figure>

// apps/web/src/components/changelog/changelog-entry.tsx (server)
export interface ChangelogEntryProps { entry: ChangelogEntry; }
export function ChangelogEntry(props: ChangelogEntryProps): JSX.Element;
//   <article id={`entry-${entry.slug}`} className="scroll-mt-section grid gap-grid md:grid-cols-[6rem_1fr] md:gap-section">
//     <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
//       {entry.displayDay}
//     </p>
//     <div className="flex flex-col gap-tight">
//       <div className="flex items-baseline gap-tight">
//         <h3 className="font-serif text-h3 text-text-primary">{entry.title}</h3>
//         <ChangelogBadge type={entry.type} />
//       </div>
//       <p className="font-serif text-body-lg text-text-primary">{entry.body}</p>
//       {entry.figure && <ChangelogFigure figure={entry.figure} />}
//     </div>
//   </article>

// apps/web/src/components/changelog/changelog-month-section.tsx (server)
export interface ChangelogMonthSectionProps { month: ChangelogMonthGroup; }
export function ChangelogMonthSection(props: ChangelogMonthSectionProps): JSX.Element;
//   <section
//     id={month.monthKey}
//     data-changelog-month={month.monthKey}
//     className="scroll-mt-section flex flex-col gap-section"
//   >
//     <div className="flex items-baseline gap-snug">
//       <h2 className="font-serif text-h2 text-text-primary">{month.monthLabel}</h2>
//       {month.isCurrent && (
//         <span className="rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium text-text-secondary">
//           Current
//         </span>
//       )}
//     </div>
//     <div className="flex flex-col gap-loose">
//       {month.entries.map(entry => <ChangelogEntry key={entry.slug} entry={entry} />)}
//     </div>
//   </section>

// apps/web/src/components/changelog/rss-subscribe-card.tsx (server)
export function RssSubscribeCard(): JSX.Element;
//   <aside className="flex flex-col gap-tight rounded-card border border-border-default p-card">
//     <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
//       RSS · ATOM
//     </p>
//     <p className="text-body-sm text-text-secondary">
//       Subscribe to <a href="/changelog.atom" className="text-text-primary underline hover:text-accent-bristle">/changelog.atom</a> from anywhere.
//     </p>
//   </aside>

// apps/web/src/components/changelog/changelog-layout.tsx (server) — composes the page
export interface ChangelogLayoutProps { entries: ReadonlyArray<ChangelogEntry>; }
export function ChangelogLayout(props: ChangelogLayoutProps): JSX.Element;
//   // Step 1: derive uniqueMonthKeys preserving source order
//   const uniqueMonthKeys = [...new Set(entries.map(e => e.monthKey))];
//
//   // Step 2: group entries by monthKey
//   const byMonth = new Map<string, ChangelogEntry[]>();
//   for (const e of entries) { /* push to byMonth[e.monthKey] */ }
//
//   // Step 3: currentMonthKey = entry with max(date) → its monthKey
//   const currentMonthKey = entries.reduce((max, e) => (e.date > max.date ? e : max)).monthKey;
//
//   // Step 4: emit ChangelogMonthGroup[] in source order with isCurrent flag
//   const months: ChangelogMonthGroup[] = uniqueMonthKeys.map(monthKey => ({
//     monthKey,
//     monthLabel: byMonth.get(monthKey)![0].monthLabel,
//     entries: byMonth.get(monthKey)!,
//     isCurrent: monthKey === currentMonthKey,
//   }));
//
//   // Project to ChangelogJumpItem[] for the rail
//   const jumpItems = months.map(m => ({ monthKey: m.monthKey, displayLabel: m.monthLabel }));
//
//   return (
//     <>
//       <TopNav />
//       <main>
//         <div className="mx-auto max-w-5xl px-grid pb-section">
//           <ChangelogHero />
//           <div className="mt-section md:grid md:grid-cols-[14rem_1fr] md:gap-section">
//             <aside className="flex flex-col gap-loose md:sticky md:top-grid md:self-start">
//               <ChangelogJumpNav items={jumpItems} />
//               <RssSubscribeCard />
//             </aside>
//             <div className="mt-section flex flex-col gap-section md:mt-0">
//               {months.map(m => <ChangelogMonthSection key={m.monthKey} month={m} />)}
//             </div>
//           </div>
//         </div>
//       </main>
//       <SiteFooter />
//     </>
//   );
```

### Client component

```tsx
// apps/web/src/components/changelog/changelog-jump-nav.tsx ("use client") — FOURTH STRUCTURAL MIRROR
export interface ChangelogJumpNavProps {
  items: ReadonlyArray<ChangelogJumpItem>;
  ariaLabel?: string;  // defaults to "Jump to a month"
}
export function ChangelogJumpNav(props: ChangelogJumpNavProps): JSX.Element;
//   "use client";
//   useState<string>(items[0]?.monthKey ?? "") for active month (flicker fix)
//   useRef<Map<string, number>>(new Map()) for visibleMonths (IO tracking)
//   useRef<Map<string, HTMLAnchorElement>>(new Map()) for mobilePillRefs
//
//   useEffect (mount-only) sets up IntersectionObserver on
//     document.querySelectorAll("[data-changelog-month]")
//     with rootMargin "-80px 0px -55% 0px", threshold: 0
//     topmost-intersecting → setActive(monthKey); no-intersection → early return (no flicker)
//
//   useEffect ([active]) auto-scrolls mobile pill into view:
//     if (matchMedia("(min-width: 768px)").matches) return;  // desktop no-op
//     pillRef.scrollIntoView({inline: "center", block: "nearest",
//                             behavior: reduced-motion ? "auto" : "smooth"})
//
//   handleClick(e, monthKey):
//     if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;  // modifier passthrough
//     e.preventDefault();
//     target = document.querySelector(`[data-changelog-month="${monthKey}"]`);
//     reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
//     target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
//
//   render <nav aria-label={ariaLabel}>
//     <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
//       desktop sticky vertical rail; <a href={`#${monthKey}`} aria-current={isActive ? "location" : undefined}>{displayLabel}</a>
//       active: border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary
//       inactive: border-l-2 border-transparent py-1 pl-snug text-text-secondary hover:text-text-primary
//     </ul>
//     <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
//       mobile horizontal pill row; each pill an <a> with ref registered to mobilePillRefs Map;
//       active pill: bg-text-primary text-surface-card rounded-pill
//       inactive: border border-border-default bg-surface-card text-text-secondary rounded-pill
//     </ul>
//   </nav>
//
// IMPORTANT: this file MUST NOT import from
//   apps/web/src/components/faq/scroll-spy-rail.tsx (slice 006),
//   apps/web/src/components/legal/toc-rail.tsx (slice 009), or
//   apps/web/src/components/blog/blog-rail-toc.tsx (slice 010)
// — additive only. Tracked follow-up: extract SectionScrollSpyRail in a dedicated refactor slice.
```

## Route exports

### `apps/web/src/app/changelog/page.tsx` (REWRITE — slice-005 ComingSoon stub → full Changelog page)

```ts
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { ChangelogLayout } from "@/components/changelog/changelog-layout";

const TITLE = "Changelog — Bristle";
const DESCRIPTION = "Public, dated, attributable changelog for Bristle. The shape of our pace.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/changelog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  alternates: {
    types: {
      "application/atom+xml": [
        { url: `${SITE_URL}/changelog.atom`, title: "Bristle changelog feed" },
      ],
    },
  },
};

export default async function ChangelogIndex() {
  return <ChangelogLayout entries={CHANGELOG_ENTRIES} />;
}
// NO robots field → indexable by default (FR-027).
// Removes the slice-005 `robots: { index: false, follow: false }` from the
// prior ComingSoon stub — the new page IS indexable.
```

### `apps/web/src/app/changelog.atom/route.ts` (NEW — Atom 1.0 Route Handler)

```ts
import { SITE_URL } from "@bristle/shared";
import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { buildAtomFeed } from "@/components/changelog/atom-xml";

// Force build-time static prerender of the Route Handler. The feed is purely
// compile-time data — no DB, no per-request state. If Next.js's classifier
// falls back to ƒ Dynamic despite this directive, the Cache-Control header
// below ensures edge caching covers freshness.
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const body = buildAtomFeed(CHANGELOG_ENTRIES, SITE_URL);
  return new Response(body, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
```

## Untouched contracts (additive-only verification)

- `apps/web/src/components/landing/top-nav.tsx` — **unchanged**. Top-nav `Changelog` link already points at `/changelog` (line 6); flips from soft-404 → live the moment slice 011 ships. Verified via grep at plan time.
- `apps/web/src/components/landing/site-footer.tsx` — **unchanged**. Footer Product-column `Changelog` link already points at `/changelog` (line 8); same flip semantics. Verified via grep at plan time.
- `apps/web/src/components/landing/pricing-teaser.tsx` — **unchanged**.
- All slice-006 pricing/FAQ files (including `apps/web/src/components/faq/scroll-spy-rail.tsx`) — **unchanged**. `ChangelogJumpNav` is a structural mirror in a separate file, NOT a refactor of the FAQ rail.
- All slice-008 about/contact files (`about/*.tsx`, `contact/*.tsx`, `lib/resend.ts`, `app/contact/actions.ts`) — **unchanged**.
- All slice-009 legal files (`legal/*.tsx`, `legal/*-content.ts`, `legal/types.ts`, including `legal/toc-rail.tsx`) — **unchanged**.
- All slice-010 blog files (`blog/*.tsx`, `blog/*.ts`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, including `blog/blog-rail-toc.tsx`) — **unchanged**. `ChangelogJumpNav` is a structural mirror in a separate file, NOT a refactor of the Blog rail.
- `packages/db/`, `packages/shared/`, `packages/ui/` — **unchanged**.
- `design/` — **unchanged**.

## Out-of-scope-known-404s consumed by this slice (not slice-011 defects)

**None.** The Changelog page has minimal outbound links: the `RssSubscribeCard` links to `/changelog.atom` (built this slice), and the January 28 entry contains a `mailto:hello@bristle.dev` reference (not a route). No known-out-of-scope-404 destinations are introduced by slice 011.

## Structural mirror discipline (permanent constraint — ELEVATED to highest-priority refactor)

`ChangelogJumpNav` is the **fourth** structural mirror of the slice-006 `FaqScrollSpyRail` + slice-009 `TocRail` + slice-010 `BlogRailToc` pattern. All four share ~80% of their code (IntersectionObserver setup, topmost-visible resolution, no-flicker preservation, modifier-key passthrough, reduced-motion fresh-read, mobile pill auto-scroll). The tracked follow-up grows from 3 mirrors (slice 010) to **4 mirrors** (slice 011) and is now the **highest-priority deferred refactor item in the project**.

The refactor parameterizes over:
- **Selector**: `[data-faq-item]` (slice 006) / `[data-legal-section]` (slice 009) / `[data-blog-section]` (slice 010) / `[data-changelog-month]` (slice 011)
- **Target resolution strategy**: `getElementById` (slices 006/009/010 used section `id`s; slice 011 uses `querySelector` on the data attribute because sections carry both `id` and `data-` attribute — the shared rail should support both or normalize to one approach)
- **Items source type**: `FaqItem` / `TocItem` / `BlogTocItem` / `ChangelogJumpItem`
- **`aria-label` string**: defaults per-call-site (`Sections of the page` / `Sections of the article` / `Jump to a month`)

The refactor is **not in scope for slice 011** but is now a **dedicated refactor slice candidate between Tier 2 ship (after 2.7) and Tier 3 start**. The cost is bounded: four files → one file + four thin wrappers, no behavioral change. Regression risk on four shipped surfaces.
