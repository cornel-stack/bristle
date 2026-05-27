# Tasks: Changelog + Atom feed

**Input**: `spec.md` + `plan.md` + `research.md` + `contracts/ui-and-db.md` + `quickstart.md` in `specs/011-changelog/`
**Branch**: `011-changelog`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slices 005 / 006 / 008 / 009 / 010). Verification is the gate phase — typecheck/lint/build, First-Load JS budgets, `[PLACEHOLDER]` + verbatim-opening-phrase greps, hex/font/voice greps, route 200 + meta-tag curl, **Atom feed XML validation via curl + element-presence greps + `xmllint --noout` parse-check**, ChangelogJumpNav scroll-spy walk, deep-link anchor walk, **"Current" pill exactly-once check**, responsive sweep, visual diff vs `Public_pages.pdf` page 8 at 1280, **TWO link-flip regression checks** (slice-005 top-nav `Changelog` AND slice-005 footer Product-column `Changelog` both flip from soft-404 to live with zero edits to either file), additive-only diff check, slice-006/008/009/010 cross-slice regressions, and preview parity.

## Conventions

- **One commit per task.** Each commit-producing task lists its exact commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (visitor browses changelog + navigates months), US2 (visitor subscribes via Atom feed), US3 (perf/a11y/SEO/voice/responsive floors + slice integrity + TWO link flips), or SETUP.
- Every task has a **Verify** line — the objective check before committing (for edit tasks) or before STOPping (for gates).
- **Batching**: four batches, each ending in **one STOP** for review (per slice-006 / slice-008 / slice-009 / slice-010 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #9 (slice 010) merged to `main` via merge commit `f434f44` on 2026-05-26; `011-changelog` cut from clean `main` (no stacking; local main fast-forwarded via gh-token HTTPS before branch creation); branch starts at the spec commit `4d2fcad` (Spec Kit) and plan commit `1e2ef43` (Spec Kit). Slice-005 top-nav line 6 `{ label: "Changelog", href: "/changelog" }` + slice-005 site-footer line 8 `{ label: "Changelog", href: "/changelog" }` (Product column) — verified at plan time; **no top-nav or footer edit this slice** (FR-036). The slice-005 `apps/web/src/app/changelog/page.tsx` is currently a `<ComingSoon version="0.2.5" />` stub with `robots: { index: false, follow: false }` — slice 011 rewrites this file wholesale (FR-001 / SC-017).
- **Additive-only, zero new deps**: no top-level dependency added (`ChangelogJumpNav` hand-rolled `IntersectionObserver` per slices 006 + 009 + 010; `ChangelogFigure` hand-rolled inline SVG; Atom XML hand-rolled template strings with explicit `escapeXml()` helper — no `xmlbuilder2`, no `feed`, no `fast-xml-parser`). `pnpm-lock.yaml` MUST remain unchanged. **No edits to slice-005 / slice-006 / slice-008 / slice-009 / slice-010 files** other than the one mandated `/changelog/page.tsx` rewrite (FR-036, SC-027, SC-028).
- **Boundary reminder**: `apps/web/src/app/changelog/page.tsx` (rewrite) is an async Server Component; `apps/web/src/app/changelog.atom/route.ts` (new) is a Route Handler GET; **exactly one** file under `apps/web/src/components/changelog/` carries `"use client"` — `changelog-jump-nav.tsx` (plan §D2 / FR-033 / SC-025). The optional `figure.placeholderText` field (carried forward from the slice-010 dual-coverage discipline pattern) is N/A this slice — `ChangelogFigureContent` only carries `caption` per FR-024 / D3.
- **Structural-mirror discipline (ELEVATED)**: `ChangelogJumpNav` is the **fourth** structural mirror of the slice-006 `FaqScrollSpyRail`, slice-009 `TocRail`, slice-010 `BlogRailToc` pattern. It MUST NOT import from any of `apps/web/src/components/faq/scroll-spy-rail.tsx`, `apps/web/src/components/legal/toc-rail.tsx`, or `apps/web/src/components/blog/blog-rail-toc.tsx` — additive only. The tracked follow-up to extract a shared `SectionScrollSpyRail` now spans **4 implementations** and is the **highest-priority deferred refactor** in the project; explicitly out of scope this slice.
- **Key divergence from slices 009/010 (plan §D7)**: `ChangelogJumpNav`'s click handler resolves the target via `document.querySelector('[data-changelog-month="..."]')` (not `getElementById`). Slice 011 sections carry both `id={monthKey}` AND `data-changelog-month={monthKey}`; using the data attribute keeps click + IO logic symmetric. The eventual `SectionScrollSpyRail` refactor brief notes this divergence — when the shared rail lands, it needs to handle whichever target-resolution strategy is canonical (both work).
- **Don't-implement guard**: tasks.md is generated only. Do NOT run `/speckit.implement` — hold for user review.

---

## Batch A — types + content data + Atom helper  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] `types.ts` (ChangelogType + ChangelogEntry + ChangelogFigureContent + ChangelogMonthGroup + ChangelogJumpItem)
Create `apps/web/src/components/changelog/types.ts` exporting the canonical type module for the slice per plan §D3 / contracts:
- `ChangelogType` — string-literal union `"feature" | "improvement" | "fix"`.
- `ChangelogFigureContent` — `{ caption: string }`. Forward-compatible TSDoc note that a future content slice can add `src?: string` to carry real screenshot URLs without changing consumers; NOT set this slice.
- `ChangelogEntry` — `{ slug; date (ISO yyyy-mm-dd); displayDay (pre-formatted, e.g. "MAY 8"); monthKey (e.g. "may-2026"); monthLabel (e.g. "May 2026"); title; type: ChangelogType; body (single paragraph string); figure?: ChangelogFigureContent }`. ISO date string sorts lexicographically — no `Date` parsing needed.
- `ChangelogMonthGroup` — `{ monthKey; monthLabel; entries: ReadonlyArray<ChangelogEntry>; isCurrent: boolean }`. The projection `ChangelogLayout` creates after grouping + current-month detection. Exactly one group has `isCurrent: true` — the one containing `max(entry.date)`.
- `ChangelogJumpItem` — `{ monthKey; displayLabel }`. Minimal projection consumed by `ChangelogJumpNav`. Same Pick-style boundary discipline as slice-010 `BlogTocItem` per plan §D3.
- **Files**: `apps/web/src/components/changelog/types.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file exports all 5 named types/interfaces above (`grep -E "export (interface|type) (ChangelogType|ChangelogFigureContent|ChangelogEntry|ChangelogMonthGroup|ChangelogJumpItem)" apps/web/src/components/changelog/types.ts` returns 5 hits); `ChangelogEntry.body` is typed as `string` (not `ReadonlyArray<string>` — single paragraph this slice); `ChangelogEntry.figure?` is optional `ChangelogFigureContent`; `ChangelogMonthGroup.entries` is typed as `ReadonlyArray<ChangelogEntry>`; `ChangelogMonthGroup.isCurrent` is `boolean`; `ChangelogJumpItem.displayLabel` is the field name (not `monthLabel` — per plan §D3 refinement, clearer that this is the rail's render string).
- **Commit**: `feat(web): add changelog/types.ts (ChangelogEntry + month group + jump item shapes) (slice 011)`

### T002 · [P] [US1] [US2] `changelog-entries.ts` (13 entries verbatim from spec §15)
Create `apps/web/src/components/changelog/changelog-entries.ts` exporting `CHANGELOG_ENTRIES: ReadonlyArray<ChangelogEntry>` containing exactly **13** entries in reverse-chronological source order across 5 months. The file MUST begin with `// [PLACEHOLDER — changelog entries awaiting founder review before production launch]` on line 1 (FR-025).

**May 2026** (3 entries, May 8 is `max(entry.date)` → `isCurrent` lands here):
1. `compare-view-supports-four-problems` — `date: "2026-05-08"`, `displayDay: "MAY 8"`, `monthKey: "may-2026"`, `monthLabel: "May 2026"`, `type: "feature"`, `title: "Compare view now supports up to four problems"`, `body: "You asked. We over-engineered. The comparison grid now aligns six rows of metrics across four columns with a sticky header. Available on Pro and Team."`, `figure: { caption: "compare view" }` — **the only entry this slice with a figure**.
2. `slack-delivery-for-alerts` — `date: "2026-05-03"`, `displayDay: "MAY 3"`, `type: "feature"`, `title: "Slack delivery for alerts"`, `body: "Connect Slack from Settings → Integrations and your alerts can post into any channel with full report links and momentum."`
3. `smaller-faster-dashboard` — `date: "2026-05-01"`, `displayDay: "MAY 1"`, `type: "improvement"`, `title: "Smaller, faster dashboard"`, `body: "Initial JS bundle dropped from 264KB to 178KB gzipped. Dashboard LCP is now 1.4s on mid-range mobile over 4G."`

**April 2026** (3 entries):
4. `daily-digest-yesterday-comparison` — `date: "2026-04-22"`, `displayDay: "APR 22"`, `monthKey: "april-2026"`, `monthLabel: "April 2026"`, `type: "feature"`, `title: "Daily digest now includes a \"yesterday\" comparison"`, `body: "Every digest leads with what changed since the last one. The same problems lower in the list get the rest of the column."` — title contains literal `"yesterday"` quotes; will be `&quot;`-escaped in the Atom feed.
5. `fix-command-palette-firefox-138` — `date: "2026-04-14"`, `displayDay: "APR 14"`, `type: "fix"`, `title: "Fixed: command palette failing on Firefox 138"`, `body: "A focus-trap regression hid the results panel for Firefox users on the new Compositor pipeline. Sorry. We use Firefox here too."`
6. `source-apple-app-store-reviews` — `date: "2026-04-07"`, `displayDay: "APR 7"`, `type: "feature"`, `title: "Source: Apple App Store reviews"`, `body: "Sixth source live. Backfill running for the trailing 12 months. Expect synthesis updates on mobile-product problems within a week."`

**March 2026** (3 entries):
7. `improved-similarity-clustering` — `date: "2026-03-25"`, `displayDay: "MAR 25"`, `monthKey: "march-2026"`, `monthLabel: "March 2026"`, `type: "improvement"`, `title: "Improved similarity clustering"`, `body: "Clustering now uses semantic embeddings alongside lexical overlap. Fewer duplicate clusters; same precision."`
8. `fix-missing-momentum-backfilled-problems` — `date: "2026-03-12"`, `displayDay: "MAR 12"`, `type: "fix"`, `title: "Fixed: missing momentum on backfilled problems"`, `body: "Problems imported from the backfill pipeline were missing the 30-day momentum chart. All historical entries now have full momentum data."`
9. `export-to-csv` — `date: "2026-03-04"`, `displayDay: "MAR 4"`, `type: "feature"`, `title: "Export to CSV"`, `body: "Pro and Team users can export any problem report as CSV from Settings → Export. Includes evidence quotes with source attribution."`

**February 2026** (2 entries):
10. `source-product-hunt` — `date: "2026-02-20"`, `displayDay: "FEB 20"`, `monthKey: "february-2026"`, `monthLabel: "February 2026"`, `type: "feature"`, `title: "Source: Product Hunt"`, `body: "Fifth source live. Comments and ship-update threads ingested back to 2023."`
11. `faster-ingest` — `date: "2026-02-09"`, `displayDay: "FEB 9"`, `type: "improvement"`, `title: "Faster ingest"`, `body: "End-to-end ingest latency dropped meaningfully across all sources. Reports now reflect overnight discussions by the time you read the morning digest."`

**January 2026** (2 entries):
12. `public-launch` — `date: "2026-01-28"`, `displayDay: "JAN 28"`, `monthKey: "january-2026"`, `monthLabel: "January 2026"`, `type: "feature"`, `title: "Public launch"`, `body: "Bristle is now publicly available. The first 90 days are about pattern coverage, not feature breadth. Reach us at hello@bristle.dev."`
13. `initial-sources-live` — `date: "2026-01-14"`, `displayDay: "JAN 14"`, `type: "feature"`, `title: "Initial sources live"`, `body: "Bristle launches with four sources: GitHub Issues, Hacker News, Stack Overflow, and Google Play. Two more sources (Product Hunt, Apple App Store) ship in the following quarter."`

(Item numbers 1-13 above are in source order; the exported array length is **13** entries.)
- **Files**: `apps/web/src/components/changelog/changelog-entries.ts`
- **Depends on**: T001 (imports `ChangelogEntry`)
- **Verify**: `pnpm --filter web typecheck` exits 0; `head -1 apps/web/src/components/changelog/changelog-entries.ts` returns the `[PLACEHOLDER]` header verbatim; `CHANGELOG_ENTRIES.length === 13`; monthKey distribution check (`grep -c '"may-2026"' apps/web/src/components/changelog/changelog-entries.ts` returns `3`; `"april-2026"` returns `3`; `"march-2026"` returns `3`; `"february-2026"` returns `2`; `"january-2026"` returns `2`); exactly one `figure:` field (`grep -c "figure:" apps/web/src/components/changelog/changelog-entries.ts` returns `1`); type distribution (`grep -c '"feature"' ` returns `8` — 8 feature entries; `'"improvement"'` returns `3`; `'"fix"'` returns `2`); verbatim opener greps (the May 1 body starts `Initial JS bundle dropped from 264KB to 178KB`; the April 7 body starts `Sixth source live`; the January 28 body starts `Bristle is now publicly available.`); voice grep on prose clean (no `!` outside JS-operator carve-out, no emoji, no `amazing`/`awesome`); the apostrophe-quotes in the April 22 entry title (`\"yesterday\"`) are intentional XML-escape candidates for the Atom feed.
- **Commit**: `feat(web): add changelog-entries with 13 entries across 5 months (slice 011)`

### T003 · [P] [US2] `atom-xml.ts` (escapeXml helper + buildAtomFeed template-string function)
Create `apps/web/src/components/changelog/atom-xml.ts` exporting two functions per plan §D5 + §D6 / contracts:

```ts
// escapeXml: 5 sequential .replace() calls, ampersand FIRST (so subsequent
// &lt;/&gt;/&quot;/&apos; aren't double-escaped).
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// buildAtomFeed: returns full Atom 1.0 feed body as a template string.
export function buildAtomFeed(
  entries: ReadonlyArray<ChangelogEntry>,
  siteUrl: string,
): string;
```

Feed structure per plan §D6:
- XML prolog: `<?xml version="1.0" encoding="utf-8"?>`
- Root: `<feed xmlns="http://www.w3.org/2005/Atom">`
- Feed-level elements (8): `<id>` = `${siteUrl}/changelog`, `<title>Bristle Changelog</title>` (title-cased per plan §D6), `<subtitle>Public, dated, attributable. The shape of our pace.</subtitle>` (matches page subhead), `<updated>{maxDate}T12:00:00Z</updated>` (RFC 3339, midday UTC), `<link rel="self" type="application/atom+xml" href="...">`, `<link rel="alternate" type="text/html" href="...">`, `<author><name>Bristle</name></author>`, `<generator uri="https://bristle.dev">Bristle hand-rolled</generator>`.
- Per-entry elements (7): `<id>` = `${siteUrl}/changelog#entry-${slug}`, `<title>` (escaped via `escapeXml(entry.title)`), `<updated>{entry.date}T12:00:00Z</updated>` (midday UTC per plan §D6), `<link rel="alternate" type="text/html" href="...">`, `<summary type="text">` (escaped via `escapeXml(entry.body)`), `<category term="{escapeXml(entry.type)}"/>`, `<author><name>Bristle</name></author>`.
- All entry-derived strings interpolated into the template pass through `escapeXml()` for defense-in-depth (titles, bodies, URLs containing slug, category terms).
- `maxDate` derivation: `entries.reduce((max, e) => e.date > max.date ? e : max).date` (ISO yyyy-mm-dd lexicographic compare).
- **Files**: `apps/web/src/components/changelog/atom-xml.ts`
- **Depends on**: T001 (imports `ChangelogEntry`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file exports both `escapeXml` and `buildAtomFeed` named exports; `escapeXml` body shows the 5 `.replace()` calls in order `&` → `<` → `>` → `"` → `'` (verifiable by reading the file; CRITICAL — ampersand-first ordering); `buildAtomFeed` signature is `(entries: ReadonlyArray<ChangelogEntry>, siteUrl: string) => string`; the function uses template strings for the feed body (NOT a tree-builder API); imports `ChangelogEntry` from `./types`; no import of `xmlbuilder2` / `feed` / `fast-xml-parser` / any XML library (verify by `grep -E "xmlbuilder|^import.*xml" apps/web/src/components/changelog/atom-xml.ts` returning 0).
- **Commit**: `feat(web): add changelog/atom-xml.ts (escapeXml + buildAtomFeed template) (slice 011)`

**▸ STOP 1** — foundations ready: types defined, 13-entry data store in place with `[PLACEHOLDER]` header + correct monthKey distribution + verbatim openers + exactly one figure on May 8, Atom helper exports `escapeXml` (ampersand-first) + `buildAtomFeed` template. Verification per T001/T002/T003 Verify lines; STOP 1 gate also runs `pnpm --filter web typecheck && pnpm --filter web lint` against the three foundation files.

---

## Batch B — template primitives  ▸ STOP 2

### Phase 3: User Story 1 (page primitives) + User Story 3 (rail + a11y primitives)

### T004 · [P] [US1] `ChangelogHero` (server)
Create `apps/web/src/components/changelog/changelog-hero.tsx` — async Server Component. No props (the hero is identical on every render of `/changelog`). Renders per plan §1 / contracts:
- `<section className="pt-section pb-loose">`
- `<p>` eyebrow in `text-body-sm font-medium uppercase tracking-wide text-accent-bristle` reading `CHANGELOG`.
- `<h1>` in `font-serif text-display-lg text-text-primary` rendering `What's new in Bristle.`
- `<p>` subhead in `text-body-md text-text-secondary` reading `Public, dated, attributable. The shape of our pace.`
- Tokens-only. Zero hex literals.
- **Files**: `apps/web/src/components/changelog/changelog-hero.tsx`
- **Depends on**: — (no type imports needed)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; eyebrow uses `text-accent-bristle`; h1 uses `font-serif text-display-lg`; subhead in `text-text-secondary`; verbatim copy `What's new in Bristle.` + `Public, dated, attributable. The shape of our pace.`; `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0; `grep -cE "font-family|font-name"` returns 0.
- **Commit**: `feat(web): add ChangelogHero (CHANGELOG eyebrow + serif h1 + subhead) (slice 011)`

### T005 · [P] [US1] `ChangelogBadge` (server — Feature/Improvement/Fix pill with per-D8 palette)
Create `apps/web/src/components/changelog/changelog-badge.tsx` — async Server Component. Accepts `{ type: ChangelogType }`. Renders a small pill with per-type display label + token palette per plan §D8:

```tsx
const LABEL: Record<ChangelogType, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
};

const CLASSES: Record<ChangelogType, string> = {
  // Feature: filled accent. CRITICAL — text-on-accent token does NOT exist in
  // globals.css; using text-surface-card on bg-accent-bristle matches the
  // slice-009 TocRail mobile-pill active-state recipe.
  feature: "bg-accent-bristle text-surface-card",
  // Improvement: filled neutral.
  improvement: "bg-surface-raised text-text-primary",
  // Fix: outlined muted (visually de-emphasized).
  fix: "text-text-secondary border border-border-default",
};

<span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-body-sm font-medium ${CLASSES[type]}`}>
  {LABEL[type]}
</span>
```

Pill shape: `rounded-pill px-2 py-0.5 text-body-sm font-medium` — uses `--radius-pill` (999px from §4.4).
- **Files**: `apps/web/src/components/changelog/changelog-badge.tsx`
- **Depends on**: T001 (imports `ChangelogType`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; `LABEL` record has exactly 3 entries with `Feature` / `Improvement` / `Fix` strings; `CLASSES` record has 3 entries; Feature class string contains `bg-accent-bristle text-surface-card` (NOT `text-on-accent` — verified non-existent per plan §D8 + Constitution Check); Improvement contains `bg-surface-raised text-text-primary`; Fix contains `text-text-secondary border border-border-default`; pill shape uses `rounded-pill`; `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add ChangelogBadge (Feature/Improvement/Fix pill, tokens-only) (slice 011)`

### T006 · [P] [US1] `ChangelogFigure` (server — hand-rolled diagonal-stripes SVG placeholder)
Create `apps/web/src/components/changelog/changelog-figure.tsx` — async Server Component. Accepts `{ figure: ChangelogFigureContent }`. Renders per plan §D9 / contracts:

```tsx
<figure className="my-grid">
  <svg
    viewBox="0 0 1280 720"
    role="img"
    aria-label={`Screenshot placeholder for ${figure.caption}`}
    className="block h-auto w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <pattern id="diagonal-stripes" patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(45)">
        <rect width="24" height="24" className="fill-surface-raised" />
        <line x1="0" y1="0" x2="0" y2="24" className="stroke-border-strong opacity-30" strokeWidth="2" />
      </pattern>
    </defs>
    <rect width="1280" height="720" fill="url(#diagonal-stripes)" />
    <text x="640" y="370" textAnchor="middle" className="fill-text-secondary font-mono" fontSize="22">
      screenshot · {figure.caption} · 1280×720
    </text>
  </svg>
</figure>
```

- `role="img"` + descriptive `aria-label` per plan §D9 (signals placeholder nature to screen readers).
- All colors via Tailwind utilities (`fill-surface-raised`, `stroke-border-strong`, `fill-text-secondary`). NO inline `style="fill: #..."`. NO hex literals.
- **Files**: `apps/web/src/components/changelog/changelog-figure.tsx`
- **Depends on**: T001 (imports `ChangelogFigureContent`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; SVG `viewBox="0 0 1280 720"`; `<defs>` contains `<pattern id="diagonal-stripes" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`; pattern contains `<rect>` with `fill-surface-raised` AND `<line>` with `stroke-border-strong opacity-30`; outer `<rect>` uses `fill="url(#diagonal-stripes)"`; `<text>` element with `textAnchor="middle"` + `font-mono` + `fill-text-secondary` + content `screenshot · {figure.caption} · 1280×720`; SVG carries `role="img"` and `aria-label="Screenshot placeholder for {caption}"` template; `grep -cE "#[0-9A-Fa-f]{3,8}|fill=\"rgb"` returns 0 (tokens-only); no chart library import (`grep -lE "recharts|chart\\.js|victory|nivo|echarts"` returns 0).
- **Commit**: `feat(web): add ChangelogFigure (hand-rolled diagonal-stripes SVG placeholder) (slice 011)`

### T007 · [P] [US1] [US2] `RssSubscribeCard` (server — inline link to /changelog.atom)
Create `apps/web/src/components/changelog/rss-subscribe-card.tsx` — async Server Component. No props (content is fixed). Renders per plan §1 / contracts:

```tsx
<aside className="flex flex-col gap-tight rounded-card border border-border-default p-card">
  <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
    RSS · ATOM
  </p>
  <p className="text-body-sm text-text-secondary">
    Subscribe to{" "}
    <a href="/changelog.atom" className="text-text-primary underline hover:text-accent-bristle">
      /changelog.atom
    </a>{" "}
    from anywhere.
  </p>
</aside>
```

- `RSS · ATOM` eyebrow in mono small caps + `text-text-secondary`.
- Inline `<a href="/changelog.atom">` link (the only interactive element of the card).
- Self-contained card with `rounded-card border border-border-default p-card`.
- Tokens-only.
- **Files**: `apps/web/src/components/changelog/rss-subscribe-card.tsx`
- **Depends on**: — (no type imports needed)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; renders `<aside>`; eyebrow contains exact text `RSS · ATOM` in `font-mono uppercase`; body line contains exact phrase `Subscribe to` + inline `<a href="/changelog.atom">` + `from anywhere.`; the link element's `href` is `/changelog.atom` (NOT `/feed.xml` or `/changelog.rss` — Atom-only per FR-002); card chrome uses `rounded-card border border-border-default p-card`; `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add RssSubscribeCard (RSS·ATOM eyebrow + inline /changelog.atom link) (slice 011)`

### T008 · [US1] `ChangelogEntry` (server — 3-column row at md+ with id="entry-{slug}" + dual scroll-mt)
Create `apps/web/src/components/changelog/changelog-entry.tsx` — async Server Component. Accepts `{ entry: ChangelogEntry }`. Renders per plan §D13 / contracts:

```tsx
<article id={`entry-${entry.slug}`} className="scroll-mt-section grid gap-grid md:grid-cols-[6rem_1fr] md:gap-section">
  {/* Left column: abbreviated date in mono */}
  <p className="font-mono text-body-sm uppercase tracking-wide text-text-secondary">
    {entry.displayDay}
  </p>
  {/* Right column: title + badge inline + body + optional figure below */}
  <div className="flex flex-col gap-tight">
    <div className="flex items-baseline gap-tight flex-wrap">
      <h3 className="font-serif text-h3 text-text-primary">{entry.title}</h3>
      <ChangelogBadge type={entry.type} />
    </div>
    <p className="font-serif text-body-lg text-text-primary">{entry.body}</p>
    {entry.figure && <ChangelogFigure figure={entry.figure} />}
  </div>
</article>
```

- `<article id="entry-{slug}" className="scroll-mt-section">` — both the permalink anchor target AND the dual-scroll-mt offset per plan §D13.
- 3-column grid at md+ (`md:grid-cols-[6rem_1fr]`): left = date (6rem fixed); right = title+badge+body+figure (1fr).
- At mobile (below md), the layout collapses to single column (date row → title+badge → body → figure).
- Title in `font-serif text-h3` (per token system; `text-h3` not `text-heading-h3`).
- Body in `font-serif text-body-lg` (matches slice-010 BlogPostBody prose treatment).
- ChangelogBadge inline with title via `flex items-baseline gap-tight flex-wrap`.
- ChangelogFigure conditional render only when `entry.figure` is defined.
- Tokens-only.
- **Files**: `apps/web/src/components/changelog/changelog-entry.tsx`
- **Depends on**: T001 (imports `ChangelogEntry`), T005 (`ChangelogBadge`), T006 (`ChangelogFigure`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `ChangelogEntry` from `./types`; imports `ChangelogBadge` from `./changelog-badge`; imports `ChangelogFigure` from `./changelog-figure`; renders `<article id={`entry-${entry.slug}`}>` with `scroll-mt-section` class; uses `md:grid-cols-[6rem_1fr]` for 3-column layout at md+; `displayDay` rendered in `font-mono uppercase`; title in `font-serif text-h3`; body in `font-serif text-body-lg`; figure conditional render uses `{entry.figure && <ChangelogFigure ...>}` pattern; `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add ChangelogEntry (3-col row at md+, scroll-mt anchor, badge inline) (slice 011)`

### T009 · [US1] `ChangelogMonthSection` (server — h2 + optional Current pill + entries map)
Create `apps/web/src/components/changelog/changelog-month-section.tsx` — async Server Component. Accepts `{ month: ChangelogMonthGroup }`. Renders per plan §D13 / contracts:

```tsx
<section
  id={month.monthKey}
  data-changelog-month={month.monthKey}
  className="scroll-mt-section flex flex-col gap-section"
>
  <div className="flex items-baseline gap-snug">
    <h2 className="font-serif text-h2 text-text-primary">{month.monthLabel}</h2>
    {month.isCurrent && (
      <span className="rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium text-text-secondary">
        Current
      </span>
    )}
  </div>
  <div className="flex flex-col gap-loose">
    {month.entries.map((entry) => (
      <ChangelogEntry key={entry.slug} entry={entry} />
    ))}
  </div>
</section>
```

- `<section id={monthKey} data-changelog-month={monthKey} className="scroll-mt-section">` — `id` for native anchor links + `data-changelog-month` for `ChangelogJumpNav`'s IO selector + `scroll-mt-section` for the dual-offset discipline per plan §D13.
- h2 in `font-serif text-h2` rendering the month label.
- `Current` pill **conditionally rendered** only when `month.isCurrent === true`. Pill styling: `rounded-pill bg-surface-raised px-2 py-0.5 text-body-sm font-medium text-text-secondary` (subtle treatment — visible but not competing with the section's h2).
- Entries mapped with `gap-loose` (40px) between them.
- Tokens-only.
- **Files**: `apps/web/src/components/changelog/changelog-month-section.tsx`
- **Depends on**: T001 (imports `ChangelogMonthGroup`), T008 (`ChangelogEntry`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `ChangelogMonthGroup` from `./types`; imports `ChangelogEntry` from `./changelog-entry`; renders `<section id={month.monthKey} data-changelog-month={month.monthKey}>` (BOTH the `id` and `data-changelog-month` attributes carry the same value — `monthKey`); `scroll-mt-section` class present; h2 in `font-serif text-h2` rendering `month.monthLabel`; `Current` pill conditional via `{month.isCurrent && <span>Current</span>}` (NOT unconditional); pill styling uses `rounded-pill bg-surface-raised`; entries mapped via `.map((entry) => <ChangelogEntry ...>)`; `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add ChangelogMonthSection (h2 + optional Current pill + entries map) (slice 011)`

### T010 · [US1] [US3] `ChangelogJumpNav` (client — 4th structural mirror with querySelector divergence per D7)
Create `apps/web/src/components/changelog/changelog-jump-nav.tsx` as the slice's only `"use client"` file. Structurally mirrors slice-010 `BlogRailToc` (which mirrored slices 009 + 006) **without importing from any of them** (additive only; FR-012 / plan §D7). Start the file with `"use client";`.

Per plan §D7 / contracts:
- Props: `{ items: ReadonlyArray<ChangelogJumpItem>; ariaLabel?: string }` with `ariaLabel` defaulting to `"Jump to a month"`.
- `useState<string>(items[0]?.monthKey ?? "")` for active month — flicker fix (first month is active pre-IO).
- `useRef<Map<string, number>>(new Map())` for `visibleMonths` (IO topY tracking).
- `useRef<Map<string, HTMLAnchorElement>>(new Map())` for `mobilePillRefs`.
- Constants: `ROOT_MARGIN = "-80px 0px -55% 0px"`, `PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"`, `DESKTOP_MQ = "(min-width: 768px)"`.
- First `useEffect` (mount-only): `document.querySelectorAll<HTMLElement>("[data-changelog-month]")` → `new IntersectionObserver({rootMargin: ROOT_MARGIN, threshold: 0})`; callback reads `entry.target.getAttribute("data-changelog-month")` to derive monthKey, updates `visibleMonths` Map; after batch, if `visibleMonths.size === 0` early-return without clearing (no flicker); otherwise linear scan for smallest `topY` → `setActive(topMonthKey)`; cleanup disconnects observer.
- Second `useEffect` keyed on `[active]`: mobile pill auto-scroll. `if (window.matchMedia(DESKTOP_MQ).matches) return`; `pill = mobilePillRefs.current.get(active)`; `pill.scrollIntoView({inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth"})` reading reduced-motion fresh.
- `handleClick(e, monthKey)`:
  - Modifier-key passthrough: `if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;` (Cmd/Ctrl/middle/shift clicks → native browser behavior).
  - **KEY DIVERGENCE from slices 009/010** (per plan §D7): `const target = document.querySelector('[data-changelog-month="' + monthKey + '"]')` — uses `querySelector` on the data attribute (NOT `getElementById`). Slice 011 sections carry both `id={monthKey}` AND `data-changelog-month={monthKey}`; using the data attribute keeps click + IO logic symmetric. Both approaches work in this slice (the `id` is also set), but symmetric-to-IO is cleaner. **Document inline in the file's TSDoc header** that this divergence is the slice-011 refinement and that the eventual shared `SectionScrollSpyRail` refactor (tracked follow-up) needs to handle whichever target-resolution strategy is canonical.
  - `e.preventDefault()`, read reduced-motion fresh, `target.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"})`.
- Render: `<nav aria-label={ariaLabel}>` wrapping:
  - Desktop sticky vertical rail: `<ul className="hidden md:sticky md:top-grid md:flex md:flex-col md:gap-tight">`. Each item: `<a href={`#${monthKey}`} aria-current={isActive ? "location" : undefined} onClick={(e) => handleClick(e, monthKey)}>{displayLabel}</a>`. Active class: `border-l-2 border-accent-bristle py-1 pl-snug font-medium text-text-primary no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`; inactive: `border-l-2 border-transparent py-1 pl-snug text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`.
  - Mobile horizontal pill row: `<ul className="flex gap-tight overflow-x-auto pb-2 md:hidden">`. Each pill is `<a>` with ref registered to `mobilePillRefs`. Active: `inline-block whitespace-nowrap rounded-pill bg-text-primary text-surface-card px-snug py-1 text-body-sm font-medium no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`; inactive: `inline-block whitespace-nowrap rounded-pill border border-border-default bg-surface-card px-snug py-1 text-body-sm text-text-secondary no-underline transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle`.
- **NO** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, or `aria-orientation` anywhere — current-location nav pattern.
- **NO** import from `apps/web/src/components/faq/scroll-spy-rail.tsx`, `apps/web/src/components/legal/toc-rail.tsx`, or `apps/web/src/components/blog/blog-rail-toc.tsx`.
- Tokens-only.
- **Files**: `apps/web/src/components/changelog/changelog-jump-nav.tsx`
- **Depends on**: T001 (imports `ChangelogJumpItem`)
- **Verify**: `pnpm --filter web typecheck` exits 0; file starts with `"use client";`; imports `useState`, `useEffect`, `useRef`, `type MouseEvent` from `react`; imports `ChangelogJumpItem` from `./types`; selector literal `"[data-changelog-month]"` present (NOT `"[data-faq-item]"` / `"[data-legal-section]"` / `"[data-blog-section]"`); `rootMargin: "-80px 0px -55% 0px"` present; `threshold: 0` present; `<nav aria-label="Jump to a month">` (or `aria-label={ariaLabel}` with the default fallback); `aria-current={` present with `"location"` string; NO `role="tablist"` / `role="tab"` / `aria-selected` substrings anywhere (`grep -E "role=\"tab|aria-selected"` returns 0); click handler uses `document.querySelector('[data-changelog-month=` pattern (the D7 divergence — NOT `getElementById`); reduced-motion read inside `handleClick` AND inside the mobile-pill `useEffect`; modifier-key short-circuit `if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return` present; NO import of slices 006/009/010 rails (`grep -lE "scroll-spy-rail|legal/toc-rail|blog-rail-toc"` returns 0); `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add ChangelogJumpNav (client, 4th structural mirror, querySelector-data-attr divergence) (slice 011)`

**▸ STOP 2** — template primitives done: 7 components typecheck in isolation (6 server + 1 client). `ChangelogJumpNav` is the only client component in Batch B. STOP 2 gate also runs `grep -l "use client" apps/web/src/components/changelog/` and confirms exactly 1 match (`changelog-jump-nav.tsx`); hex/font/voice/emoji greps clean across all 7 new files; the ampersand-first ordering in `escapeXml` is reaffirmed.

---

## Batch C — ChangelogLayout + 2 routes  ▸ STOP 3

### Phase 4: User Story 1 (page assembly) + US2 (Atom feed route) + US3 (TWO link flips)

### T011 · [US1] `ChangelogLayout` (server, owns 4-step grouping + currentMonthKey + jumpItems projection)
Create `apps/web/src/components/changelog/changelog-layout.tsx` — async Server Component. Accepts `{ entries: ReadonlyArray<ChangelogEntry> }`. Owns the month-grouping + current-month detection + jump-items projection per plan §D4 / contracts:

```tsx
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

export function ChangelogLayout({ entries }: { entries: ReadonlyArray<ChangelogEntry> }) {
  // Step 1: derive uniqueMonthKeys preserving source order.
  // CHANGELOG_ENTRIES is already reverse-chronological in source; [...new Set(...)]
  // preserves insertion order per ES2015 spec.
  const uniqueMonthKeys = [...new Set(entries.map((e) => e.monthKey))];

  // Step 2: group entries by monthKey.
  const byMonth = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const list = byMonth.get(entry.monthKey);
    if (list) list.push(entry);
    else byMonth.set(entry.monthKey, [entry]);
  }

  // Step 3: compute currentMonthKey = entry with max(date) → its monthKey.
  // Direct ISO yyyy-mm-dd string compare is lexicographically correct.
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
              {months.map((m) => <ChangelogMonthSection key={m.monthKey} month={m} />)}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
```

- 4-step grouping algorithm **inline** in the layout (NOT extracted to a separate helper — single consumer per plan §D4).
- TopNav + main + SiteFooter chrome with TopNav and SiteFooter OUTSIDE `<main>` (matches slice-008/009/010 posture per plan §1).
- 2-column grid at md+ (`md:grid-cols-[14rem_1fr]`): left rail = `ChangelogJumpNav` + `RssSubscribeCard` (gap-loose between them); right column = month sections.
- Left rail container has `md:sticky md:top-grid md:self-start` — the aside itself sticks (the rail inside it ALSO has its own sticky positioning at the ul level per slice-010 BlogRailToc pattern, but the outer aside sticks too so `RssSubscribeCard` stays visible while scrolling).
- Tokens-only.
- **Files**: `apps/web/src/components/changelog/changelog-layout.tsx`
- **Depends on**: T001 (types), T004 (`ChangelogHero`), T007 (`RssSubscribeCard`), T009 (`ChangelogMonthSection`), T010 (`ChangelogJumpNav`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `TopNav` + `SiteFooter` from `@/components/landing/`; imports all 4 changelog components by name; renders top nav + main + grid + site footer in order; grid template `md:grid-cols-[14rem_1fr]` present; 4-step algorithm present (verify by reading: `[...new Set(...)]`, `new Map<string, ChangelogEntry[]>()`, `entries.reduce((max, e) => (e.date > max.date ? e : max))`, final `.map(monthKey => ({...isCurrent: monthKey === currentMonthKey}))`); jumpItems projection present (`months.map(m => ({monthKey: m.monthKey, displayLabel: m.monthLabel}))`); `grep -cE "#[0-9A-Fa-f]{3,8}"` returns 0.
- **Commit**: `feat(web): add ChangelogLayout (4-step month-grouping + currentMonthKey + 2-col chrome) (slice 011)`

### T012 · [US1] [US3] `/changelog/page.tsx` (REWRITE — slice-005 ComingSoon stub → full Changelog page)
**Wholesale rewrite** of `apps/web/src/app/changelog/page.tsx`. Current slice-005 content:
```tsx
import { ComingSoon } from "@/components/coming-soon";
export const metadata = { robots: { index: false, follow: false } };
export default function Page() { return <ComingSoon version="0.2.5" />; }
```
Replace entirely with the full Changelog page per plan §D10 / contracts:

```tsx
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
```

- Removes the slice-005 `robots: { index: false, follow: false }` (page IS launched and indexable per FR-027).
- `og:type: "website"` (section landing page; differs from slice-010 `/blog/[slug]`'s `"article"`).
- `alternates.types["application/atom+xml"]` emits the `<link rel="alternate" type="application/atom+xml">` feed-discovery element automatically per Next.js metadata API.
- No `robots` field → indexable.
- Tokens-only (no styling at the route level).
- **Files**: `apps/web/src/app/changelog/page.tsx` (REWRITE)
- **Depends on**: T002 (`CHANGELOG_ENTRIES`), T011 (`ChangelogLayout`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; default export is `async function`; metadata has `title: "Changelog — Bristle"`, `description` matches verbatim per FR-027, `openGraph.type: "website"`, `openGraph.url: SITE_URL + "/changelog"`, absolute OG image; `alternates.types["application/atom+xml"]` present pointing at `${SITE_URL}/changelog.atom` with `title: "Bristle changelog feed"`; **NO `robots` field** in the new metadata (`grep "robots" apps/web/src/app/changelog/page.tsx` returns 0); imports `CHANGELOG_ENTRIES` from `@/components/changelog/changelog-entries`; imports `ChangelogLayout` from `@/components/changelog/changelog-layout`; `grep "ComingSoon" apps/web/src/app/changelog/page.tsx` returns 0 (full rewrite — old stub gone).
- **Commit**: `feat(web): rewrite /changelog → full Changelog page (replaces slice-005 ComingSoon stub) (slice 011)`

### T013 · [US2] `/changelog.atom/route.ts` (ADD — Atom Route Handler with force-static)
Create `apps/web/src/app/changelog.atom/route.ts` — brand-new Route Handler at the literal-segment route `/changelog.atom`. Per plan §D11 / contracts:

```ts
import { SITE_URL } from "@bristle/shared";

import { CHANGELOG_ENTRIES } from "@/components/changelog/changelog-entries";
import { buildAtomFeed } from "@/components/changelog/atom-xml";

// Force build-time static prerender. The feed is purely compile-time data —
// no DB, no per-request state. If Next.js's Route Handler classifier falls
// back to ƒ Dynamic despite this directive, the Cache-Control header below
// ensures edge caching covers freshness.
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

- The directory `changelog.atom/` is treated as a literal path segment by Next.js (the `.` is a literal character, not a route delimiter).
- `export const dynamic = "force-static"` per plan §D11 — attempts to prerender at build time as a static file.
- `export const revalidate = false` per plan §D11 — explicitly opts out of ISR.
- `GET` handler returns a `Response` with the Atom-specific MIME type `application/atom+xml; charset=utf-8` and `Cache-Control: public, s-maxage=3600` (1-hour edge cache).
- The handler imports the same `CHANGELOG_ENTRIES` as the page (T012) — page and feed cannot drift.
- **Files**: `apps/web/src/app/changelog.atom/route.ts`
- **Depends on**: T002 (`CHANGELOG_ENTRIES`), T003 (`buildAtomFeed`)
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; file exports `dynamic = "force-static"` + `revalidate = false` + an async `GET` function; `GET` imports `CHANGELOG_ENTRIES` from `@/components/changelog/changelog-entries`; imports `buildAtomFeed` from `@/components/changelog/atom-xml`; imports `SITE_URL` from `@bristle/shared`; constructs `Response` with `Content-Type: "application/atom+xml; charset=utf-8"` and `Cache-Control: "public, s-maxage=3600"`; no chart/XML library imports.
- **Commit**: `feat(web): add /changelog.atom route (Atom 1.0 feed + force-static + 1h edge cache) (slice 011)`

**▸ STOP 3** — ChangelogLayout composed; both routes wired. The slice-005 top-nav `Changelog` link (line 6) and footer Product-column `Changelog` link (line 8) flip from soft-404 → live the moment T012's rewrite lands (without touching top-nav or footer files). The Atom feed is also live. STOP 3 gate runs `pnpm typecheck && pnpm lint && pnpm --filter web build` and reads First Load JS budgets for `/changelog` (target ~107-110 KB); curls `/changelog.atom` to verify it returns 200 + valid Atom XML.

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 3 (perf / a11y / SEO / voice / responsive floors + slice integrity + TWO link flips)

### T014 · [US3] VERIFY — local gate
Run the local loop + audits against the post-implementation state.
- **Depends on**: T012, T013
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-023)*
  - **First Load JS budget** (FR-035 / SC-021): `/changelog` target ~107-110 KB; ALL routes < 180 KB gz. `/changelog.atom` is XML-only (zero JS). If `/changelog` ≥ 130 KB, investigate accidental bundle leak (slice-006/009/010 rail components — must NOT be imported per FR-012; chart/XML library imports — must NOT exist per FR-029).
  - **Render mode classification** (SC-022): build output marks `/changelog` as `○ Static`. `/changelog.atom` should appear as `○ Static` when `force-static` succeeds; if Next.js classifies as `ƒ Dynamic`, document the actual classification and confirm the `Cache-Control` header still emits (acceptable per FR-034).
  - **`pnpm-lock.yaml` unchanged** (SC-028): `git diff --stat f434f44..HEAD -- pnpm-lock.yaml` returns empty (zero new deps; using the true baseline `f434f44` because the local `origin/main` tracking ref may be stale).
  - **Server/client boundary** (SC-025): `grep -l "use client" apps/web/src/components/changelog/ apps/web/src/app/changelog/page.tsx apps/web/src/app/changelog.atom/route.ts` returns **exactly one** file: `apps/web/src/components/changelog/changelog-jump-nav.tsx`. The route entries are async Server Component / Route Handler respectively with no `"use client"`.
  - **Additive-only** (SC-027 / FR-036): `git diff --stat f434f44..HEAD --` shows changes ONLY under `apps/web/src/components/changelog/` and `apps/web/src/app/changelog{,.atom}/`. Zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact,legal,blog}/`, `apps/web/src/lib/`, `apps/web/src/app/{contact,blog}/`, `packages/`, or `design/`. The only existing-file change permitted is the wholesale rewrite of `apps/web/src/app/changelog/page.tsx`.
  - **Greps on all 12 new files** + the rewritten route + the new route handler: `apps/web/src/components/changelog/{types.ts,changelog-entries.ts,atom-xml.ts,changelog-hero.tsx,changelog-badge.tsx,changelog-figure.tsx,rss-subscribe-card.tsx,changelog-entry.tsx,changelog-month-section.tsx,changelog-jump-nav.tsx,changelog-layout.tsx}` + `apps/web/src/app/changelog/page.tsx` + `apps/web/src/app/changelog.atom/route.ts` (SC-026):
    - `hex (#[0-9A-Fa-f]{3,8})` — clean (no hex literals).
    - `font-family|font-name` — clean.
    - `copy-context exclamation` (`grep -nE '"[^"]*![^"]*"|>[^<]*![^<]*<' apps/web/src/components/changelog/ apps/web/src/app/changelog{,.atom}/`) — clean **except** for JS-operator carve-out (per the STOP-3-of-slice-010 correction): `ChangelogJumpNav`'s `!metaKey` / `!== 0` / `!id` / `!target`-style operators are code, not voice. Also note the `<?xml version="1.0"?>` prolog contains a `?` not a `!`; the `<!DOCTYPE>` declaration isn't used in Atom 1.0.
    - `emoji` — clean.
    - `amazing|awesome` (case-insensitive) — clean.
  - **Atom feed XML validation** (SC-011 + SC-012 + SC-013 + SC-014):
    - `curl -i <local>/changelog.atom` returns HTTP 200 + `Content-Type: application/atom+xml; charset=utf-8`.
    - Element-presence greps:
      - `curl -s <local>/changelog.atom | grep -c '<feed xmlns="http://www.w3.org/2005/Atom">'` returns `1`
      - `curl -s <local>/changelog.atom | grep -c '<title>Bristle Changelog</title>'` returns `1` (feed-level only)
      - `curl -s <local>/changelog.atom | grep -c '<link rel="self"'` returns `1`
      - `curl -s <local>/changelog.atom | grep -c '<link rel="alternate" type="text/html"'` returns `14` (1 feed-level + 13 per-entry)
      - `curl -s <local>/changelog.atom | grep -c '<author><name>Bristle</name></author>'` returns `14` (1 feed-level + 13 per-entry)
      - `curl -s <local>/changelog.atom | grep -c '<entry>'` returns `13`
      - `curl -s <local>/changelog.atom | grep -c '<generator uri="https://bristle.dev"'` returns `1`
    - XML parse validation: `curl -s <local>/changelog.atom | xmllint --noout - && echo "Atom XML valid"` — install via `apt-get install libxml2-utils` if not present.
    - XML-escape correctness on the April 22 entry's title (which contains literal `"yesterday"` quotes): the rendered feed body should contain `&quot;yesterday&quot;` (not raw `"yesterday"` — would break XML). Verify via `curl -s <local>/changelog.atom | grep -c '&quot;yesterday&quot;'` returning `1`.
  - **Cache-Control header** (SC-015): `curl -I <local>/changelog.atom | grep -i cache-control` returns a `Cache-Control:` header containing `public` AND `s-maxage=3600`.
  - **Feed-discovery link in `/changelog` head** (SC-016): `curl -s <local>/changelog | grep -oE '<link[^>]*rel="alternate"[^>]*type="application/atom\+xml"[^>]*>'` returns one match containing `href="https://bristle.vercel.app/changelog.atom"` (absolute URL) and `title="Bristle changelog feed"`.
  - **"Current" pill exactly-once** (SC-009): `curl -s <local>/changelog | grep -c ">Current<"` returns **`1`**. Only the May 2026 section carries the pill (May 8 has `max(entry.date)`).
  - **Deep-link anchor walk** (SC-010): visiting `<local>/changelog#entry-export-to-csv` in a browser scrolls to the matching `<article id="entry-export-to-csv">`; the `ChangelogJumpNav` rail's active state moves to `March 2026` (entry's monthKey) within ~100ms of load.
  - **TWO link-flip regression checks** (SC-017 — this is the slice's US3-defining payoff):
    - **Top-nav `Changelog` link**: from `<local>/`, click the top-nav `Changelog` link → lands on `/changelog` (HTTP 200; was the slice-005 `ComingSoon` soft-404 pre-slice-011). `git diff --stat f434f44..HEAD -- apps/web/src/components/landing/top-nav.tsx` returns empty (top-nav unchanged).
    - **Footer Product-column `Changelog` link**: from `<local>/`, scroll to the footer Product column, click `Changelog` → lands on `/changelog` (HTTP 200; same flip). `git diff --stat f434f44..HEAD -- apps/web/src/components/landing/site-footer.tsx` returns empty (site-footer unchanged).
    - Both flips happen on the same T012 rewrite landing — no separate edits to either nav file.
  - **Responsive sweep** (SC-018) at 320 / 375 / 768 / 1024 / 1280 / 1440 on `/changelog` — no h-scroll, no overlap, no clipped text; two-column body collapses to single-column below `md`; `ChangelogJumpNav` collapses from sticky vertical rail to horizontal pill row at and below `md`; 3-col entry row (date 6rem / title+badge+body / figure below) stacks at mobile.
  - **Visual diff** (SC-003) vs `design/Public_pages.pdf` page 8 at 1280 width within a 4px tolerance per section (hero, left rail with jump-nav + RSS card, 5 month sections, 13 entries with type badges, May 8 figure placeholder).
  - **Keyboard reach** (FR-031 / AC US3-6): Tab through `/changelog` — every `ChangelogJumpNav` anchor reachable, focus rings visible (`focus-visible:outline-2 outline-offset-2 outline-accent-bristle`); section headings render as semantic `<h2>` per FR-031; the `RssSubscribeCard` link is reachable.
  - **Reduced-motion walk** (AC US3-7): with OS `prefers-reduced-motion: reduce` ON, click a `ChangelogJumpNav` anchor → scroll behavior is instant (`auto`), no animation; mobile pill auto-scroll-into-view also instant. Toggle OS preference OFF mid-session → next click smooth-scrolls (fresh read per invocation).
  - **Modifier-key passthrough**: Cmd-click (Mac) / Ctrl-click (Linux/Windows) a `ChangelogJumpNav` anchor → opens in new tab as native anchor behavior. Middle-click same → new tab.
  - **Lighthouse on local prod build** (SC-020) for `/changelog`: Performance / Accessibility / Best Practices / SEO each ≥ 90; SEO 100 on local-prod (preview SEO 60 is the documented `x-robots-tag` artifact, not a regression).
  - **Per-page metadata** (SC-019): `curl -s <local>/changelog | grep -oE '<title>[^<]+</title>|og:(title|description|url|image|type)'` shows title `Changelog — Bristle`, all 5 OG tags, `og:type="website"`, absolute `og:url`, absolute OG image. **No `<meta name="robots">` in body** (`grep -c '<meta[^>]*name="robots"'` returns 0).
  - **Content data integrity** (SC-029 + SC-030): `CHANGELOG_ENTRIES.length === 13` (verifiable via `grep -c "slug:" apps/web/src/components/changelog/changelog-entries.ts` returning 13); monthKey distribution per T002 Verify; verbatim opener greps clean (May 1 body starts `Initial JS bundle dropped from 264KB`; April 7 body starts `Sixth source live`; January 28 body starts `Bristle is now publicly available.`); exactly one `figure:` field on the May 8 entry (`grep -c "figure:" apps/web/src/components/changelog/changelog-entries.ts` returns `1`).
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T015 · [US3] VERIFY — preview parity (gate)
Push the branch via the gh-token HTTPS workaround (SSH agent still stale; same pattern as slice 010); confirm the Vercel preview.
- **Depends on**: T014
- **Verify (SC-024)**:
  - **Push**: `GH_TOKEN=$(gh auth token) git push "https://oauth2:${GH_TOKEN}@github.com/cornel-stack/bristle.git" 011-changelog:011-changelog`.
  - **Preview URL pattern**: `https://bristle-git-011-changelog-cornel-okoths-projects.vercel.app` (exact URL surfaced via `gh api repos/cornel-stack/bristle/commits/<sha>/check-runs` or `gh api repos/cornel-stack/bristle/deployments?sha=<sha>` after the Vercel build completes).
  - **Routes resolve on preview** — **18 user-visible URLs** (16 prior surfaces + `/changelog` + `/changelog.atom`):
    - 9 prior: `/`, `/about`, `/contact`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/security`, `/gdpr`
    - 8 prior slice-010: `/blog` + 7 `/blog/[slug]` entries
    - 2 new this slice: `/changelog` + `/changelog.atom`
    - `curl -sI <preview>/{path}` for each → all HTTP 200.
  - **Atom feed on preview**: re-run SC-011 / SC-012 / SC-013 / SC-014 element-presence greps against `<preview>/changelog.atom`; confirm `xmllint --noout` parses the preview feed cleanly. Confirm `Content-Type: application/atom+xml` header on the preview response.
  - **No body `<meta robots>`** on `/changelog`: `curl -s <preview>/changelog | grep -c '<meta[^>]*name="robots"'` returns 0 (the `x-robots-tag: noindex` HTTP header is the Vercel preview default — same artifact as prior slices, not a body meta; the page is indexable in production).
  - **TWO link-flip regression checks on preview** (SC-017 + SC-024):
    - **Top-nav `Changelog` link on preview**: from `<preview>/`, click the top-nav `Changelog` link → lands on `<preview>/changelog` (HTTP 200; was 404 pre-slice-011).
    - **Footer Product-column `Changelog` link on preview**: from `<preview>/`, scroll to footer, click `Changelog` → lands on `<preview>/changelog` (same flip).
    - Both flips work without any edit to `top-nav.tsx` or `site-footer.tsx` — both flip on the same T012 page rewrite.
  - **Slice-006 / 008 / 009 / 010 regression checks on preview**:
    - `/pricing` Enterprise card "Contact sales →" still lands on `/contact` (slice 008).
    - `/faq` rail / accordion / bottom CTA still work (slice 006); footer "Help center" still goes to `/faq`.
    - `/about` and `/contact` still render (slice 008).
    - `/terms` / `/privacy` / `/security` / `/gdpr` still render with intact `TocRail` behavior (slice 009).
    - `/blog` index + 7 article slugs still render with intact `BlogRailToc` + `BlogFilterChips` behavior (slice 010).
  - **No client-side console errors** on any of the 18 routes in the browser console.
  - **`ChangelogJumpNav` behavior on preview**: scroll the page → active section in rail follows topmost-visible content; click a jump-nav anchor → smooth-scroll (or instant if OS reduced-motion ON); modifier-key clicks pass through to native browser behavior (open in new tab); at 375 width, horizontal pill row visible above the body with active-pill auto-scroll.
  - **"Current" pill on preview**: `curl -s <preview>/changelog | grep -c ">Current<"` returns `1` (May 2026 section only).
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — Changelog page + Atom feed live locally and on the preview; slice-005 top-nav AND footer Product-column `Changelog` links both flip from soft-404 to live without any nav-file edits; slice complete.

---

## Dependencies & Execution Order

```
Batch A:
  T001 (types.ts)
    ├── T002 [P] (changelog-entries.ts)  — depends on T001
    └── T003 [P] (atom-xml.ts)           — depends on T001

Batch B (all depend on T001):
  T004 [P] (ChangelogHero)           — depends on (none beyond convention; logically T001)
  T005 [P] (ChangelogBadge)          — depends on T001
  T006 [P] (ChangelogFigure)         — depends on T001
  T007 [P] (RssSubscribeCard)        — depends on (none beyond convention)
  T008    (ChangelogEntry)           — depends on T001 + T005 + T006
  T009    (ChangelogMonthSection)    — depends on T001 + T008
  T010    (ChangelogJumpNav, client) — depends on T001 only (independent of T005/006/008/009)

Batch C (sequential):
  T011 (ChangelogLayout)             — depends on T001 + T004 + T007 + T009 + T010
  T012 (/changelog/page.tsx REWRITE) — depends on T002 + T011
  T013 (/changelog.atom/route.ts)    — depends on T002 + T003

Batch D:
  T014 (local gate)     — depends on T012 + T013
  T015 (preview parity) — depends on T014
```

### Critical dependency edges

- **T001 → EVERYTHING**: type-only gate. T002 + T003 + T005 + T006 + T008 + T009 + T010 + T011 all import types from it. (T004 and T007 don't strictly need types but follow the convention.)
- **T002 → T012 + T013** (BOTH routes): the `/changelog/page.tsx` imports `CHANGELOG_ENTRIES` (via `ChangelogLayout`); the `/changelog.atom/route.ts` imports `CHANGELOG_ENTRIES` directly. **The page and the feed cannot drift** because both read the same source.
- **T003 → T013 only**: the `atom-xml.ts` helper is consumed only by the Route Handler. The page doesn't import it.
- **T005 + T006 → T008**: `ChangelogEntry` composes `ChangelogBadge` + `ChangelogFigure`.
- **T008 → T009**: `ChangelogMonthSection` composes `ChangelogEntry`.
- **T004 + T007 + T009 + T010 → T011**: `ChangelogLayout` composes Hero + RSS card + MonthSection + JumpNav.
- **T011 → T012 only**: the `/changelog` page imports `ChangelogLayout`. The Atom feed route does NOT use `ChangelogLayout` (it bypasses the layout entirely and builds XML from `CHANGELOG_ENTRIES` + `buildAtomFeed`).
- **T012 + T013 → T014**: local gate runs only after both routes are wired.
- **T014 → T015**: preview parity runs after local checks pass + the branch is pushed.

### Parallel opportunities

- **Batch A**: T002 and T003 are [P]-parallel after T001 lands. Both import `ChangelogEntry` from `./types` but don't reference each other.
- **Batch B** (wide): T004, T005, T006, T007, T010 are all [P]-parallel — five independent files. T008 depends on T005 + T006 (NOT [P]). T009 depends on T008 (NOT [P]). Maximum parallel width in Batch B = **5** ([P] tasks).
- **Batch C**: fully sequential (each task depends on prior siblings). **No parallel opportunities** within Batch C.

### Sequencing concerns

1. **T001 (`types.ts`) is the hardest gate of the slice** — must compile before any of T002-T013 (every Batch A/B/C task imports a type from it). Recommended order: T001 first, then T002 + T003 ([P]), then STOP 1, then the Batch B [P] cohort (T004/T005/T006/T007/T010 in parallel where staffed) → T008 → T009, then STOP 2, then sequentially through Batch C (T011 → T012 → T013), then the two gates.
2. **T008 + T009 are the only sequential pair within Batch B** — T009 (MonthSection) imports T008 (Entry) which imports T005 (Badge) + T006 (Figure). The Badge + Figure tasks should land before T008 starts; in practice the Batch B [P] cohort completes T005 + T006 early (small server components) and T008 + T009 land as the last two Batch B tasks.
3. **T011 (`ChangelogLayout`) is the central gate of Batch C** — gates T012. T011 itself depends on 4 Batch B tasks (T004 + T007 + T009 + T010), so all of Batch B must be in place before T011 can be written.
4. **T013 (`/changelog.atom`) is INDEPENDENT of T011 and T012** — the Atom Route Handler doesn't use the layout or the page; it imports the data store (T002) + the XML helper (T003) directly. T013 could theoretically land BEFORE T011 + T012, but Batch C convention is sequential T011 → T012 → T013 to keep the page+feed pair in the same review cycle.
5. **The `/changelog/page.tsx` rewrite (T012)** has the same delicate moment slice 010 had: between T012's commit landing and `pnpm --filter web build` completing, the route is in transition — old `ComingSoon` import deleted, new imports staged. If the build is interrupted mid-Batch-C, `/changelog` may not compile. Recommendation: complete T011 → T012 → T013 in tight succession before pushing or running the local gate.
6. **TWO link-flip regression checks** at T014 + T015 (SC-017): both top-nav AND footer `Changelog` links must verify. This is the slice's US3-defining payoff (parallel to slice-009's footer Legal column flip and slice-010's top-nav Blog flip — slice 011 flips BOTH at once for the first time).
7. **Visual diff + Lighthouse + responsive sweep + keyboard reach + reduced-motion walk + Atom feed `xmllint` defer to reviewer** at T014/T015 — same CLI-agent constraint as prior slices. Code-side proxies (build, greps, diff-stat, route-200 curls, meta-tag curls, dep audit, deep-link HTML inspection, `Current` pill exactly-once grep, Atom element-presence greps, `"use client"` count) are agent coverage; viewport sweep + Lighthouse + PDF visual diff + browser-driven `ChangelogJumpNav` behavior + reduced-motion runtime check + `xmllint` parse-check + modifier-key passthrough are reviewer coverage.
8. **Slice-005 nav + footer regression check** (SC-017) is the US3-defining verification — `apps/web/src/components/landing/top-nav.tsx` AND `apps/web/src/components/landing/site-footer.tsx` must BOTH remain in the `git diff --stat` empty zone. Both link `href`s were authored in slice 005 to point at `/changelog`; both flip live the moment T012 lands.
9. **No rebase noise expected at T015 push** — branch is on top of clean `main` from the start of this slice (no stacking).
10. **`f434f44` is the true baseline** for diff commands — the local `origin/main` tracking ref may be stale depending on whether SSH fetch has succeeded. Use the explicit baseline SHA in all `git diff --stat <baseline>..HEAD` commands at T014.

### Surprising parallelism opportunity

**Batch B has 5 [P] tasks (T004/T005/T006/T007/T010)** — moderate width. Smaller than slice 010's Batch B (8 [P] tasks) because slice 011 has 7 primitives vs slice 010's 9, and 2 of slice 011's primitives (T008 + T009) are sequential. T010 (`ChangelogJumpNav`, client) is interesting — it's the largest single file in Batch B (~150 lines including the IO logic), but it has NO dependencies on T005/T006/T008/T009 (independent of the entry/month-section chain). With staffing, T010 can land first in Batch B while the other [P] cohort proceeds; without staffing, single-implementer order matters less.

---

## Implementation strategy (4 stops)

1. **Stop 1 (Batch A)**: foundations — `types.ts` + `changelog-entries.ts` (13 entries verbatim + `[PLACEHOLDER]` header) + `atom-xml.ts` (escapeXml ampersand-first + buildAtomFeed template). STOP-1 gate verifies type exports, entry count, monthKey distribution, verbatim openers, voice grep clean, escapeXml ordering.
2. **Stop 2 (Batch B)**: 7 template primitives (6 server + 1 client). Client surface is exactly 1 file (`changelog-jump-nav.tsx`). The `ChangelogJumpNav`'s `querySelector` divergence per D7 is documented in the file's TSDoc header. STOP-2 gate verifies typecheck/lint + `"use client"` count = 1 (in this batch) + hex/font/voice/emoji greps clean across all 7 files.
3. **Stop 3 (Batch C)**: layout + 2 routes. The `/changelog/page.tsx` wholesale rewrite (FR-001) happens here; the Atom feed Route Handler (T013) is independent of the layout. STOP-3 gate verifies build + first read of First Load JS budget + initial Atom feed curl.
4. **Stop 4 (Batch D)**: full local quality gate (typecheck/lint/build + bundle budget + Lighthouse + responsive + greps + scroll-spy walk + Atom XML validation including `xmllint` + `Current` pill exactly-once + TWO link-flip regression checks + slice-006/008/009/010 regressions clean), then preview parity (push + Vercel preview + all 18 routes return 200 + Atom feed renders on preview + TWO link-flip regression checks on preview + cross-slice regressions clean).

## Task count

**15 tasks** — **13 commit-producing** (T001-T013), **2 verification gates** (T014 + T015). Grouped into **4 batches / 4 stops**. Slightly smaller than slice 010 (18 tasks) because: 1 client component vs 3; smaller Batch B (7 primitives vs 9); smaller Batch C (3 sequential tasks vs 5).

## Out of scope (no tasks)

- Real RSS 2.0 feed at `/changelog.rss` or `/feed.xml` — **deferred follow-up**; Atom-only this slice per FR-002 / clarification (a). The rail's `RSS · ATOM` eyebrow is recognition typography.
- Real screenshot assets for `ChangelogFigure` — **future content slice**; only the May 8 entry has a placeholder figure this slice. The `ChangelogFigureContent` type's forward-compatible `src?: string` field supports the swap without changing consumers.
- Per-entry permalink pages (`/changelog/entries/{slug}`) — anchors-only this slice; deep pages are a future-slice ask.
- Tag/category filtering — entries have a single `type` field (3 values) but no multi-tag filter UI like slice-010 Blog.
- "Past releases" archive separation — single-page approach until entries grow beyond ~50; pagination is a future-slice ask.
- Search across changelog entries — out of scope.
- **Extract shared `SectionScrollSpyRail`** from `FaqScrollSpyRail` (006) + `TocRail` (009) + `BlogRailToc` (010) + `ChangelogJumpNav` (011) — **highest-priority deferred refactor**; explicitly out of scope this slice. The eventual refactor's brief should note the `ChangelogJumpNav` `querySelector`-on-data-attribute divergence (vs `getElementById` in slices 009/010) and pick a canonical target-resolution strategy.
- Real authored content for all 13 changelog entries — **founder edit pass before launch**.
- Atom feed validation tooling (e.g. `pnpm changelog:validate` script running `xmllint` or `feedvalidator.org`) — recommended future tooling slice; `xmllint --noout` is the gate-time check this slice.
- Per-article OG image generation (e.g. via `@vercel/og`) for changelog entries — currently the page-level OG uses slice-005's raster.
- Newsletter wiring (still **slice 2.7**); Better Stack status integration (still **slice 2.7**); next-themes integration / Editorial Dark (still deferred to **slice 2.6**).
- All 14 carry-forwards from slice 010 (empty-state UX on BlogArticleGrid, categoryLabel dedupe, `--duration-hover` token, RSS feed for `/blog`, author profile pages, `/blog/categories/[category]` SEO deep pages, slice-005 `<main>` landmark fix, NewsletterStub markup convergence, `/privacy/sub-processors` deep page, refund-policy alignment audit, form spam protection, Resend Vitest harness, per-article OG image generation for blog posts, custom Bristle-voiced 404).
- Any modifications to slice-005 chrome (top-nav, site-footer), slice-006 pricing/FAQ, slice-008 about/contact, slice-009 legal, slice-010 blog, or any `lib/` module.
- Any modifications to `design/Public_pages.pdf` or any other read-only `design/` / `docs/` PDF.
- Any DB schema change, any new `@bristle/db` query helper.
