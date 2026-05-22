# Feature Specification: Landing Page

**Feature Branch**: `005-landing-page`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Slice 2.1 (Tier 2): the public landing page. Replace the slice-004 single-card homepage with the full marketing landing from `design/Public_pages.pdf` page 1 — nav, hero with a live problem-card preview, source strip, how-it-works trio, sample-reports row, dark pricing teaser, footer — backed by real seeded data, plus four soft-404 stub routes, an SEO/OG tag set, and a new compact problem card. Editorial Light only."

## Overview

This slice turns the homepage from a single persisted-problem demo into the product's front door: the full public landing page that a skeptical builder lands on, matching the design contract section-for-section. It introduces a second, leaner problem-card layout (`ProblemCardCompact`) for dense rows, three live data reads (the hero's pinned card, the recent-problems sample row), two new query helpers, an expanded three-row seed, four placeholder routes for the nav links that don't have real pages yet, and the page-level SEO/Open Graph metadata. It ships **Editorial Light only**; theme switching is a later slice. The value is a credible, evidence-forward marketing surface that loads fast, reads in Bristle's voice, and proves the design system and data layer compose into a real public page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor reads the landing and understands the product (Priority: P1)

A first-time visitor opens the site root and sees the complete landing page — top nav, a hero that states what Bristle does with a live example problem card, the evidence sources, how it works, today's high-signal sample problems, pricing at a glance, and a footer — all matching the design and reading in Bristle's plain-spoken voice.

**Why this priority**: This is the slice. The landing is the product's primary public surface; a visitor must be able to grasp the value proposition and see real evidence in one scroll. Everything else (compact card, queries, seed, stubs) exists to make this page real.

**Independent Test**: Open `/` on a production build; confirm all seven sections render in order, match the design within a 4px tolerance per section, and contain the specified copy; confirm the hero shows the pinned Stripe card and the sample row shows three compact cards.

**Acceptance Scenarios**:

1. **Given** the site root, **When** it loads, **Then** the page renders, top to bottom: top nav, hero (with announcement pill, serif display headline, source paragraph, two CTAs, trial microcopy, and a live problem-card preview), source strip, how-it-works trio (Ingest / Cluster / Synthesize), sample-reports row, dark pricing teaser, and footer.
2. **Given** the hero, **When** it renders, **Then** its problem-card preview is the canonical full card bound to the pinned "Stripe webhooks" problem (a fixed slug, not "whichever row is first").
3. **Given** the sample-reports section, **When** it renders, **Then** it shows exactly three compact problem cards populated from one recent-problems read.
4. **Given** any landing copy or microcopy, **When** reviewed, **Then** it contains no exclamation marks, no emoji, and none of the hype register the voice rules forbid.
5. **Given** the rendered page vs the design page, **When** compared at the design viewport, **Then** each section matches within a 4px tolerance.

---

### User Story 2 - The page is fast, accessible, discoverable, and responsive (Priority: P1)

The landing meets the project's performance, accessibility, SEO, and responsiveness floors: it loads quickly on mobile, is keyboard- and screen-reader-usable, is correctly described to search engines and social cards, and reflows cleanly across phone-to-desktop widths.

**Why this priority**: A public marketing page that fails these floors undercuts the product's credibility with exactly the skeptical, technical audience it targets. These are non-negotiable for a launch-quality front door and are independently measurable.

**Independent Test**: Run the audit tool against `/` on a production build and confirm all four category scores meet the floor; measure the initial script payload and mobile load metric; resize across the six target widths and confirm clean reflow; inspect the emitted metadata and Open Graph tags.

**Acceptance Scenarios**:

1. **Given** a production build of `/`, **When** audited, **Then** Performance, Accessibility, Best Practices, and SEO each score at least 90.
2. **Given** the same page, **When** the initial script payload is measured, **Then** it is under 180 KB compressed, and the mobile largest-contentful-paint is under 2.5 seconds on the standard mobile profile.
3. **Given** widths of 320, 375, 768, 1024, 1280, and 1440, **When** the page is viewed at each, **Then** there is no horizontal scroll, no overlapping content, and no clipped text.
4. **Given** the page head, **When** inspected, **Then** it emits a title, a meta description, and a complete Open Graph set (title, description, image, url, type), and the Open Graph image resolves to a reachable raster file.

