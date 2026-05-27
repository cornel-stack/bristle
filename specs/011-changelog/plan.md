# Implementation Plan: Changelog + Atom feed

**Branch**: `011-changelog` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-changelog/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Ship the Tier-2 build-plan slice **2.5 — Changelog**. Two new surfaces land: a Changelog page at `/changelog` (replaces the slice-005 `<ComingSoon version="0.2.5" />` stub) and an Atom 1.0 feed at `/changelog.atom` (the first XML/feed surface in the codebase). The page reads top-to-bottom as a dated release log: `TopNav` (reused) + `ChangelogHero` (eyebrow + serif `What's new in Bristle.` + subhead) + two-column body (left = sticky `ChangelogJumpNav` listing 5 months + `RssSubscribeCard`; right = 5 `ChangelogMonthSection`s containing 13 `ChangelogEntry` items) + `SiteFooter` (reused). One `Current` pill renders across the 5 month sections — on whichever month contains `max(entry.date)` — computed at build time from the imported data store, no runtime `Date.now()`. The Atom feed is a Next.js Route Handler at `apps/web/src/app/changelog.atom/route.ts` that hand-rolls valid Atom 1.0 XML via template strings with an explicit `escapeXml()` function — **zero new dependencies** (no `xmlbuilder2`, no `feed`, no `fast-xml-parser`). The handler attempts `export const dynamic = "force-static"` to prerender as `○ Static`; if Next.js's Route Handler classification falls back to `ƒ Dynamic` the response is still cached at the edge via `Cache-Control: public, s-maxage=3600`. `ChangelogJumpNav` is the **fourth** structural mirror of the slice-006 `FaqScrollSpyRail` / slice-009 `TocRail` / slice-010 `BlogRailToc` pattern (verbatim IO config, `[data-changelog-month]` selector, current-location nav ARIA, modifier-key short-circuit, mobile-pill auto-scroll, reduced-motion fresh-read); the tracked follow-up to extract a shared `SectionScrollSpyRail` grows from 3 mirrors to **4** and is now the **highest-pressure refactor item** in the project. Slice-005 top-nav `Changelog` link (top-nav.tsx:6) AND slice-005 footer Product-column `Changelog` link (site-footer.tsx:8) both flip from known-out-of-scope-404 to live the moment slice 011 ships — **zero edits to `top-nav.tsx` or `site-footer.tsx`** (the FR-036-equivalent pattern continued from slice-009's footer Legal column flip and slice-010's top-nav Blog flip). The single existing-file change permitted is the wholesale rewrite of `apps/web/src/app/changelog/page.tsx` (slice-005's ComingSoon stub → slice-011's full Changelog page).

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.

**Primary Dependencies**: existing — `@bristle/shared` (`SITE_URL` consumed by route metadata + Atom feed-level + per-entry IDs), Tailwind v4, `next/font/google`, `lucide-react@1.16.0` (existing; not consumed this slice unless added for a rail mobile-pill chevron), the `BlogRailToc` / `TocRail` / `FaqScrollSpyRail` family from slices 010 / 009 / 006 (referenced **only as structural precedent** — not imported, not modified). **No new runtime dep.** `ChangelogJumpNav` is hand-rolled `IntersectionObserver`; `ChangelogFigure` is hand-rolled inline SVG; the Atom feed is hand-rolled template-string XML with an explicit `escapeXml()` helper (no XML library).

**Storage**: N/A — both surfaces are content-static. No schema change, no new query helper, no `@bristle/db` touch.

**Testing**: gates only (typecheck/lint/build, greps, route 200 + meta-tag curl, Atom XML curl + element-grep validation, bundle budgets, filter/scroll-spy walk on `/changelog`, deep-link anchor check, responsive sweep, visual diff vs `design/Public_pages.pdf` page 8 at 1280, regression check on slice-005 top-nav `Changelog` link AND footer Product-column `Changelog` link). No Vitest/Playwright wired (same as slices 005 / 006 / 007 / 008 / 009 / 010). The Atom feed's structural correctness is asserted via element-presence greps (`<feed xmlns=...>`, `<id>`, `<title>`, `<updated>`, `<link rel="self">`, `<author>`, `<entry>` × 13) and optionally `xmllint --noout` for parse-correctness.

**Target Platform**: Web (Vercel preview + production).

**Performance Goals (binding, CLAUDE.md §5)**: Lighthouse ≥ 90 Performance / Accessibility / Best Practices / SEO on `/changelog` on local prod (SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact and not a regression); First-Load JS < 180 KB gz on `/changelog`. Expected: ~107-110 KB (slice-005 baseline ~106 KB + `ChangelogJumpNav` ~1-2 KB compiled — equivalent to slice-009 `/terms` and slice-010 `/blog/[slug]` profiles). `/changelog.atom` has zero client JavaScript (XML response, no React tree).

**Constraints**: zero hex literals, zero font-family literals in any new file; voice CLAUDE.md §6 (no `!`, no emoji, no "amazing/awesome") on all visible prose; no `localStorage`; WCAG 2.2 AA — semantic headings (h1 in `ChangelogHero`, h2 per `ChangelogMonthSection`); `<nav aria-label="Jump to a month">` wrap on `ChangelogJumpNav` with `aria-current="location"` on active anchor; focus rings visible; the badge text per type (`Feature` / `Improvement` / `Fix`) is the accessible affordance — not just color. Only `changelog-jump-nav.tsx` carries `"use client"` — all other new components are Server Components or server-only modules.

