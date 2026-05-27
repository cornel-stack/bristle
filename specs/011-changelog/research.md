# Research: Changelog + Atom feed

Phase 0 decisions (the 15 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: page = Server Component composing ChangelogLayout; feed = Route Handler GET emitting Atom XML

- **Decision**: `/changelog/page.tsx` is a thin async Server Component (~10 lines) that imports `CHANGELOG_ENTRIES` + renders `<ChangelogLayout entries={...} />`. `ChangelogLayout` owns the month-grouping + `currentMonthKey` computation + jump-items projection. `/changelog.atom/route.ts` is a Next.js Route Handler exporting `GET` that imports the same `CHANGELOG_ENTRIES`, calls `buildAtomFeed(entries, SITE_URL)`, and returns a `Response` with `Content-Type: application/atom+xml; charset=utf-8` + `Cache-Control: public, s-maxage=3600`.
- **Rationale**: keeps the data store as single source of truth; page and feed cannot drift; maps 1:1 to FR-001 + FR-002; Route Handler is canonical Next.js 15 pattern for XML/feed endpoints.
- **Alternatives**: feed XML in page metadata (rejected — metadata is HTML `<head>`, not full XML responses); build-time static asset in `public/` (rejected — couples build-step tooling to content edits); `generateStaticParams` (rejected — that's for dynamic segments, not single endpoints).

## D2 — Server vs Client boundary: 1 client file, 11 other new files + 1 page rewrite + 1 new Route Handler

- **Decision**: only `changelog-jump-nav.tsx` carries `"use client"`. Back to slice-009 cardinality (1 client file) — slice 010 was the outlier at 3 because of its first stateful filter UI. Verifiable by `grep -l "use client" apps/web/src/components/changelog/ apps/web/src/app/changelog/page.tsx apps/web/src/app/changelog.atom/route.ts` returning exactly one file.
- **Rationale**: Atom feed handler has zero JS by definition (returns XML `Response`, not React tree). `ChangelogJumpNav` is the only stateful surface (scroll-spy + IO). Server-default everywhere else.
- **Alternatives**: client-render the entries list with filter chips (rejected — out of scope per spec; the slice doesn't ship a filter UI); render the feed via a Server Component that returns XML (rejected — Server Components return JSX, not arbitrary response bodies; Route Handler is the correct primitive).

## D3 — `ChangelogEntry` + `ChangelogMonthGroup` + `ChangelogJumpItem` shapes (verbatim + ReadonlyArray)

- **Decision**: per plan §3. `ChangelogType = "feature" | "improvement" | "fix"`; `ChangelogEntry = { slug, date (ISO), displayDay, monthKey, monthLabel, title, type, body, figure?: { caption } }`; `ChangelogMonthGroup = { monthKey, monthLabel, entries: ReadonlyArray<ChangelogEntry>, isCurrent: boolean }` carrying the `isCurrent` flag directly on the group; `ChangelogJumpItem = { monthKey, displayLabel }` minimal projection.
- **Rationale**: ISO yyyy-mm-dd strings sort lexicographically — no `Date` parsing needed. `figure` optional matches FR-026 (only May 8 has one). `isCurrent` on the group keeps section's prop surface simple (1 boolean vs 1 string compare). `ChangelogJumpItem.displayLabel` (vs `monthLabel`) is clearer that this is the rail's render string.
- **Alternatives**: `Date` objects (rejected — JSON-serializable string is cleaner, no tz semantics); pass `currentMonthKey` into each section as a string and let the section compare (rejected — simpler to compute once in Layout and pass the boolean); merge `monthKey` + `monthLabel` into a composite (rejected — separation matches slice-010 BlogArticleSection's `id` + `title` precedent).

## D4 — Month-grouping algorithm: 4-step linear pass inside ChangelogLayout

- **Decision**: lives inside `ChangelogLayout` (NOT a separate helper). Steps: (1) `[...new Set(entries.map(e => e.monthKey))]` for ordered unique keys (entries are reverse-chronological in source order); (2) `Map<string, ChangelogEntry[]>` group; (3) `currentMonthKey = entries.reduce((max, e) => e.date > max.date ? e : max).monthKey` via ISO string comparison; (4) emit `ChangelogMonthGroup[]` in source order with `isCurrent` flag. Project to `ChangelogJumpItem[]` for the rail.
- **Rationale**: O(N) overall; single linear pass per step; for N=11 trivially fast; scales linearly. `[...new Set(arr)]` preserves insertion order (ES2015 spec). ISO yyyy-mm-dd lex-compare is correct. Single consumer — YAGNI on extracting to a helper.
- **Alternatives**: sort by date first (rejected — adds unnecessary sort; data store ships in source order = reverse-chronological by editorial discipline); `Math.max(...entries.map(e => Date.parse(e.date)))` for current month (rejected — adds runtime Date parsing, string compare suffices); extract to `group-entries.ts` (rejected — single consumer; YAGNI).

## D5 — XML-escaping function: hand-rolled helper, ampersand-first, six lines

- **Decision**: `escapeXml(s: string): string` in `apps/web/src/components/changelog/atom-xml.ts`. Five sequential `.replace()` calls escaping `& < > " '` to `&amp; &lt; &gt; &quot; &apos;` — **ampersand first** so subsequent `&lt;`/`&gt;` aren't double-escaped. Applied to every entry-derived string interpolated into the Atom template.
- **Rationale**: 6 lines of code; zero new dep (FR-029 / SC-028); the order-of-operations correctness (ampersand first) is the only subtle bit. Co-located with `buildAtomFeed()` in same file so reviewers see both together.
- **Alternatives**: `xmlbuilder2` library (rejected — ~50 KB dep for 6 lines we can hand-roll); single regex with replacement function (rejected — sequential `.replace()` calls are clearer for this size); `DOMParser` serialization (rejected — DOM APIs aren't in Node/Edge runtime).

## D6 — Atom feed template: template-string `buildAtomFeed()` with midday-UTC `<updated>` convention

- **Decision**: `buildAtomFeed(entries, siteUrl)` returns the full Atom 1.0 XML body. Feed-level: 8 elements (`<id>`, `<title>` `Bristle Changelog`, `<subtitle>` page subhead, `<updated>` from `max(entry.date)` at `T12:00:00Z`, `<link rel="self">`, `<link rel="alternate" type="text/html">`, `<author>`, `<generator>`). Per entry: 7 elements (`<id>`, `<title>`, `<updated>` at `T12:00:00Z`, `<link rel="alternate">`, `<summary type="text">`, `<category term={type}>`, `<author>`). All entry-derived strings pass through `escapeXml()`.
- **Rationale**: midday-UTC `<updated>` is the most timezone-fair choice (within ±12 hours of every timezone's local "that day" — entries don't drift to "yesterday" or "tomorrow" anywhere on Earth). Title-cased `Bristle Changelog` matches the page-level `<title>` element + reader-UI conventions (lowercase variant flagged for plan-time founder confirmation but title-cased is the default).
- **Alternatives**: midnight UTC (`T00:00:00Z`) — rejected, biases against UTC-west readers; build timestamp — rejected, defeats per-entry date semantic; tree-builder API — rejected per stack constraint; JSX-style XML — rejected (TS JSX needs React tooling).

## D7 — `ChangelogJumpNav` IO config: structural mirror of slice-010 BlogRailToc

- **Decision**: verbatim mirror of slice-010 `BlogRailToc` (which mirrored slice-009 `TocRail`, which mirrored slice-006 `FaqScrollSpyRail`). `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`. Selector `[data-changelog-month]` (distinct from FAQ/Legal/Blog selectors). `useState<string>(items[0]?.monthKey ?? "")` flicker fix. `Map<string, number>` topmost-visible. `matchMedia` reduced-motion read fresh on every interaction. Modifier-key short-circuit. Single `<nav aria-label="Jump to a month">` wrapping desktop + mobile. `aria-current="location"` on active; NO `role="tablist"`. Mobile pill auto-scroll on `[active]` change.
- **One semantic refinement**: the click handler resolves the target via `document.querySelector('[data-changelog-month="..."]')` instead of `getElementById`. Slice-009/010 used `getElementById` because their sections carried `id={section.id}`; slice-011 sections carry `id={monthKey}` (for native anchor links) + `data-changelog-month={monthKey}` (for IO scoping), so `querySelector` on the data attribute keeps click + IO logic symmetric.
- **Rationale**: re-deriving the IO config from scratch would risk regressing three slices of iteration. Structural mirror is intentional per FR-012. **Refactor pressure now spans 4 implementations — highest priority tracked follow-up.**
- **Alternatives**: ship a shared `SectionScrollSpyRail` now (rejected — out-of-scope refactor; would need to touch FAQ + Legal + Blog rails simultaneously; high regression risk on three shipped surfaces); re-tune config (rejected — wasted iteration cost); arrow-key keyboard navigation between rail anchors (rejected — current-location nav pattern uses standard Tab order; arrow keys imply roving tabindex / tablist semantics).

## D8 — Badge palette tokens: filled-accent / filled-neutral / outlined-muted (with text-on-accent correction)

- **Decision**: Feature = `bg-accent-bristle text-surface-card` (filled, prominent — slice-009 TocRail mobile-pill recipe). Improvement = `bg-surface-raised text-text-primary` (filled neutral). Fix = `text-text-secondary border border-border-default` (outlined muted). Pill shape: `rounded-pill px-2 py-0.5 text-body-sm font-medium`.
- **Correction from user's first draft**: `text-on-accent` token does NOT exist in `globals.css` (verified via grep). `text-surface-card` on `bg-accent-bristle` is the slice-009 TocRail recipe — high-contrast white-on-orange, meets WCAG AA contrast for badge size.
- **Rationale**: visible identity decision — features celebrate with the accent fill; improvements are shipped-but-not-headline news (muted neutral); fixes are de-emphasized so they don't compete with features. Text content (`Feature` / `Improvement` / `Fix`) is the accessible affordance — WCAG 2.2 SC 1.4.1 satisfied.
- **Alternatives**: all three filled with only color differentiating (rejected — visual hierarchy is part of the design); category-tints from §4.1a (rejected — those are for problem-card chips, semantic mismatch); custom per-type tokens (rejected — adds tokens for narrow use).

## D9 — `ChangelogFigure`: hand-rolled diagonal-stripes SVG + caption overlay

- **Decision**: `viewBox="0 0 1280 720"` 16:9. SVG `<pattern>` of diagonal stripes at 45° rotation; background fill `fill-surface-raised`; stripe lines `stroke-border-strong opacity-30`. Centered `<text>` overlay reading `screenshot · {caption} · 1280×720` in `fill-text-secondary font-mono` at size 22. `role="img"` + `aria-label="Screenshot placeholder for {caption}"` — descriptive, signals placeholder nature.
- **Rationale**: hand-rolled SVG keeps bundle free of binary assets; tokens-only colors keep §4 discipline; per-entry caption variation without per-entry asset files. Future content slice swaps to real screenshots via the forward-compatible `src?: string` field.
- **Alternatives**: `<img src="/changelog/placeholders/compare-view.png">` (rejected — adds binary, harder to iterate); CSS `repeating-linear-gradient` (rejected — would need wrapping `<div>` with bg-image; self-contained SVG is better); real screenshot now (rejected — out of scope per spec).

## D10 — Per-page metadata: alternates.types for Atom feed-discovery

- **Decision**: `/changelog` metadata exports `title: "Changelog — Bristle"`, `description: "Public, dated, attributable changelog for Bristle. The shape of our pace."`, `og:type: "website"` (section landing, not single article), `og:image` slice-005 raster reuse, `alternates.types["application/atom+xml"]: [{ url: SITE_URL + "/changelog.atom", title: "Bristle changelog feed" }]` — Next.js metadata API emits the `<link rel="alternate" type="application/atom+xml">` element automatically.
- **Rationale**: `alternates.types` is the framework-native way to declare feed-discovery; avoids hand-rolling `<head>` content. `og:type: "website"` because Changelog is a section landing page (entries are sections, not separate articles — different from slice-010 `/blog/[slug]` which used `"article"`).
- **Alternatives**: hand-rolled `<link>` in a custom `<head>` (rejected — framework API is cleaner); `og:type: "article"` (rejected — semantic mismatch for a multi-entry log page).

## D11 — `/changelog.atom` render mode: force-static + revalidate: false

- **Decision**: `export const dynamic = "force-static"` + `export const revalidate = false`. Cache-Control header set explicitly on the `Response`: `public, s-maxage=3600`. Expected build output: `/changelog.atom` shows as `○ Static`.
- **Rationale**: feed is purely compile-time data; ISR adds runtime complexity for no benefit. Edge cache via Cache-Control covers freshness even if Next.js falls back to `ƒ Dynamic` classification. FR-034 accepts both classifications.
- **Alternatives**: omit render-mode exports and let Next.js auto-classify (rejected — explicit is clearer for reviewer + future-proof against Next.js classification changes); `revalidate: 3600` ISR (rejected — adds runtime complexity for no benefit); generate a literal `public/changelog.atom` via custom plugin (rejected — Route Handler + force-static produces the same effect with less tooling).

## D12 — Performance / SEO budget: 107-110 KB on /changelog, 0 KB on /changelog.atom

- **Decision**: `/changelog` target ~107-110 KB First Load JS (slice-005 baseline + `ChangelogJumpNav` ~1-2 KB). `/changelog.atom` zero JS by definition. Both ○ Static. ≥130 KB on `/changelog` triggers investigation.
- **Rationale**: comparable to slice-009 `/terms` (107 KB) and slice-010 `/blog/[slug]` (107 KB) — same client-component-cardinality and same content-static shape.
- **Alternatives**: lazy-load `ChangelogJumpNav` via `next/dynamic` (rejected — adds suspense boundary for ~1-2 KB savings; not worth the code complexity at this bundle size).

## D13 — ARIA + a11y posture: scroll-mt on both section AND entry wrappers

- **Decision**: `<main>` landmark. `ChangelogHero` h1. `ChangelogMonthSection` `<section data-changelog-month={monthKey} id={monthKey} className="scroll-mt-section">` with `<h2>`. `ChangelogEntry` `<article id="entry-{slug}" className="scroll-mt-section">`. `ChangelogBadge` text is accessible affordance. `ChangelogFigure` `<figure>` + `<svg role="img" aria-label>`. `ChangelogJumpNav` per D7. `scroll-mt-section` applied to **both** `<section data-changelog-month>` wrappers AND `<article id="entry-...">` wrappers — defense-in-depth for deep-link anchors landing correctly regardless of which level the URL targets.
- **Rationale**: WCAG 2.2 AA discipline carried forward from slices 005-010. Distinct `aria-label` per rail across pages prevents landmark-label collisions for screen-reader users. `scroll-mt` at both levels covers both scroll-spy clicks (section level) and deep-link entry anchors (entry level).
- **Alternatives**: `scroll-mt` only at section level (rejected — works for deep-link to entries inside sections via inheritance, but explicit per-entry is more bulletproof); `role="article"` explicit on entries (rejected — `<article>` has implicit `role="article"`, redundant ARIA is anti-pattern); arrow-key keyboard nav in rail (rejected — current-location pattern uses standard Tab order).

## D14 — Risks: see plan §14. Key items:

- R1 4px fidelity vs PDF p.8.
- R2 Atom feed XML parse correctness (mitigated by escapeXml + xmllint gate-time check).
- R4 force-static silently downgraded (mitigated by Cache-Control header).
- R10 **fourth structural mirror** of scroll-spy rail — refactor pressure highest yet, elevated to top of follow-ups.
- Tracked follow-ups (elevated): shared `SectionScrollSpyRail` absorbing 4 implementations; real screenshot assets; real authored entry content; Atom feed validation tooling; per-article OG generation; carry-forwards from slice 010.

## D15 — Batching: 4 batches / 4 STOPs

- **Decision**: Batch A foundations (3 tasks: types + entries + atom-xml); Batch B template primitives (7 tasks: hero, badge, figure, entry, month-section, RSS card, jump-nav — most [P]-parallel); Batch C layout + 2 routes (3 sequential tasks: ChangelogLayout, /changelog/page.tsx rewrite, /changelog.atom route); Batch D 2 verification gates.
- **Rationale**: same shape as slices 005/006/008/009/010. Smaller than slice 010 (13 commits vs 16) because: 1 client component vs 3; smaller Batch C; smaller Batch B by 2 components.
- **Alternatives**: collapse to 3 batches (rejected — separating template primitives from layout/routes preserves per-STOP review discipline); single batch (rejected — too much code for one review).