---

### User Story 3 - Nav links resolve without dead ends (Priority: P2)

A visitor clicking the nav's Pricing / About / Blog / Changelog links reaches a real page (not a hard 404) that says the section is coming, so the site feels complete and search engines don't index the placeholders.

**Why this priority**: The nav advertises sections that don't have real pages yet this slice. Hard 404s on a freshly launched marketing site read as broken. Lightweight, non-indexed stubs keep the site coherent until the real pages ship in later slices.

**Independent Test**: Request each of the four routes; confirm each returns success (not 404), renders the design-system "coming soon" stub, and is marked non-indexable.

**Acceptance Scenarios**:

1. **Given** `/pricing`, `/about`, `/blog`, `/changelog`, **When** each is requested, **Then** each returns a success response and renders a centered "Coming in v0.2.X" stub styled with design-system tokens.
2. **Given** each stub page, **When** its metadata is inspected, **Then** it instructs search engines not to index it.

---

### Edge Cases

- **Empty database** (no seeded rows): the recent-problems read returns an empty list and does not throw; the hero's pinned read, by contract, throws if its specific row is missing (a seed/deploy defect, surfaced — consistent with the existing single-problem read).
- **Hero/sample duplication (resolved)**: the seed has four rows and the sample read excludes the hero's slug, so the hero's Stripe problem never appears in the sample row; the three sample cards are always distinct from the hero.
- **Fewer than three rows** available to the sample row (after exclusion): the row renders only what exists rather than padding with placeholders (the seed guarantees three non-hero rows this slice).
- **Long titles / quotes** in the compact card: text wraps or truncates without breaking the row layout or overflowing neighbors.
- **Newsletter stub interaction**: the email field and Subscribe button are disabled; there is no submit behavior to trigger (no silent no-op).
- **Reduced motion**: any landing motion respects the reduced-motion preference per the motion rules.
- **Narrow widths**: the hero's two-column (copy + card) and the three-up rows (how-it-works, sample, pricing) stack rather than overflow.

## Requirements *(mandatory)*

### Functional Requirements

**The landing page (US1)**

- **FR-001**: The site root MUST be replaced wholesale with the landing page; the prior single-card layout MUST NOT remain.
- **FR-002**: The page MUST render seven sections in order — top nav, hero, source strip, how-it-works trio, sample-reports row, pricing teaser, footer — matching `design/Public_pages.pdf` page 1 within a 4px tolerance per section.
- **FR-003**: The **top nav** MUST contain the Bristle wordmark + diamond mark, the links Pricing / Blog / Changelog / About, a Sign in link, and a primary "Start free →" button. Sign in → `/login` and Start free → `/signup` resolve to soft-404 stub routes this slice (see FR-016).
- **FR-004**: The **hero** MUST contain: the announcement pill "Now ingesting 6 sources · 142k problems indexed"; the serif display headline "Find real problems worth solving."; a body paragraph naming the evidence sources; a primary "Start free →" CTA (→ `/signup` stub) and a secondary "See sample problems" CTA; the microcopy "No credit card · Cancel anytime · 7-day Pro trial"; and a live problem-card preview on the right. The "See sample problems" CTA MUST be an in-page anchor to the sample-reports section (that section carries a stable `id` used as the anchor target).
- **FR-005**: The hero's problem-card preview MUST reuse the existing canonical full problem card unchanged (no fork, no variant), bound to a problem fetched by a **fixed slug** (`stripe-webhooks-vercel-cold-starts`), never by "first row".
- **FR-006**: The **source strip** MUST be a warm full-width band with the caption "EVIDENCE FROM WHERE BUILDERS ACTUALLY COMPLAIN" on the left and six source wordmarks on the right (GitHub, Hacker News, Stack Overflow, Product Hunt, App Store, Google Play), reusing the existing inline source-icon marks at a larger size — no new icon files, dependencies, or hosted logo images.
- **FR-007**: The **how-it-works** section MUST show the "HOW IT WORKS" eyebrow, the serif heading "A research journal that doesn't sleep.", and three numbered cards (01 Ingest, 02 Cluster, 03 Synthesize) with the icon and body copy shown in the design.
- **FR-008**: The **sample-reports** section MUST carry a stable `id` (the "See sample problems" anchor target) and show the "SAMPLE REPORTS · PUBLIC" eyebrow, the heading "Today's high-signal problems", a "Browse the library →" link (→ `/library`, a known out-of-scope 404 until a later slice — not a 2.1 defect), and exactly three compact problem cards in a row.
- **FR-009**: The three sample cards MUST be populated from a **single** recent-problems read at request time — `getRecentProblems({ limit: 3, excludeSlug: 'stripe-webhooks-vercel-cold-starts' })` — so the hero's pinned problem is never duplicated in the row (not static fixtures, not one query per card).
- **FR-010**: The **pricing teaser** MUST be a dark band with the heading "One price for serious research. One for casual.", summary rows for Starter $29 / Pro $79 / Team $199, and a "See full pricing →" link.
- **FR-011**: The **footer** MUST contain the brand block + tagline, the newsletter form stub, Product / Company / Resources / Legal link columns, and a bottom row with copyright and the version/status string.
- **FR-012**: All landing copy and microcopy MUST follow the voice rules — no exclamation marks, no emoji, no "amazing"/"awesome" register.