**Scale/Scope**: 2 new routes (1 page + 1 Atom feed Route Handler); **~12 new files**: 1 type module + 1 data store + 1 XML helper + 7 server components + 1 client component + 1 server layout + 2 route files (1 page rewrite + 1 new Route Handler). **1 existing-on-main file rewritten** (`apps/web/src/app/changelog/page.tsx`, the slice-005 `ComingSoon` stub → the full Changelog page per FR-001); **0 other edits** to existing-on-main files. Comparable Batch B size to slice 010 (~9 primitives) but with a smaller Batch C (only one layout + two routes vs slice 010's 5 sequential tasks). Total commit-producing tasks: ~13-14.

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | No new dependency. `IntersectionObserver` is a platform API, not a library. Inline SVG `<path>`, `<rect>`, `<text>`, `<pattern>` are platform primitives. `Response` + `Headers` (used by the Route Handler) are Fetch API platform classes. Hand-rolled template-string XML is the right primitive for a fixed 13-entry feed (no need for `xmlbuilder2`'s tree manipulation; no need for `feed`'s multi-format multi-protocol abstraction since Atom-only is the spec). |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens. `ChangelogBadge` per-type palette resolves through tokens — Feature `bg-accent-bristle text-surface-card` (verified: `text-on-accent` token does NOT exist in `globals.css`; `text-surface-card` on `bg-accent-bristle` is the slice-009 TocRail mobile-pill active-state recipe applied here); Improvement `bg-surface-raised text-text-primary`; Fix `text-text-secondary border border-border-default` (outlined). `ChangelogJumpNav` active-state visual = `border-l-2 border-accent-bristle` desktop + filled pill mobile — verbatim slice-009 / 010 token names. `ChangelogFigure` diagonal-stripes SVG via Tailwind utility classes (`stroke-border-strong`, `fill-surface-raised`, `fill-text-secondary`) — no inline `stroke="#..."`. Zero hex literals (SC-026), zero font-family literals (SC-026). |
| §5 Conventions + floors | PASS | Server Components default; client surface = **one** named file (`changelog-jump-nav.tsx`) — back to slice-009 cardinality (slice 010 was the outlier at 3). Kebab-case files / PascalCase components; Tailwind only; no `localStorage`; voice rules applied to all visible prose; perf/a11y floors explicit (SC-020, SC-021); WCAG 2.2 AA via semantic headings + `aria-current` + focus rings; reduced-motion respected in `ChangelogJumpNav`. |
| §6 Voice | PASS | All visible prose authored to voice — `What's new in Bristle.` (declarative period, no exclamation), `Public, dated, attributable. The shape of our pace.` (dry, plain), entry titles like `Compare view now supports up to four problems` (no hype), entry bodies like `You asked. We over-engineered.` (slightly dry self-aware register). The April 14 entry's `Sorry.` is the strongest emotional beat — apologetic, not promotional. Em-dashes are punctuation, not exclamations. Voice grep clean on rendered output (SC-026). |
| §8 Repo structure | PASS | Page-local section components under `apps/web/src/components/changelog/` (new directory; mirrors slice-005 `landing/`, slice-006 `pricing/` / `faq/`, slice-008 `about/` / `contact/`, slice-009 `legal/`, slice-010 `blog/`). Content data + types + XML helper colocated. Two route files at `apps/web/src/app/changelog/page.tsx` (REWRITE) and `apps/web/src/app/changelog.atom/route.ts` (NEW). The `changelog.atom` directory name is a Next.js literal segment — `.` is treated as a literal character in App Router path segments (not a route delimiter). No `lib/` change. |
| §9 Never-do | PASS | No edits to `design/`, no edits to PDFs/docs; spec→plan→tasks→implement honored; building exactly the spec; **slice-005 nav and footer untouched** (FR-036 — top-nav line 6 + site-footer line 8 already point at `/changelog`; verified via grep at plan time); **slice-006 pricing/FAQ untouched** (including `FaqScrollSpyRail` — `ChangelogJumpNav` is a structural mirror in a separate file, not a refactor); **slice-008 about/contact/lib untouched**; **slice-009 legal untouched** (including `TocRail`); **slice-010 blog untouched** (including `BlogRailToc`); no `localStorage`. The slice-005 `/changelog/page.tsx` ComingSoon stub IS rewritten wholesale — this is the only existing-file change permitted by FR-001 / FR-036 and is the wholesale-replacement precedent slices 006 (`/pricing`), 008 (`/about`), and 010 (`/blog`) already established. |
| §10 Ambiguity | PASS | All 9 clarifications resolved in the spec (a-i per spec §Clarifications); no NEEDS CLARIFICATION markers remain. |

**Result**: PASS. Zero new top-level dependencies, zero edits to shipped slices other than the documented `/changelog/page.tsx` wholesale rewrite. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/011-changelog/
├── spec.md              # done (all 9 clarifications resolved)
├── plan.md              # this file
├── research.md          # Phase 0 — the 15 decisions
├── contracts/
│   └── ui-and-db.md     # Phase 1 — content shapes inline + ChangelogEntry types + ChangelogJumpNav signature + Atom feed body shape + route metadata shape
├── quickstart.md        # Phase 1 — gate recipe + SC mapping (includes Atom validation command)
├── checklists/
│   └── requirements.md  # passing
└── tasks.md             # Phase 2 — NOT created here
```

No `data-model.md` (per user direction — no schema change, no new DB shape; content shapes documented inline in `contracts/ui-and-db.md`).

### Source Code (exact file tree of additions)

```text
apps/web/src/
├── app/
│   ├── changelog/
│   │   └── page.tsx                                # REWRITE — slice-005 ComingSoon stub → full Changelog page (FR-001)
│   └── changelog.atom/
│       └── route.ts                                # ADD — Next.js Route Handler emitting Atom 1.0 XML (FR-002)
└── components/
    └── changelog/
        ├── types.ts                                # ADD — ChangelogType + ChangelogEntry + ChangelogFigureContent + ChangelogMonthGroup + ChangelogJumpItem shapes
        ├── changelog-entries.ts                    # ADD — CHANGELOG_ENTRIES: ReadonlyArray<ChangelogEntry> (13 entries across 5 months, [PLACEHOLDER] header)
        ├── atom-xml.ts                             # ADD — escapeXml() helper + buildAtomFeed() template-string function
        ├── changelog-hero.tsx                      # ADD — server component (CHANGELOG eyebrow + serif h1 + subhead)
        ├── changelog-badge.tsx                     # ADD — server component (Feature / Improvement / Fix pill, tokens-only colors)
        ├── changelog-figure.tsx                    # ADD — server component (hand-rolled diagonal-stripes SVG placeholder + caption overlay)
        ├── changelog-entry.tsx                     # ADD — server component (3-col row at md+: date / title+badge+body / optional figure; stacks at mobile; <article id="entry-{slug}">)
        ├── changelog-month-section.tsx             # ADD — server component (<section data-changelog-month> + h2 + conditional "Current" pill + ChangelogEntry × N)
        ├── changelog-jump-nav.tsx                  # ADD — client component ("use client", 4th structural mirror of FAQ/Legal/Blog rails)
        ├── rss-subscribe-card.tsx                  # ADD — server component (RSS · ATOM eyebrow + inline /changelog.atom link)
        └── changelog-layout.tsx                    # ADD — server component (month-grouping + currentMonthKey computation + composes TopNav + main + SiteFooter)
```

**One modification to existing-on-main files**: `apps/web/src/app/changelog/page.tsx` is rewritten wholesale (FR-001 — slice-005 `<ComingSoon version="0.2.5" />` stub → full Changelog page per `design/Public_pages.pdf` page 8). All other existing-on-main files (top-nav, site-footer, all slice-005/006/008/009/010 component dirs and lib modules) are **unchanged**. Verified via grep at plan time:

```
$ grep -n '"/changelog"' apps/web/src/components/landing/top-nav.tsx apps/web/src/components/landing/site-footer.tsx
apps/web/src/components/landing/top-nav.tsx:6:  { label: "Changelog", href: "/changelog" },
apps/web/src/components/landing/site-footer.tsx:8:      { label: "Changelog", href: "/changelog" },
```

Both already point at `/changelog`; the link flips from a known-out-of-scope soft-404 (the slice-005 `ComingSoon` stub) to the live Changelog page the moment slice 011 ships. **No edit to top-nav.tsx or site-footer.tsx** (FR-036, SC-017).

**Structure Decision**: page-local section components under `apps/web/src/components/changelog/` follows the slice-005/006/008/009/010 precedent. The two route files at `apps/web/src/app/changelog/page.tsx` (rewrite) and `apps/web/src/app/changelog.atom/route.ts` (new) follow Next.js App Router conventions. The `changelog.atom` directory uses Next.js's literal-segment routing (the `.` in the directory name maps to a literal `.` in the URL path; the inner `route.ts` file makes it a Route Handler rather than a page).

---

## The 15 required decisions

### 1. Composition — **confirmed: page = Server Component composing ChangelogLayout; feed = Route Handler GET emitting Atom XML**

**`/changelog` page**:

```tsx
// apps/web/src/app/changelog/page.tsx (sketch — REWRITE; replaces slice-005 ComingSoon stub)
import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";
import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { ChangelogLayout } from "@/components/changelog/changelog-layout";

const TITLE = "Changelog — Bristle";
const DESCRIPTION = "Public, dated, attributable changelog for Bristle. The shape of our pace.";

export const metadata: Metadata = { /* per decision §10 */ };

export default async function ChangelogIndex() {
  return <ChangelogLayout entries={CHANGELOG_ENTRIES} />;
}
```

`ChangelogLayout` is a Server Component that owns the month-grouping algorithm + the `currentMonthKey` computation + the rail-item projection — keeping `/changelog/page.tsx` thin (~10 lines) and centralizing the data-shaping logic in one place.

**`/changelog.atom` feed**:

```ts
// apps/web/src/app/changelog.atom/route.ts (sketch — NEW Route Handler)
import { SITE_URL } from "@bristle/shared";
import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { buildAtomFeed } from "@/components/changelog/atom-xml";

export const dynamic = "force-static";        // attempt static prerender at build time
export const revalidate = false;              // build-time only; no ISR

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

The handler is a pure-data emission — it imports the same `CHANGELOG_ENTRIES` array the page consumes, calls a build-time helper to render the XML body, and returns a `Response` with the Atom-specific MIME type. **The page and the feed cannot drift** because both consume the same source.

**Rationale**: keeps the data store as the single source of truth (no parallel feed-shape data file); maps 1:1 to spec FR-001 + FR-002; the Route Handler shape is the canonical Next.js 15 pattern for XML/feed endpoints.

**Alternatives considered**:
- Build the feed XML inside `/changelog/page.tsx`'s metadata (rejected — Next.js metadata is for HTML `<head>` elements, not full XML responses; the feed needs its own URL endpoint).
- Generate the feed at build time as a static asset in `public/` (rejected — couples build-step tooling to content edits; the Route Handler approach co-locates the feed logic with the data and lets `force-static` produce the same effect).
- Pre-render the feed via Next.js's `generateStaticParams` pattern (rejected — `generateStaticParams` is for dynamic segments; `/changelog.atom` is a single static endpoint, the Route Handler with `force-static` is the correct primitive).

**Files for `/changelog` page**: `next` (Metadata), `@bristle/shared` (SITE_URL), `changelog-entries` (data), `changelog-layout` (the composition wrapper).

**Files for `/changelog.atom` feed**: `@bristle/shared` (SITE_URL), `changelog-entries` (data), `atom-xml` (the `buildAtomFeed()` template + `escapeXml()` helper).

### 2. Server vs Client boundary — **confirmed: 1 client file, all other new files are Server / data / type / helper modules**

Only `apps/web/src/components/changelog/changelog-jump-nav.tsx` carries `"use client"` (it uses `useState`, `useEffect`, `useRef` for the IntersectionObserver + mobile-pill ref Map). **Back to slice-009 cardinality** (1 client file) — slice 010 was the outlier at 3 because it introduced the first stateful filter UI in the product.

Every other new file:
- `apps/web/src/app/changelog/page.tsx` + `apps/web/src/app/changelog.atom/route.ts` — async Server Component + Route Handler respectively.
- `ChangelogLayout`, `ChangelogHero`, `ChangelogMonthSection`, `ChangelogEntry`, `ChangelogBadge`, `ChangelogFigure`, `RssSubscribeCard` — Server Components.
- `types.ts` — pure TS module (types only, no runtime).
- `changelog-entries.ts` — pure TS module (a single typed constant; no runtime logic).
- `atom-xml.ts` — pure TS module (exports `escapeXml()` + `buildAtomFeed()`; no React, no client APIs).

**Net: 1 client file, 11 other new files + 1 page rewrite + 1 new Route Handler.** Verifiable by `grep -l "use client" apps/web/src/components/changelog/ apps/web/src/app/changelog/page.tsx apps/web/src/app/changelog.atom/route.ts` returning exactly one file (FR-033 / SC-025).

**Rationale**: same posture as slices 006 / 008 / 009 (1 client each). The Atom feed handler has zero client JavaScript by definition — it returns an XML `Response`, not a React tree. The `ChangelogJumpNav` is the only stateful surface (scroll-spy needs `IntersectionObserver` + `useState`); everything else renders as zero-JS HTML.

### 3. `ChangelogEntry` + `ChangelogMonthGroup` + `ChangelogJumpItem` shapes — **confirmed (verbatim) with `ReadonlyArray`**

```ts
// apps/web/src/components/changelog/types.ts (sketch)

export type ChangelogType = "feature" | "improvement" | "fix";

export interface ChangelogFigureContent {
  caption: string;
  /**
   * Forward-compatible: a future content slice can add `src?: string` to
   * carry real screenshot URLs without changing consumers. NOT used this
   * slice (only the placeholder treatment renders).
   */
}

export interface ChangelogEntry {
  /** kebab-case; serves as both the <article id="entry-{slug}"> anchor target
   *  AND the per-entry Atom <id> permalink fragment. */
  slug: string;
  /** ISO yyyy-mm-dd; used for sorting + Atom <updated> RFC 3339 derivation. */
  date: string;
  /** Pre-formatted display string, e.g. "MAY 8" / "APR 22". Per clarification (g)
   *  carried from slice 010 — fixed compile-time strings to avoid runtime Intl. */
  displayDay: string;
  /** kebab-case month identifier, e.g. "may-2026". Used by ChangelogJumpNav's
   *  IntersectionObserver via the [data-changelog-month] attribute. */
  monthKey: string;
  /** e.g. "May 2026". Rendered in ChangelogMonthSection's <h2>. */
  monthLabel: string;
  title: string;
  type: ChangelogType;
  /** Single paragraph. Rendered as <p> in the entry body AND as <summary> in the Atom feed. */
  body: string;
  /** Only set on entries that ship with a placeholder figure (May 8 only this slice). */
  figure?: ChangelogFigureContent;
}

/**
 * Projection ChangelogLayout creates after grouping by monthKey + computing
 * the current-month flag. Passed into ChangelogMonthSection. The `isCurrent`
 * boolean drives the conditional "Current" pill render (exactly one month
 * has isCurrent: true — the one containing max(entry.date)).
 */
export interface ChangelogMonthGroup {
  monthKey: string;
  monthLabel: string;
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

**Confirmations from your draft**:
- `ChangelogType` is a string-literal union of exactly 3 values: `"feature" | "improvement" | "fix"`. Display labels are derived in `ChangelogBadge` (no enum-to-label table in types; just an inline `Record` in the component).
- `ChangelogEntry.date` is ISO `yyyy-mm-dd` (string, not `Date`). Comparison via direct string comparison works because ISO 8601 dates are lexicographically sortable.
- `ChangelogEntry.figure` is optional; per FR-026 only the May 8 entry carries one this slice.
- `ChangelogMonthGroup` carries `isCurrent: boolean` directly on the group (rather than passing `currentMonthKey: string` separately into each section) — simpler prop surface for `ChangelogMonthSection`.
- `ChangelogJumpItem` is the minimal `{monthKey, displayLabel}` projection consumed by the rail (no entries, no isCurrent — the rail doesn't need them).
- `ReadonlyArray<T>` on `entries` matches the `as const` discipline from prior slices.

**Refinement vs your draft**: `ChangelogJumpItem.displayLabel` is the field name (not `monthLabel`) — clearer that this is the rail's display string. The projection lives in `ChangelogLayout` (decision §4 below); rail just consumes the item shape.

**Alternatives considered**:
- Use `Date` objects instead of string `date` (rejected — JSON-serializable string is cleaner; no time-zone semantics needed; ISO yyyy-mm-dd sorts lexicographically).
- Inline `ChangelogFigureContent` as `{caption: string}` directly in `ChangelogEntry` (rejected — named interface preserves forward-compatibility for the future `src?: string` field).
- Make `figure` required with a discriminator (rejected — only one entry has a figure this slice; optional + presence check is the natural fit).

### 4. Month-grouping algorithm — **confirmed: lives in ChangelogLayout as a single linear pass**

```ts
// apps/web/src/components/changelog/changelog-layout.tsx (sketch — grouping logic)

interface ChangelogLayoutProps {
  entries: ReadonlyArray<ChangelogEntry>;
}

export function ChangelogLayout({ entries }: ChangelogLayoutProps) {
  // Step 1: derive uniqueMonthKeys preserving source order.
  // CHANGELOG_ENTRIES is already in reverse-chronological order (most-recent first),
  // so [...new Set(...)] preserves that order.
  const uniqueMonthKeys = [...new Set(entries.map((e) => e.monthKey))];

  // Step 2: group entries by monthKey.
  const byMonth = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const list = byMonth.get(entry.monthKey);
    if (list) list.push(entry);
    else byMonth.set(entry.monthKey, [entry]);
  }

  // Step 3: compute currentMonthKey = entry with max(date) → its monthKey.
  // Direct string comparison works because ISO yyyy-mm-dd is lexicographically sortable.
  const currentMonthKey = entries.reduce((max, e) => (e.date > max.date ? e : max)).monthKey;

  // Step 4: emit ChangelogMonthGroup[] in source order with isCurrent flag.
  const months: ChangelogMonthGroup[] = uniqueMonthKeys.map((monthKey) => {
    const monthEntries = byMonth.get(monthKey)!;
    return {
      monthKey,
      monthLabel: monthEntries[0].monthLabel,
      entries: monthEntries,
      isCurrent: monthKey === currentMonthKey,
    };
  });

  // Project to ChangelogJumpItem[] for the rail.
  const jumpItems: ChangelogJumpItem[] = months.map((m) => ({
    monthKey: m.monthKey,
    displayLabel: m.monthLabel,
  }));

  return ( /* TopNav + main(two-col body) + SiteFooter; see decision §1 + §10 */ );
}
```

**Confirmations from your draft**:
- 4-step algorithm: derive ordered keys → group → compute current → emit groups with `isCurrent`.
- Lives **inside `ChangelogLayout`** (not in a separate `group-entries.ts` helper). Reason: the grouping is consumed in exactly one place; extracting to a helper adds an import without simplifying any consumer. Same posture as slice-010's `tocItems` projection living inside `BlogPostLayout`.
- ISO date string comparison is correct for `yyyy-mm-dd` (no `new Date()`, no `Date.now()`, no locale dependency).
- `[...new Set(arr)]` preserves insertion order (guaranteed by ECMAScript spec since ES2015).
- `byMonth.get(monthKey)!` non-null assertion is safe because the key list was derived from the same array.

**Performance**: O(N) overall (single pass for Step 1's map+Set construction, single pass for Step 2's group, single pass for Step 3's reduce, single pass for Step 4's map). For N=13 entries this is trivially fast; the algorithm scales linearly if entries ever grow to N=hundreds.

**Alternatives considered**:
- Sort entries by date first, then group (rejected — adds an unnecessary sort; the data store ships in source order = reverse-chronological order by editorial discipline; FR-026 verbatim content reflects this).
- Compute `currentMonthKey` via `Math.max(...entries.map(e => Date.parse(e.date)))` (rejected — adds runtime Date parsing; the lexicographic string comparison is correct for ISO yyyy-mm-dd and avoids any Date/locale machinery).
- Extract grouping to `apps/web/src/components/changelog/group-entries.ts` helper (rejected — single consumer; YAGNI). If a future slice needs grouped entries elsewhere (e.g. a sidebar widget on the dashboard), extract then.

### 5. XML-escaping function — **confirmed: hand-rolled helper in `atom-xml.ts`, six lines of replace chains**

```ts
// apps/web/src/components/changelog/atom-xml.ts (sketch — escapeXml helper)

