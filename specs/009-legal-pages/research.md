# Research: Legal template + four legal pages

Phase 0 decisions (the 14 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: four thin Server Component routes + one shared LegalLayout

- **Decision**: Each of `/terms`, `/privacy`, `/security`, `/gdpr` is a thin async Server Component (~10 lines) that imports its content data file and renders `<LegalLayout content={CONTENT} />`. `LegalLayout` owns the page structure (TopNav + LegalHero + 2-col grid wrapping TocRail + LegalSections + SiteFooter).
- **Rationale**: maps 1:1 to spec sections + 4px gate (for Terms); minimal duplication across the four routes; future template tweaks land in one place and cover all four pages.
- **Alternatives**: single `/legal/[slug]/page.tsx` dynamic route (rejected — Next.js prefers explicit routes for static content; explicit routes preserve `git grep "/terms"` and match existing structure); inline layout in each `page.tsx` (rejected — four-fold duplication, multi-edit on template tweaks).

## D2 — Server vs Client boundary: 1 client file, 12 server/data files

- **Decision**: only `toc-rail.tsx` carries `"use client"` (uses `useState`/`useEffect`/`useRef` for IO + mobile-pill ref Map). Routes, `LegalLayout`, `LegalHero`, `LegalSection`, `types.ts`, and the four content data files are all server-side.
- **Rationale**: same posture as slice 006 (FAQ rail = 1 client) and slice 008 (ContactForm = 1 client); legal prose ships as zero-JS HTML.
- **Alternatives**: render TocRail server-side with no active tracking (rejected — visitors lose the scroll-spy UX, breaks parity with FAQ rail).

## D3 — `LegalContent` type location: separate `types.ts`

- **Decision**: `apps/web/src/components/legal/types.ts` exports `LegalContent`, `LegalSectionContent`, `LegalHeroContent`, `TocItem`. Content data files and `LegalLayout` both import from it.
- **Rationale**: decouples content shape from rendering implementation. Content files don't transitively import `LegalLayout` just to get a type. Cleanest setup for the eventual shared-rail refactor follow-up (where `FaqScrollSpyRail` and `TocRail` both reference a shared section-shape type).
- **Alternatives**: co-located in `legal-layout.tsx` (rejected — see rationale); co-located in `toc-rail.tsx` (rejected — content files would import a client component); inline-duplicated in each content data file (rejected — drift risk on edit).

## D4 — `LegalContent` shape: `ReadonlyArray` + optional `reviewNote`

- **Decision**: `hero` = `{eyebrow, headline, lastUpdated: {posted, effective?}}`; `sections` = `ReadonlyArray<{id, number, title, paragraphs: ReadonlyArray<string>, reviewNote?: string}>`. The `TocItem` projection (`{id, number, title}`) is a separate exported type the rail consumes.
- **Rationale**: `ReadonlyArray<T>` prevents accidental mutation (matches the `as const` pattern of prior slices). `reviewNote?` carries `[REVIEW: ...]` developer notes; `LegalSection` renders only `paragraphs`, never `reviewNote` (FR-018 / D7). Separate `TocItem` keeps the rail's prop surface tight and avoids serializing paragraphs prose for hydration.
- **Alternatives**: combine `id`/`number`/`title` into one composite (rejected — number is structural not display; rendering wants them separately); render `reviewNote` inline as a developer comment (rejected — violates voice §6 and exposes internal review state to users).

## D5 — `LegalLayout` grid template: `md:grid-cols-[16rem_1fr]` with `md:gap-section`

- **Decision**: 16rem (≈256px) left column for the TocRail, `1fr` right column for the sections, 64px gap (`md:gap-section`). Below `md`, single column with TocRail's mobile pill row at top.
- **Rationale**: matches slice-006 `FaqBody` exactly (verbatim grid template). 16rem accommodates the longest legal label ("Limitation of liability", ~25 chars at `body-sm`) plus the active accent bar. `gap-section` (64px) matches long-read article breathing room.
- **Alternatives**: 14rem narrower rail (rejected — "Limitation of liability" wraps to 2 lines, weakens active-state visual cue); 20rem wider rail (rejected — eats reading column width on `md`-only viewports like ~768px tablets).

## D6 — TocRail IntersectionObserver: structural mirror of slice-006 FAQ rail

- **Decision**: `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`. `Map<itemId, topY>` ref updated by observer callback; topmost (smallest `topY`) intersecting item's `id` becomes active. When `visibleItems.size === 0`, early-return without clearing active (no flicker). Selector: `document.querySelectorAll("[data-legal-section]")` — distinct from FAQ rail's `[data-faq-item]`.
- **Rationale**: slice-006 FAQ rail's config is well-tuned for the same use case (long-form sectioned content + sticky rail + topmost-visible active state); re-deriving from scratch would risk regressing the smoothness. The follow-up shared `SectionScrollSpyRail` will parameterize selector + initial active section over this verbatim config.
- **Alternatives**: re-tune the config per slice (rejected — wasted iteration cost); different active-resolution rule like "section whose center crosses viewport center" (rejected — has worse UX for very long sections where the center never appears).

## D7 — ARIA semantic pattern: current-location nav (NOT tablist)

- **Decision**: `<nav aria-label="Sections of the page">` > `<ul><li><a href="#{id}" aria-current={active ? "location" : undefined}>...</a></li></ul>`. Anchors are plain `<a>` not `<button>` (preserves native browser anchor features). NO `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls`.
- **Rationale**: slice-006 STOP-2 corrected the FAQ rail from incorrect `role="tablist"` to current-location nav; legal pages inherit the corrected pattern from day one. The rail is navigation that scroll-jumps to anchored sections, NOT a tabs UI replacing content. Cmd-click new tab, middle-click, keyboard activation all work for free with native anchors.
- **Alternatives**: ship the incorrect `role="tablist"` pattern and fix later (rejected — would repeat slice-006's mistake; user explicitly fixed it once already); `<button>` with `onClick={() => history.pushState(null, "", "#{id}")}` (rejected — loses native anchor features and prefers JS for what HTML does for free).

## D8 — Reduced-motion short-circuit: read fresh per invocation

- **Decision**: `window.matchMedia("(prefers-reduced-motion: reduce)").matches` read **inside** each handler (handleClick, mobile-pill auto-scroll useEffect), never cached at module scope or component mount.
- **Rationale**: visitors toggle OS reduced-motion mid-session; next interaction should respect new value immediately. Slice-006 precedent. The matchMedia call is microseconds.
- **Alternatives**: `useMediaQuery` hook caching the value (rejected — adds dep or custom hook for negligible benefit, breaks mid-session toggle).

## D9 — Mobile pill auto-scroll-into-view: second useEffect keyed on active

- **Decision**: `useEffect(() => { /* ... */ }, [active])` with `matchMedia("(min-width: 768px)").matches` early-return on desktop, then `pill.scrollIntoView({inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth"})` on mobile.
- **Rationale**: verbatim slice-006 FAQ rail pattern (lines 80-90 of `scroll-spy-rail.tsx`). `inline: "center"` ensures visitor sees active pill regardless of how many sections precede it; `block: "nearest"` doesn't scroll the *page* vertically (pill row is its own scroll container).
- **Alternatives**: scroll the page to sync with active section on mobile (rejected — page IS scrolling, the rail just needs to follow horizontally); use `scrollIntoView({behavior: "instant"})` always on mobile (rejected — loses smoothness affordance for users without reduced-motion preference).

## D10 — Per-page metadata: 4 titles, 4 descriptions (proposed), slice-005 OG reused

- **Decision**: Titles per FR-016 (`Terms of Service — Bristle`, `Privacy Policy — Bristle`, `Security — Bristle`, `GDPR Compliance — Bristle`). Descriptions proposed:
  - Terms: "The terms that govern your use of Bristle, including account, billing, cancellation, and liability."
  - Privacy: "What data Bristle collects, why we collect it, and the rights you have over it."
  - Security: "How Bristle protects customer data and how to report security issues."
  - GDPR: "Bristle's specific commitments to EU and UK data subjects under GDPR."
  All four OG images = `${SITE_URL}/og-image.png` (slice-005 raster reused). No `robots` field on any of the four.
- **Rationale**: title format matches slice-006/008. Descriptions each cover the "what + why" of the page in one §6-voice sentence (no exclamations, plain-spoken). OG reuse per clarification (d) — legal pages aren't marketing surfaces; the wordmark+tagline OG is sufficient.
- **Alternatives**: per-page OG images (rejected — clarification (d), no design effort warranted); auto-generated descriptions from first paragraph (rejected — slice-006 set the precedent of curated descriptions; quality > automation).

## D11 — Perf/SEO budget: TocRail server-only-data, lucide unused, no analytics

- **Decision**: TocRail's compiled JS ~1-2 KB (mirrors FAQ rail size minus the FAQ rail's coexistence with Radix Accordion's ~5 KB). Content data files import only from server modules; prose never serialized to client JSON. No PostHog/Sentry on these pages this slice. All four routes `○ Static` per FR-023.
- **Rationale**: Expected First-Load JS per legal route: ~107-110 KB (slice-005 baseline ~106 KB + TocRail ~1-2 KB), well under 180 KB budget. Slice-006 `/faq` at 116 KB is the comparable upper bound (it bundles the Radix Accordion the legal pages don't have).
- **Alternatives**: load PostHog on legal pages (rejected — adds bundle weight for pages where engagement metrics are low-signal); pre-render section content into static MDX (rejected — adds tooling complexity; TS modules suffice for this volume).

## D12 — Test surface: gates only; visual diff applies to /terms only

- **Decision**: typecheck/lint/build + Lighthouse + responsive sweep + keyboard reach + reduced-motion walk + deep-link anchor + greps + metadata curl + additive-only diff. Visual-diff vs PDF p.10 applies ONLY to `/terms` (the template reference); the other three routes get structural correctness via code review + Lighthouse, not pixel diff.
- **Rationale**: same as slices 006/008. No PDFs exist for Privacy / Security / GDPR — they apply the same template structurally.
- **Alternatives**: author PDFs for the other three (rejected — out-of-scope of slice 009; design work not warranted for content-only pages on the same template).

## D13 — Risks: see plan §13. Key items:
- R1 4px fidelity for Terms; R4 reviewNote vs prose confusion (mitigated by FR-018 + grep gate); R8 refund-policy alignment cross-slice constraint (permanent); R9 bundle budget (low risk given no new deps).
- Tracked follow-ups: shared `SectionScrollSpyRail` dedup (FaqScrollSpyRail + TocRail), `/privacy/sub-processors` deep page, refund-policy alignment audit, slice-005 `<main>` landmark, NewsletterStub convergence, form spam protection, Vitest harness, `/api/contact`.

## D14 — Batching: 4 batches / 4 STOPs, mirroring slices 006/008

- **Decision**: Batch A foundations (5 tasks: types + 4 content files); Batch B template primitives (3 tasks: LegalHero + LegalSection + TocRail, [P]-parallel); Batch C layout + 4 routes (5 tasks: LegalLayout + 4 page.tsx, [P]-parallel after LegalLayout); Batch D gates (2 verification gates, no commits).
- **Rationale**: same shape as slices 006/008. Smaller than 008 (~13-14 commit-producing vs 19) because no deps, no env vars, no Server Action.
- **Alternatives**: collapse to 3 batches (rejected — separating template primitives from layout+routes preserves the per-STOP review discipline); single batch (rejected — patches-only slice 007 was 1-batch; this slice has 9+ new files and a client component, multi-batch shape is right).