**Compact card + data layer (US1)**

- **FR-013**: A new compact problem card MUST exist as a separate component (a sibling to the canonical card, NOT a size prop or variant of it). It MUST be non-interactive and server-rendered, omit the full top-quote block, use padding smaller than the canonical card's 24px, and have no sparkline (the momentum delta number may still render). It MUST contain zero hardcoded color values.
- **FR-014**: The data layer MUST add a fetch-by-slug helper (throws if the row is absent, matching the existing single-problem helper's semantics) and a recent-problems helper (ordered by most-recently-seen, accepting a **limit** and an optional **excludeSlug** to omit a given problem; returns an empty list on an empty database, does not throw). The existing first-problem helper MUST be preserved.
- **FR-015**: The seed MUST be expanded from one row to **four** — the existing payments (Stripe) row preserved verbatim (the hero's pinned problem), plus one **devtools**, one **ai-ml**, and one **mobile** problem matching the three sample cards in the design page (an LLM-streaming ai-ml problem, an Expo/OTA mobile problem, and a pgvector devtools problem). Each new row MUST be plausible, source-attributed, and evidence-style in the project voice, with a real-sounding title, top quote, source list, momentum, a 14-point sparkline, and a last-seen timestamp within the last 30 days. Seeding MUST be idempotent (upsert by slug; a second run leaves exactly four rows).

**Placeholder routes (US3)**

- **FR-016**: Six routes — `/pricing`, `/about`, `/blog`, `/changelog`, `/login`, `/signup` — MUST each return success and render a centered "coming soon" stub styled with design-system tokens (no raw color values, no off-system typography), each instructing search engines not to index it. The per-route copy is: `/pricing` → "Coming in v0.2.2", `/about` → "Coming in v0.2.3", `/blog` → "Coming in v0.2.4", `/changelog` → "Coming in v0.2.5", `/login` → "Coming in v0.3.X (Tier 3)", `/signup` → "Coming in v0.3.X (Tier 3)". (Slices 2.2–2.5 overwrite the first four; Tier 3 overwrites login/signup.)

**Newsletter + status (US1)**

- **FR-017**: The footer newsletter form MUST be a visual stub: an email input and a Subscribe button, both **disabled**, with a small label reading "Email subscriptions launching soon" programmatically associated with the input. There MUST be no submit handler (no silent no-op).
- **FR-018**: The footer MUST contain the literal status string "v0.2.0 · status: operational".

**SEO / metadata + theming (US2)**

- **FR-019**: The page MUST emit a title, a meta description, and a complete Open Graph set (title, description, image, url, type). The Open Graph image MUST be a hand-authored static raster — `og-image.png`, 1200×630, the Bristle wordmark + the headline "Find real problems worth solving." on the `surface/canvas` background, composed within the brand tokens (no dynamic OG generation) — served from the web app's public assets and referenced by its **absolute** URL on the canonical origin. `og:url` MUST be the canonical site root.
- **FR-024**: A single canonical site origin constant — `https://bristle.vercel.app` — MUST be the source of `og:url` (`https://bristle.vercel.app/`) and the absolute `og:image` URL (`https://bristle.vercel.app/og-image.png`), so social shares from preview deployments still resolve to the stable production asset.
- **FR-020**: The page MUST render correctly in Editorial Light with no document-root theme marker set; theme switching is out of scope this slice.

**System constraints (cross-cutting)**

- **FR-021**: Every color, type, spacing, radius, and motion value in the landing MUST resolve through the design tokens; the landing source MUST contain zero hardcoded color values and zero hardcoded font-family strings.
- **FR-022**: The canonical full card and the design tokens MUST NOT be modified; all changes are additive.
- **FR-023**: Type-check, lint, and a production build of the web app MUST all succeed with no errors.

### Key Entities *(include if feature involves data)*

- **Problem** (existing `problems` table): consumed by the hero (one row, by slug) and the sample row (the most-recent N, excluding the hero's slug). No schema change this slice. The seed grows from one to **four** rows across the payments (Stripe, hero), devtools, ai-ml, and mobile categories.
- **Compact card inputs**: a subset of the canonical card's contract — title, category (key → label), momentum, top-quote text (rendered inline/condensed, not as the full quote block), quote/source markers, last-seen timestamp. No sparkline series consumed for display.
- **Recent-problems read**: returns problems ordered by last-seen descending, capped at a requested `limit`, with an optional `excludeSlug` to omit one problem (used to keep the hero's pinned problem out of the sample row); empty list when the table is empty.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a local production build, `/` renders the full landing and a 4px-tolerance visual comparison against `design/Public_pages.pdf` page 1 passes for every section at the design viewport. *(AC-1)*
- **SC-002**: The page reflows cleanly at 320, 375, 768, 1024, 1280, and 1440 widths — no horizontal scroll, no overlap, no clipped text. *(AC-2)*
- **SC-003**: The site-root file no longer contains the slice-004 single-card layout (replaced wholesale). *(AC-3)*
- **SC-004**: The hero card is fetched by the fixed slug `stripe-webhooks-vercel-cold-starts`, not the first-row helper. *(AC-4)*
- **SC-005**: The sample row renders exactly three compact cards from a single `getRecentProblems({ limit: 3, excludeSlug: 'stripe-webhooks-vercel-cold-starts' })` read; the hero's pinned problem never appears in the row. *(AC-5)*
- **SC-006**: The compact card is a new sibling component (not a prop/variant), with zero hardcoded colors, no full-quote block, padding under 24px, and no sparkline. *(AC-6)*
- **SC-007**: The data layer exposes the fetch-by-slug helper and the recent-problems helper (with `limit` + optional `excludeSlug`) in addition to the preserved first-problem helper. *(AC-7)*
- **SC-008**: Seeding produces exactly four problems; a second run completes without error and still leaves exactly four. *(AC-8)*
- **SC-009**: The seeded categories include payments (Stripe preserved verbatim), devtools, ai-ml, and mobile. *(AC-9)*
- **SC-010**: `/pricing`, `/about`, `/blog`, `/changelog`, `/login`, `/signup` each return success, render the design-system stub with the correct per-route version copy, and are marked non-indexable. *(AC-10)*
- **SC-011**: The footer newsletter input and Subscribe button both carry the disabled attribute; the string "Email subscriptions launching soon" is programmatically associated with the input. *(AC-11)*
- **SC-012**: The footer contains the literal "v0.2.0 · status: operational". *(AC-12)*
- **SC-013**: The page emits a title, meta description, and a complete Open Graph set; `og:url` is `https://bristle.vercel.app/` and `og:image` is the absolute `https://bristle.vercel.app/og-image.png`, which resolves to a reachable 1200×630 raster. *(AC-13)*
- **SC-014**: Type-check, lint, and the web production build each complete with success and no errors. *(AC-14)*
- **SC-015**: A production-build audit of `/` scores at least 90 for Performance, Accessibility, Best Practices, and SEO. *(AC-15)*
- **SC-016**: The initial script payload for `/` is under 180 KB compressed. *(AC-16)*
- **SC-017**: The mobile largest-contentful-paint for `/` is under 2.5 seconds on the standard mobile profile. *(AC-17)*
- **SC-018**: The deployed preview renders the landing identically to local within the 4px tolerance and produces no browser-console errors. *(AC-18)*
- **SC-019**: The landing source contains zero hardcoded color values and zero hardcoded font-family strings. *(AC-19)*
- **SC-020**: No exclamation marks, no emoji, and no "amazing"/"awesome" register appear anywhere in the landing copy or microcopy. *(AC-20)*

## Assumptions

- **Slice numbering**: this is slice **005** (001 walking skeleton, 002 Spec Kit wiring, 003 design tokens + card, 004 persistence). The build plan labels it "Slice 2.1."
- **Section count (resolved)**: **seven** sections — nav, hero, source strip, how-it-works, sample reports, pricing teaser, footer.
- **Footer status string vs design**: the design page shows a different version label; per explicit instruction the literal is **"v0.2.0 · status: operational"** this slice. The string is hard-coded (real status integration is a later slice).
- **Request-time rendering**: the landing reads the database (hero + sample row) at request time, so the route renders dynamically (not statically prerendered at build), consistent with the persistence slice's homepage.
- **Link targets (resolved)**: Sign in → `/login`, Start free → `/signup`, and "See full pricing →" → `/pricing` resolve to soft-404 **stub routes** built this slice (FR-016). "See sample problems" is an **in-page anchor** to the sample-reports section (FR-004/FR-008). "Browse the library →" → `/library` and the canonical card's "Open report →" → `/problems/{slug}` are **known, documented out-of-scope 404s** until later Tier-2 slices — not 2.1 defects.
- **Open Graph image (resolved)**: a hand-authored static raster `og-image.png` (1200×630; wordmark + headline on `surface/canvas`, brand tokens) in the web app's public assets, referenced by absolute URL on the canonical origin `https://bristle.vercel.app` (FR-019/FR-024). No dynamic OG generation.
- **Compact card contract**: derived as a subset of the canonical card's props; the category key→label mapping reuses the shared label map; source markers reuse the existing inline source-icon component.
- **Stub copy (resolved)**: per-route version strings — `/pricing` "Coming in v0.2.2", `/about` "Coming in v0.2.3", `/blog` "Coming in v0.2.4", `/changelog` "Coming in v0.2.5", `/login` & `/signup` "Coming in v0.3.X (Tier 3)".
- **Editorial Light default**: no theme marker is set; the page is light-only and dark mode is unreachable until the theming slice.
- **Voice authority**: copy is taken from the design page where shown and written in the project voice elsewhere; exact wording for any copy not legible in the design is drafted to match the voice and confirmed against the design at the visual gate.

## Clarifications

All five open questions were resolved by the user on 2026-05-22 and folded into the requirements above:

- **Q1 — Hero/sample duplication → four rows + `excludeSlug`**: seed four rows (Stripe/payments hero + devtools + ai-ml + mobile, matching the PDF's three sample cards: pgvector / LLM-streaming / Expo-OTA); the sample row calls `getRecentProblems({ limit: 3, excludeSlug: 'stripe-webhooks-vercel-cold-starts' })`. (FR-008, FR-009, FR-014, FR-015; SC-005, SC-007, SC-008, SC-009; Key Entities; Edge Cases.)
- **Q2 — Section count → seven** (nav, hero, source strip, how-it-works, sample, pricing teaser, footer). (Assumptions.)
- **Q3 — Stub copy → per-route version strings**: pricing v0.2.2 / about v0.2.3 / blog v0.2.4 / changelog v0.2.5 / login & signup "v0.3.X (Tier 3)". (FR-016; SC-010.)
- **Q4 — Link targets**: Sign in `/login`, Start free `/signup`, See full pricing `/pricing` → soft-404 stub routes built this slice (placeholder set extended to **six** routes); "See sample problems" → in-page anchor to the sample section; "Browse the library →" `/library` and the card's "Open report →" `/problems/{slug}` → documented out-of-scope known 404s (not 2.1 defects). (FR-003, FR-004, FR-008, FR-016.)
- **Q5 — OG image → hand-authored static raster** `og-image.png` (1200×630, wordmark + headline on `surface/canvas`), absolute URL on the canonical origin `https://bristle.vercel.app`. (FR-019, FR-024; SC-013.)

### Planning readiness

All clarifications resolved; no outstanding decisions. The spec is ready for `/speckit.plan`.