/**
 * Escape the five XML predefined entities per RFC 4287 / XML 1.0 §2.4.
 * Order matters: `&` must be escaped FIRST so subsequent `&lt;` / `&gt;` /
 * `&quot;` / `&apos;` aren't double-escaped.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

**Confirmations from your draft**:
- Location: `apps/web/src/components/changelog/atom-xml.ts` (co-located with the feed template builder; NOT inlined in the route handler — keeps the route handler thin and the helper unit-testable in principle).
- Function: `escapeXml(s: string): string` — five XML predefined entities, ampersand first.
- Applied to every entry-derived string interpolated into the Atom template: `entry.title`, `entry.body`, `entry.slug` (defense-in-depth — slugs are kebab-case-safe by construction but pass through for safety), feed-level `<title>` literal (no escaping needed but consistent application), `<subtitle>` literal.
- Hand-rolled, no new dep, ~6 lines of `.replace()` chains.

**Critical correctness note**: the `&` escape MUST happen first. If `<` were escaped first, the resulting `&lt;` would then have its `&` re-escaped to `&amp;lt;` — corrupting the output. The order in the snippet above is correct.

**Alternatives considered**:
- Use `xmlbuilder2` library (rejected — adds ~50 KB dep for ~6 lines of code we can hand-roll; SC-028 / FR-029 require zero new deps).
- Use a single regex with a replacement function (rejected — five sequential `.replace()` calls are clearer and equally fast for the input sizes; the function-replacement variant has a subtle pitfall with backreferences).
- Use `DOMParser`-based serialization (rejected — DOM APIs aren't available in Node/Edge runtime; would require `jsdom` or similar).

### 6. Atom feed template — **confirmed: template-string `buildAtomFeed()` function**

```ts
// apps/web/src/components/changelog/atom-xml.ts (sketch — buildAtomFeed function)

/**
 * Build a valid Atom 1.0 feed body from CHANGELOG_ENTRIES + SITE_URL.
 *
 * Atom 1.0 spec: RFC 4287 (https://datatracker.ietf.org/doc/html/rfc4287).
 * Output is verified against the spec by element-presence greps in the
 * implementing PR's test plan + optionally by `xmllint --noout` parse-check.
 *
 * Entry <updated> uses 12:00:00Z (midday UTC) as the stable convention:
 * the data store carries date-only precision (yyyy-mm-dd), and midday UTC
 * is the most timezone-fair point of the day (within ±12 hours of every
 * timezone's local "that day"). This avoids future drift if locale handling
 * is ever added.
 */
export function buildAtomFeed(
  entries: ReadonlyArray<ChangelogEntry>,
  siteUrl: string,
): string {
  const feedId = `${siteUrl}/changelog`;
  const feedSelfHref = `${siteUrl}/changelog.atom`;
  const feedHtmlHref = `${siteUrl}/changelog`;
  const maxDate = entries.reduce((max, e) => (e.date > max.date ? e : max)).date;
  const feedUpdated = `${maxDate}T12:00:00Z`;

  const entryXml = entries
    .map((entry) => {
      const entryId = `${siteUrl}/changelog#entry-${entry.slug}`;
      const entryUpdated = `${entry.date}T12:00:00Z`;
      return `  <entry>
    <id>${escapeXml(entryId)}</id>
    <title>${escapeXml(entry.title)}</title>
    <updated>${entryUpdated}</updated>
    <link rel="alternate" type="text/html" href="${escapeXml(entryId)}"/>
    <summary type="text">${escapeXml(entry.body)}</summary>
    <category term="${escapeXml(entry.type)}"/>
    <author><name>Bristle</name></author>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(feedId)}</id>
  <title>Bristle Changelog</title>
  <subtitle>Public, dated, attributable. The shape of our pace.</subtitle>
  <updated>${feedUpdated}</updated>
  <link rel="self" type="application/atom+xml" href="${escapeXml(feedSelfHref)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(feedHtmlHref)}"/>
  <author><name>Bristle</name></author>
  <generator uri="https://bristle.dev">Bristle hand-rolled</generator>
${entryXml}
</feed>
`;
}
```

**Confirmations from your draft**:
- Template structure: prolog + `<feed xmlns>` + 8 feed-level elements + N `<entry>` blocks + closing `</feed>`.
- Feed-level: `<id>`, `<title>`, `<subtitle>`, `<updated>`, `<link rel="self">`, `<link rel="alternate" type="text/html">`, `<author>`, `<generator>` — all 8 present.
- Per-entry: `<id>`, `<title>`, `<updated>`, `<link rel="alternate">`, `<summary>`, `<category>`, `<author>` — all 7 present.
- Entry `<updated>` ISO format: `{entry.date}T12:00:00Z` (midday UTC, since the data store has date-only precision). This is a stable convention that won't drift across rebuilds.
- All entry-derived strings pass through `escapeXml()` for defense-in-depth.

**Feed-level `<title>`**: literal `Bristle Changelog`. Note the spec FR-019 says `Bristle changelog` (lowercase c); the design page 8 likely shows it both ways. I'm pinning the title-cased version `Bristle Changelog` because (a) it matches the page-level `<title>` element on `/changelog` (`Changelog — Bristle` — title-cased), (b) it's how readers commonly see it in feed-reader UIs. If the founder prefers lowercase to match the design's editorial tone, this is a single string edit. Final string flagged for plan-time confirmation (see decision-tradeoff list at the end).

**Generator string**: `<generator uri="https://bristle.dev">Bristle hand-rolled</generator>` — `Bristle hand-rolled` is the inner text (mildly self-aware, matches §6 voice register). The `uri` attribute is the production homepage.

**Entry `<updated>` midday UTC convention**: the data store only has date-precision (`2026-05-08`), so we need to pick a time. Options were:
- `00:00:00Z` (midnight UTC) — earliest possible interpretation of "the day", but biases against UTC-west readers (a `2026-05-08T00:00:00Z` entry shows as "May 7" for everyone west of UTC).
- `12:00:00Z` (midday UTC) — within ±12 hours of every timezone's local "that day"; the most timezone-fair point.
- Use the build timestamp — defeats the per-entry date semantic and makes the feed change every build for cosmetic reasons.

Midday UTC is the right convention. Documented inline in the helper's TSDoc.

**Rationale**: keeps the feed shape declarative and inspectable; template strings are easier to review than tree-builder API calls; the helper is testable in isolation if a future slice ever adds Vitest harness.

**Alternatives considered**:
- Tree-builder API (e.g. via `xmlbuilder2`'s `create()` chain) (rejected per §3 stack constraint + §5 / FR-029 zero-deps).
- JSX-style XML construction (rejected — TypeScript JSX support requires React-specific tooling; not natively supported for XML output).
- Single one-shot template with no per-entry sub-template (rejected — extraction makes the per-entry shape clearer + easier to maintain when adding fields).

### 7. `ChangelogJumpNav` IO config — **confirmed: structural mirror of slice-010 `BlogRailToc`**

Verbatim mirror of slice-010 `BlogRailToc` (which itself was a verbatim mirror of slice-009 `TocRail`, which mirrored slice-006 `FaqScrollSpyRail`). **Fourth structural mirror** in the project.

```ts
// apps/web/src/components/changelog/changelog-jump-nav.tsx (sketch — CLIENT)
"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { ChangelogJumpItem } from "./types";

const ROOT_MARGIN = "-80px 0px -55% 0px";
const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_MQ = "(min-width: 768px)";

interface ChangelogJumpNavProps {
  items: ReadonlyArray<ChangelogJumpItem>;
  ariaLabel?: string;
}

export function ChangelogJumpNav({
  items,
  ariaLabel = "Jump to a month",
}: ChangelogJumpNavProps) {
  // Seed active with the first month so the rail's visual state is correct
  // before the IntersectionObserver fires (anti-flicker per slices 009/010).
  const [active, setActive] = useState<string>(items[0]?.monthKey ?? "");
  const visibleMonths = useRef<Map<string, number>>(new Map());
  const mobilePillRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // IntersectionObserver: track every [data-changelog-month]; pick the
  // topmost intersecting one and set active to its monthKey. If nothing
  // intersects (visitor between months), preserve the previous active value
  // — no flicker per slice-006 plan §D6 / slice-010 plan §D6.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-changelog-month]",
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const monthKey =
            entry.target.getAttribute("data-changelog-month") ?? "";
          if (!monthKey) continue;
          if (entry.isIntersecting) {
            visibleMonths.current.set(monthKey, entry.boundingClientRect.top);
          } else {
            visibleMonths.current.delete(monthKey);
          }
        }
        if (visibleMonths.current.size === 0) return;

        let topMonthKey: string | null = null;
        let topY = Infinity;
        for (const [monthKey, y] of visibleMonths.current) {
          if (y < topY) {
            topY = y;
            topMonthKey = monthKey;
          }
        }
        if (topMonthKey) setActive(topMonthKey);
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Mobile pill auto-scroll: keep the active pill on-screen.
  useEffect(() => {
    if (window.matchMedia(DESKTOP_MQ).matches) return;
    const pill = mobilePillRefs.current.get(active);
    if (!pill) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    pill.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, monthKey: string) {
    // Modifier-key passthrough (Cmd/Ctrl/Shift/middle-click → native nav).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const target = document.querySelector(
      `[data-changelog-month="${monthKey}"]`,
    );
    if (!target) return;
    const reduce = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <nav aria-label={ariaLabel}>
      {/* Desktop sticky vertical rail (md+) */}
      <ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">
        {/* anchors per item with active = border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary */}
      </ul>
      {/* Mobile horizontal pill row (below md) */}
      <ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">
        {/* anchors per item, active = bg-text-primary text-surface-card rounded-pill */}
      </ul>
    </nav>
  );
}
```

**All four IO + scroll + ARIA invariants from slice-010 honored verbatim**:
- `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0` — exactly as slices 006 / 009 / 010.
- **Selector `[data-changelog-month]`** — distinct from `[data-faq-item]` (slice 006), `[data-legal-section]` (slice 009), `[data-blog-section]` (slice 010).
- `useState<string>(items[0]?.monthKey ?? "")` initial — first month is active pre-IO; same flicker fix.
- `Map<string, number>` ref + linear scan for topmost-visible — identical to slice-010.
- `matchMedia("(prefers-reduced-motion: reduce)").matches` read fresh in both `handleClick` and the mobile-pill `useEffect`.
- Modifier-key short-circuit (`e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0`).
- **ARIA**: single `<nav aria-label="Jump to a month">` wrapping desktop + mobile lists; anchors are plain `<a href="#{monthKey}">` with `aria-current={isActive ? "location" : undefined}`. **NO `role="tablist"`**, NO `role="tab"`, NO `aria-selected`.

**One semantic refinement vs prior rails**: the click handler resolves the target via `document.querySelector('[data-changelog-month="..."]')` rather than `document.getElementById(...)`. Reason: the month sections' anchor IDs are derived from the `monthKey` (e.g. `#may-2026`), but the IO selector also uses `[data-changelog-month]`. Using `querySelector` on the data attribute keeps the rail's click + IO logic symmetric — both find sections by the same attribute. Slice-009/010 used `getElementById` because each section also carried `id={section.id}`; slice-011 sections will carry `id={monthKey}` for native anchor-link behavior + `data-changelog-month={monthKey}` for IO scoping, so both approaches work, but the `querySelector` approach is cleaner here.

**Aria-label**: `Jump to a month` (per the user's spec). Distinguishes from slice-005 `TopNav`'s primary-nav label + slice-009 `TocRail`'s `Sections of the page` + slice-010 `BlogRailToc`'s `Sections of the article`. Each rail on each page has a distinct landmark label so screen-reader users hear unambiguous navigation surfaces.

**Tracked follow-up updated**: from "extract `FaqScrollSpyRail` + `TocRail` + `BlogRailToc` into shared `SectionScrollSpyRail`" to **"extract `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) + `ChangelogJumpNav` (011) into shared `SectionScrollSpyRail` in a dedicated refactor slice between Tier 2 ship and Tier 3 start"**. Four structural mirrors now exist; the refactor pressure is the **highest of any tracked follow-up in the project**.

**Rationale**: same as slices 009 / 010 — re-deriving the IO config from scratch would risk regressing three slices of iteration; the structural mirror is **intentional** per FR-012; the shared abstraction is a future-slice problem.

### 8. Badge palette tokens — **confirmed (with text-on-accent correction)**

```tsx
// apps/web/src/components/changelog/changelog-badge.tsx (sketch)

import type { ChangelogType } from "./types";

const LABEL: Record<ChangelogType, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
};

const CLASSES: Record<ChangelogType, string> = {
  // Feature: filled, prominent. Note: text-on-accent token does NOT exist
  // in globals.css; using text-surface-card on bg-accent-bristle matches
  // the slice-009 TocRail mobile-pill active-state recipe.
  feature: "bg-accent-bristle text-surface-card",
  // Improvement: filled, soft, secondary.
  improvement: "bg-surface-raised text-text-primary",
  // Fix: outlined, muted (visually de-emphasized so fixes don't compete
  // with features visually).
  fix: "text-text-secondary border border-border-default",
};

export function ChangelogBadge({ type }: { type: ChangelogType }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-body-sm font-medium ${CLASSES[type]}`}
    >
      {LABEL[type]}
    </span>
  );
}
```

**Per-type palette** (final, confirmed):

| Type | Background | Text | Border | Recipe |
|---|---|---|---|---|
| `feature` | `bg-accent-bristle` | `text-surface-card` | — | filled accent (mirrors slice-009 TocRail mobile pill) |
| `improvement` | `bg-surface-raised` | `text-text-primary` | — | filled neutral |
| `fix` | (transparent) | `text-text-secondary` | `border border-border-default` | outlined muted |

**Pill shape**: `rounded-pill px-2 py-0.5 text-body-sm font-medium` — uses the `--radius-pill` token (999px from §4.4) and Tailwind's default `px-2 py-0.5` for compact pill sizing. Font size `text-body-sm` (13px) is the §4.2 token for caption-grade text.

**Correction from user's first draft**: the originally-suggested `text-on-accent` token does NOT exist in `globals.css` (verified via `grep -E "text-on-accent|color-text-on" apps/web/src/app/globals.css` returning empty). Using `text-surface-card` on `bg-accent-bristle` is the canonical recipe — the slice-009 `TocRail` mobile-pill active-state uses this exact pair (`bg-text-primary text-surface-card` → for slice 011's `bg-accent-bristle text-surface-card`, same `text-surface-card` color, different background). High-contrast white-on-orange (Editorial Light) and white-on-bright-orange (Editorial Dark) both meet WCAG AA contrast for the badge size.

**Rationale**: visible identity decision — features are the most-celebrated entry type, so the filled-accent treatment makes them pop in the entry list; improvements get a muted-neutral fill so they read as "shipped but not headline news"; fixes get an outlined-muted treatment because they're "we fixed something, sorry it was broken" — visually de-emphasized to keep the celebratory affordance on features.

**Accessibility**: the text content (`Feature` / `Improvement` / `Fix`) is the **accessible affordance** — screen readers read the badge text verbatim, not the color. WCAG 2.2 SC 1.4.1 (Use of Color) is satisfied because color is not the sole means of conveying type.

**Alternatives considered**:
- All three types share the same filled style with only color differentiating (rejected — visual hierarchy is part of the design; outlined-Fix de-emphasizes correctly per design intent).
- Use category-tints from §4.1a (rejected — those are scoped to problem-card category chips, not changelog type badges; semantic mismatch).
- Custom per-type background tokens (rejected — adds tokens for narrow per-component use; the existing 3 tokens cover the palette cleanly).

### 9. `ChangelogFigure` SVG — **confirmed: hand-rolled diagonal-stripes placeholder + caption overlay**

```tsx
// apps/web/src/components/changelog/changelog-figure.tsx (sketch — server component)
import type { ChangelogFigureContent } from "./types";

export function ChangelogFigure({ figure }: { figure: ChangelogFigureContent }) {
  return (
    <figure className="my-grid">
      <svg
        viewBox="0 0 1280 720"
        role="img"
        aria-label={`Screenshot placeholder for ${figure.caption}`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="diagonal-stripes"
            patternUnits="userSpaceOnUse"
            width="24"
            height="24"
            patternTransform="rotate(45)"
          >
            <rect width="24" height="24" className="fill-surface-raised" />
            <line
              x1="0" y1="0" x2="0" y2="24"
              className="stroke-border-strong opacity-30"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect width="1280" height="720" fill="url(#diagonal-stripes)" />
        <text
          x="640" y="370"
          textAnchor="middle"
          className="fill-text-secondary font-mono"
          fontSize="22"
        >
          screenshot · {figure.caption} · 1280×720
        </text>
      </svg>
    </figure>
  );
}
```

**Confirmations from your draft**:
- 16:9 aspect ratio via `viewBox="0 0 1280 720"` + `className="w-full h-auto"` + `preserveAspectRatio="xMidYMid meet"`.
- Background: SVG `<pattern>` of diagonal stripes at 45° rotation; `<rect>` background fill in `fill-surface-raised`; stripe lines in `stroke-border-strong` at `opacity-30` for low-contrast hatching.
- Centered overlay: SVG `<text>` element at viewport center `(640, 370)` with `textAnchor="middle"` for horizontal centering; `fill-text-secondary` for muted text; `font-mono` for the small-caps editorial mono treatment; font-size 22 (readable at intrinsic 1280×720 and scales proportionally with the container).
- Caption format: `screenshot · {figure.caption} · 1280×720` — mono small caps reading "screenshot · compare view · 1280×720" for the May 8 entry.

**Accessibility decision**: `role="img"` + `aria-label="Screenshot placeholder for ${figure.caption}"`. **Not** `role="presentation"` — the figure conveys "here will be a screenshot" semantic content; screen-reader users should hear that affordance. The aria-label uses descriptive text (e.g. "Screenshot placeholder for compare view") rather than just the caption verbatim, so the placeholder nature is announced.

**Refinement vs your draft**: `aria-label` form is `Screenshot placeholder for {caption}` (more informative than just the inline caption text). The visible `<text>` element inside the SVG is the editorial treatment for sighted users; the `aria-label` is the screen-reader affordance.

**SVG bundle weight**: ~30 lines of XML, ~0.4 KB compressed. Only rendered on entries with `figure` set (1 entry this slice). Trivial impact on First Load JS.

**Rationale**: the figure is decorative-placeholder — represents "a screenshot lives here" semantic intent, not real visual content. Hand-rolled SVG keeps the bundle free of image asset weight; tokens-only colors keep §4 discipline. The founder swaps to real screenshots (PNG/WebP in `public/`) in a future content slice; the `ChangelogFigureContent` type's forward-compatible `src?: string` field (decision §3) supports the swap without breaking consumers.

**Alternatives considered**:
- Render `<img src="/changelog/placeholders/compare-view.png" alt="Screenshot placeholder for compare view" />` (rejected — adds a binary asset to the repo for placeholder content; harder to iterate; the SVG can vary per entry via the caption text without per-entry asset files).
- Use CSS `repeating-linear-gradient(45deg, ...)` instead of SVG `<pattern>` (rejected — would require a wrapping `<div>` with background-image; the inline SVG approach keeps the figure self-contained and ratio-correct).
- Render real screenshot now if available (rejected — out of scope per spec §"Out of scope" — real screenshots ship in a future content slice).

### 10. Per-page metadata — **confirmed shape**

```ts
// apps/web/src/app/changelog/page.tsx (sketch — metadata)

import type { Metadata } from "next";
import { SITE_URL } from "@bristle/shared";

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
```

**Confirmations from your draft**:
- `title: "Changelog — Bristle"` — matches the slice-006 / 008 / 009 / 010 title-suffix pattern.
- `description: "Public, dated, attributable changelog for Bristle. The shape of our pace."` — single sentence in §6 voice; mirrors the page subhead.
- `og:image`: slice-005 raster reused unchanged at `${SITE_URL}/og-image.png` (1200×630, deployed). No new OG image authored this slice.
- `alternates.types["application/atom+xml"]` emits `<link rel="alternate" type="application/atom+xml" href="<absolute>/changelog.atom" title="Bristle changelog feed">` in the page `<head>` — feed-discovery affordance per FR-023 / FR-028 / SC-016. The Next.js metadata API's `alternates.types` field accepts an array of `{url, title}` per type; emits the `<link>` element automatically.
- **No `robots` field** → indexable by default. Removes the slice-005 stub's `robots: { index: false, follow: false }` (which was correct for the soft-404 stub; incorrect for the live page).

**`og:type: "website"`** vs `"article"`: the Changelog page is a section landing page (a log of entries), not a single article. `website` is the canonical OG type for landing pages. Slice 010 used `"article"` for individual `/blog/[slug]` pages because each is a discrete article; slice 011 uses `"website"` because `/changelog` is a single index page (the entries are sections of it, not separate articles).

**Rationale**: `alternates.types` is the Next.js-native way to declare feed-discovery; the framework emits the correct `<link rel="alternate">` element automatically. Using the framework API avoids hand-rolling `<head>` content via `<head>` manipulation.

### 11. `/changelog.atom` render mode — **confirmed: force-static with revalidate: false**

```ts
// apps/web/src/app/changelog.atom/route.ts (sketch — render mode exports)

// Attempt build-time static prerender. Next.js 15 supports `force-static` on
// Route Handlers for GET requests with no per-request state.
export const dynamic = "force-static";

// No ISR — the feed is purely compile-time data, no need for revalidation
// windows. Re-deploys trigger a fresh build.
export const revalidate = false;
```

**Confirmations from your draft**:
- `export const dynamic = "force-static"` — instructs Next.js to prerender the Route Handler's response at build time (instead of running it per-request).
- `export const revalidate = false` — explicitly opts out of Incremental Static Regeneration; the feed is fully compile-time data.
- Cache-Control header on the `Response` object: `public, s-maxage=3600` (1-hour edge cache). The header is set explicitly in the handler (decision §1) — independent of the `dynamic`/`revalidate` exports.

**Expected build output**: `/changelog.atom` shows as `○ Static` (single line; the route is not dynamic-segmented). If Next.js's Route Handler classification falls back to `ƒ Dynamic` despite `force-static` (which can happen with certain header configurations or non-GET methods), that's acceptable per FR-034 — the response is still cached at the edge via `s-maxage=3600`, and the handler is pure-data so the runtime cost is microseconds. The actual classification is documented in the implementing PR's test plan.

**Rationale**: build-time prerender is the optimal shape — the feed never changes between builds because the data store is compile-time. Static serving via Vercel's edge CDN is sub-1ms; even a `ƒ Dynamic` classification with edge cache is sub-10ms after the first request.

**Alternatives considered**:
- Omit the render-mode exports and let Next.js classify automatically (rejected — explicit declarations are clearer for the reviewer; the framework's automatic classification can change between Next.js versions).
- Use `revalidate: 3600` (ISR with 1-hour window) instead of `false` (rejected — the feed is purely compile-time; ISR adds runtime complexity for no benefit; the response Cache-Control header already handles the 1-hour edge window).
- Generate a literal `public/changelog.atom` file at build time via a custom Next.js plugin (rejected — Route Handler with `force-static` produces the same effect with less tooling).

### 12. Performance / SEO budget — **confirmed**

| Route | Expected First Load JS | Client bundles | Notes |
|---|---|---|---|
| `/changelog` | **~107-110 KB** | `ChangelogJumpNav` (~1-2 KB compiled) | Comparable to slice-009 `/terms` (107 KB) and slice-010 `/blog/[slug]` (107 KB). One client component, no Radix, no zod, content-static. |
| `/changelog.atom` | **0 KB** | — | XML response, no React tree, no JS payload. |

**Estimation method**:
- Slice-005 `/` baseline = ~106 KB First Load JS (TopNav + SiteFooter + Next.js runtime).
- Slice-009 `/terms` = ~107 KB (baseline + TocRail ~1-2 KB).
- Slice-010 `/blog` = ~107 KB (baseline + BlogArticleGrid + BlogFilterChips ~2-3 KB).
- Slice-011 `/changelog`: baseline + ChangelogJumpNav (identical bundle size to TocRail) ≈ 106 + 1-2 ≈ **~107-110 KB**.

**Investigation threshold**: if `/changelog` exceeds **130 KB** at build, investigate. Likely candidates: accidental import of slice-006/009/010 rail components (would defeat the additive-only discipline); accidental import of `xmlbuilder2` or `feed` (would violate zero-deps); accidental Radix component imports.

**Lighthouse posture**:
- Performance ≥ 90: large-static-content + minimal-JS; LCP candidate is `ChangelogHero`'s serif headline (server-rendered text with `font-display: swap`).
- Accessibility ≥ 90: WCAG 2.2 AA discipline (heading semantics h1/h2, `aria-current="location"`, focus rings, keyboard reach on rail anchors, `role="img"` + `aria-label` on figure SVG).
- Best Practices ≥ 90: HTTPS-only, no console errors.
- SEO ≥ 90 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag: noindex` artifact.

**Atom feed performance**: the feed body is ~4-5 KB of XML (13 entries × ~300 bytes each + ~500 bytes feed-level overhead). With `force-static` + `s-maxage=3600` edge cache, response time is sub-1ms after the first request. No JS payload by definition.

### 13. ARIA + a11y posture — **confirmed (with scroll-mt location pinned)**

**`/changelog`**:
- `<main>` landmark wrapping the body (h1 is `ChangelogHero`'s `What's new in Bristle.`).
- `ChangelogJumpNav`: `<nav aria-label="Jump to a month">` per decision §7; on stub articles (N/A this slice — no stubs in changelog), would return `null` like slice-010's `BlogRailToc`.
- `ChangelogMonthSection`: `<section data-changelog-month={monthKey} id={monthKey} className="scroll-mt-section">` with an `<h2>{monthLabel}</h2>` and the conditional `Current` pill as an inline `<span>` next to the h2.
- `ChangelogEntry`: `<article id="entry-{slug}" className="scroll-mt-section">` containing the 3-col row at md+ (date / title+badge+body / figure stacks below).
- `ChangelogBadge`: `<span>` with the text content (`Feature` / `Improvement` / `Fix`) — accessible affordance.
- `ChangelogFigure`: `<figure>` containing `<svg role="img" aria-label="Screenshot placeholder for {caption}">`.
- `RssSubscribeCard`: `<aside>` (or no semantic wrapper — see below) with `<p>` for the eyebrow + `<p>` containing the prose with inline `<a href="/changelog.atom">`.
- Tab order: TopNav → `ChangelogJumpNav` (5 anchors in DOM order) → entries via their permalink h3/`<a>` (if any — entries themselves aren't necessarily focusable; the `<article id>` is for native anchor-link navigation, not Tab targeting) → `RssSubscribeCard` link → SiteFooter.

**`scroll-mt` location** (your specific question): `scroll-mt-section` applied to the `<section data-changelog-month>` wrapper. Reason: the scroll-spy targets are the month sections (`document.querySelectorAll('[data-changelog-month]')`), so when the IO fires after a click + scroll, the section's top edge needs to be offset from the visible top nav. Individual `<article id="entry-{slug}">` anchors inherit the same offset because they live inside the section — when a deep-link to an entry triggers anchor scroll, the browser scrolls to the entry's top, which is inside the section's scroll-mt offset zone. **Single application** at the section level covers both scroll-spy clicks and deep-link entry anchors.

**Refinement**: also apply `scroll-mt-section` to each `<article id="entry-{slug}">` as a defense-in-depth measure. CSS `scroll-margin-top` is a per-target property — applying it to both the section AND the entry means deep-link to either kind of anchor lands correctly even if the visitor scrolls in unusual ways. Cost: zero (one extra class per entry); benefit: bulletproof anchor behavior.

**`role="article"` on entries**: NOT added explicitly because `<article>` is a semantic HTML5 element with implicit `role="article"`; redundant ARIA is anti-pattern.

**`prefers-reduced-motion`**: respected in `ChangelogJumpNav`'s click handler + mobile-pill scroll effect (decision §7). All other animations on the page are `transition-colors` color shifts (per Tailwind default 150ms), already reduced-motion-safe.

### 14. Risks, unknowns & tracked follow-ups

#### Risks (in-slice)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to `Public_pages.pdf` page 8 for `/changelog` | Med | Low | Map every dimension to tokens; screenshot-compare at 1280 width; the `ChangelogHero` serif headline + sticky rail layout + 3-col entry row + `Current` pill positioning are the most-likely 4px-tolerance suspects. |
| R2 | The Atom feed body fails strict XML parse (e.g. unescaped `&` in entry content, or malformed template-string interpolation) | Low | High | The `escapeXml()` helper handles all 5 XML predefined entities. The feed body is validated at gate time via `xmllint --noout <(curl <local>/changelog.atom)` per the quickstart recipe. If `xmllint` is not available locally, the gate falls back to element-presence greps (verify `<feed>`, `<id>`, `<title>`, `<updated>`, 13 `<entry>` blocks). |
| R3 | The `ChangelogJumpNav`'s click handler resolves the wrong section because `querySelector('[data-changelog-month="..."]')` is more permissive than `getElementById` | Low | Low | Each month section has exactly one `data-changelog-month` value (unique within the page), so the selector resolves to exactly one element. Tested implicitly by the scroll-spy walk at gate time. |
| R4 | `force-static` is silently downgraded to `ƒ Dynamic` by Next.js's Route Handler classifier | Med | Low | Spec FR-034 already accepts this fallback; the `s-maxage=3600` Cache-Control header ensures edge caching kicks in regardless. The actual classification is documented in the PR. |
| R5 | The entry `<updated>` midday-UTC convention shows future-dated entries (e.g. May 8 at 12:00Z = May 8 5am Pacific time / May 8 midnight Hawaii time → still "May 8" everywhere) | Very Low | Low | This is the intended behavior — midday UTC is timezone-fair. Documented inline in the helper's TSDoc. |
| R6 | A future content edit accidentally drops the `[PLACEHOLDER]` header from `changelog-entries.ts` | Low | Low | Gate-time grep verifies the header is on line 1 (parallel to slice-009 SC-005 / slice-010 SC-005-equivalent). Same discipline as prior slices. |
| R7 | `ChangelogFigure`'s placeholder caption (`screenshot · compare view · 1280×720`) leaks into the Atom feed `<summary>` text | Very Low | Low | The Atom feed `<summary>` is derived from `entry.body` only — `entry.figure.caption` is a separate field consumed only by the figure component. No data path from caption → feed body. Verified by reading the `buildAtomFeed()` helper inline. |
| R8 | The data store grows to N=100+ entries and the page becomes slow to render | Very Low (single-author cadence) | Low (perf only) | Currently 13 entries; growth to 50-100 takes ~2 years at the current cadence (~1-2 entries/month). A "Past releases" archive pagination slice would land before this becomes a real concern (out of scope per spec). |
| R9 | First Load JS on `/changelog` exceeds 180 KB gz | Very Low | High | One client component (~1-2 KB); content-static; zero new deps. Estimation puts it at 107-110 KB. ≥130 KB triggers investigation. |
| R10 | The fourth structural mirror of the scroll-spy rail (FAQ + Legal + Blog + Changelog) increases refactor pressure to the point where the next slice (2.6 or 2.7) is forced to address it | Confirmed expected | Low (in slice 011), Med (next slice) | Documented as the **highest-priority tracked follow-up** below. The refactor is bounded (4 files → 1 + 4 thin wrappers, ~80% code shared); the decision is "when to land", not "if". |

#### Tracked follow-ups (out of scope this slice, captured here for future-slice authoring)

**ELEVATED priority** (top of the list):

- **Dedupe `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) + `ChangelogJumpNav` (011) into a shared `SectionScrollSpyRail`**. Four structural mirrors now exist; refactor pressure is the highest in the project. The shared abstraction parameterizes over (a) selector (`[data-faq-item]` / `[data-legal-section]` / `[data-blog-section]` / `[data-changelog-month]`), (b) items source type (each rail's TocItem-equivalent), (c) `aria-label` string, (d) — for the Changelog case — the data-attribute-vs-id selector strategy (slice 011 uses `querySelector` on the data attribute; others use `getElementById`; the shared component should support both or normalize to one approach). **Recommended timing**: dedicated refactor slice between Tier 2 ship (after 2.7 lands) and Tier 3 start. Could also be batched into slice 2.7 if scope allows.

Standard follow-ups (in priority order):

- **Real screenshot assets for `ChangelogFigure`** — only the May 8 entry has a placeholder figure this slice. Real screenshots ship in a future content slice; the `ChangelogFigureContent` type's forward-compatible shape supports the swap.
- **Real authored content for all 13 changelog entries** — founder edit pass on the `[PLACEHOLDER]` prose before Tier-2 v0.2.0 launch.
- **Atom feed validation tooling** — recommend adding a `pnpm changelog:validate` script that runs `xmllint --noout <(curl ...)` or fetches W3C feedvalidator.org against the deployed feed. Useful for future content slices that add entries.
- **Entry permalink deep pages** (e.g. `/changelog/entries/{slug}`) — anchors-only this slice; deep pages are a future-slice ask if/when individual entries warrant their own SEO / share affordance.
- **Tag/category filtering** — entries have a `type` field (3 values) but no multi-tag system; if future entries benefit from cross-cutting tags (e.g. `mobile`, `api`, `pricing`), add later.
- **"Past releases" archive separation** — single-page approach until entries grow beyond ~50; pagination becomes a future slice.
- **Per-article OG image generation for changelog entries** — currently the page-level OG uses slice-005's raster; per-entry OG would be `@vercel/og` dynamic image generation (parallel to the slice-010 Blog deferred follow-up).

**Carry-forwards** from slice 010 (all 14, in priority order):

1. Empty-state UX on `BlogArticleGrid` — defensive fallback.
2. `categoryLabel` mapping dedupe — extract when 5th consumer or category rename happens.
3. `--duration-hover` token — retrofit when motion-polish slice lands.
4. RSS feed for `/blog` — slice 2.7 (note: slice 011 ships the Atom feed pattern that the blog feed could mirror).
5. Author profile pages.
6. `/blog/categories/[category]` SEO deep pages.
7. Slice-005 `<main>` landmark fix.
8. NewsletterStub markup convergence — slice 2.7.
9. `/privacy/sub-processors` deep page.
10. Refund-policy alignment audit (permanent cross-slice constraint).
11. Form spam protection.
12. Resend Vitest harness.
13. Per-article OG image generation for blog posts.
14. Custom Bristle-voiced 404 page.

#### Unknowns

None. The spec has 9 clarifications, all resolved upstream.

### 15. Implementation batching — **confirmed: 4 batches / 4 STOPs**

- **Batch A / STOP 1 — Foundations** (~3 commits, sequential):
  - T001: `types.ts` (ChangelogType + ChangelogFigureContent + ChangelogEntry + ChangelogMonthGroup + ChangelogJumpItem)
  - T002: `changelog-entries.ts` (13 entries verbatim, `[PLACEHOLDER]` header) — depends on T001
  - T003: `atom-xml.ts` (escapeXml + buildAtomFeed) — depends on T001
  - **Verification gate**: typecheck/lint + `[PLACEHOLDER]` header check + entry count (13) + monthKey distribution (5 unique months, counts 3/3/3/2/2) + verbatim opening-phrase greps + escapeXml unit invariant (the function escapes `&` first; sanity-check by tracing through the implementation).

- **Batch B / STOP 2 — Template primitives** (~7 commits, mostly [P]-parallel):
  - T004 [P]: `ChangelogHero` (server) — eyebrow + serif h1 + subhead
  - T005 [P]: `ChangelogBadge` (server) — Feature/Improvement/Fix pill with tokens-only colors
  - T006 [P]: `ChangelogFigure` (server) — hand-rolled SVG diagonal-stripes + caption overlay
  - T007 [P]: `ChangelogEntry` (server) — 3-col row at md+; depends on T005 + T006
  - T008 [P]: `ChangelogMonthSection` (server) — h2 + Current pill conditional + entries map; depends on T007
  - T009 [P]: `RssSubscribeCard` (server) — eyebrow + inline /changelog.atom link
  - T010 [P]: `ChangelogJumpNav` (client) — 4th structural mirror; depends only on T001 types
  - **Verification gate**: typecheck/lint + `grep -l "use client"` returns only T010 + hex/font-family/voice/emoji greps + per-component visual smoke. Note: T007 + T008 are sequential within Batch B (T008 imports T007 which imports T005 + T006), but most of Batch B is genuinely [P].

- **Batch C / STOP 3 — Layout + Routes** (~3 commits, sequential):
  - T011: `ChangelogLayout` (server, owns month-grouping + currentMonthKey + jump-items projection) — depends on T004 + T008 + T009 + T010
  - T012: `/changelog/page.tsx` REWRITE — depends on T002 + T011
  - T013: `/changelog.atom/route.ts` ADD — depends on T002 + T003
  - **Verification gate**: typecheck/lint/build + first read of First Load JS budgets + Atom feed curl + initial structural verification.

- **Batch D / STOP 4 — Gates** (no commits, 2 verification gates):
  - T014: T-local gate — pnpm typecheck/lint/build (SC-023); First Load JS < 180 KB on `/changelog` (SC-021); Lighthouse ≥ 90 on `/changelog` (SC-020); responsive sweep at 320/375/768/1024/1280/1440 (SC-018); hex/font/voice/emoji greps clean (SC-026); scroll-spy walk on `/changelog` (smooth-scroll, scroll-spy follows, mobile pill auto-scroll, modifier-key passthrough, reduced-motion instant) (SC-005, SC-006, SC-008); Current pill grep returns exactly 1 hit (SC-009); deep-link anchor walk (SC-010); Atom feed structural validation (curl + element-presence greps for feed-level + 13 entries) (SC-011, SC-012, SC-013); Atom XML escape correctness (search for unescaped `&` characters in the feed body; verify `xmllint --noout` parses cleanly if available) (SC-014); Atom cache header (SC-015); feed-discovery link in page head (SC-016); per-page metadata (SC-019); render mode (SC-022); `"use client"` file count = 1 (SC-025); pnpm-lock.yaml unchanged (SC-028); git diff --stat zero modifications outside slice 011 dirs (SC-027); slice-005 top-nav + footer Changelog link regression check.
  - T015: T-preview-parity gate — push branch via gh-token HTTPS (SSH agent still stale); Vercel preview deploy; all 17 routes (16 prior + /changelog; /changelog.atom counted as one of the 17) return 200; Atom feed renders correctly on preview hostname; slice-005 top-nav Changelog link regression check on preview; slice-006/008/009/010 regressions clean.

**Expected total: ~13 commit-producing tasks + 2 verification gates = 15 tasks**. Slightly smaller than slice 010 (18 tasks) because: 1 client component vs 3; smaller Batch C (3 sequential tasks vs 5).

## Order of operations

1. **Batch A**: T001 (types.ts) → T002 (changelog-entries.ts) and T003 (atom-xml.ts) [both depend on T001; can [P]-parallel].
2. **Batch B**: T004-T010 mostly [P]-parallel after T001. T007 (ChangelogEntry) needs T005 (Badge) + T006 (Figure). T008 (MonthSection) needs T007. T010 (ChangelogJumpNav) is independent of all other Batch B components.
3. **Batch C**: T011 (ChangelogLayout) needs T004 + T008 + T009 + T010. T012 (/changelog/page.tsx REWRITE) needs T002 + T011. T013 (/changelog.atom route) needs T002 + T003.
4. **Batch D**: T014 (local gate) → push branch → T015 (preview parity).

`types.ts` (Batch A first task) gates the whole slice. `changelog-entries.ts` gates both routes. `atom-xml.ts` gates the feed Route Handler. `ChangelogLayout` gates the page Server Component.

## Complexity Tracking

No constitution violations — section intentionally empty. The fourth structural mirror of the scroll-spy rail (006 → 009 → 010 → 011) is recorded above in §14 / tracked follow-ups as the highest-priority deferred refactor (additive-only this slice; shared `SectionScrollSpyRail` lands in a dedicated refactor slice or batched with 2.7).
