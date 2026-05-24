# Feature Specification: Legal template + four legal pages

**Feature Branch**: `009-legal-pages`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Slice 009 — part 2 of the originally-enumerated 'Slice 2.3 About + Contact + Legal'. Builds the legal-page template (LegalLayout + LegalHero + LegalSection + TocRail) and ships four routes — /terms, /privacy, /security, /gdpr — each rendering 10 numbered sections of placeholder copy that the founder/legal reviews and revises before production launch. The TocRail mirrors the slice-006 FaqScrollSpyRail structurally (additive only — no edits to that file); a tracked follow-up dedupes them into a shared SectionScrollSpyRail in a future refactor slice. Slice 008 shipped part 1 (About + Contact + Resend); this slice flips the four slice-005 footer Legal column links from known-out-of-scope-404 to live."

## Overview

This slice completes the originally-enumerated build-plan slice "2.3 About + Contact + Legal" by shipping the four legal pages. Slice 008 covered About + Contact + Resend; slice 009 covers Terms of Service, Privacy Policy, Security, and GDPR Compliance. Each is a long-form editorial document on a shared template: top nav + LegalHero (eyebrow + serif headline + last-updated caption) + two-column body (sticky table-of-contents rail on the left, ten numbered content sections on the right) + site footer. The four routes are thin wrappers around a single `LegalLayout` server component that takes a typed `LegalContent` constant; the four content data files (`terms-content.ts`, `privacy-content.ts`, `security-content.ts`, `gdpr-content.ts`) each export one such constant with the page's hero, TOC items, and 10 section bodies. All four content data files carry a `[PLACEHOLDER — legal review needed before production launch]` header comment per the slice-006 FR-012a discipline; specific `[REVIEW: ...]` markers in source flag every item that needs an explicit founder/legal decision before launch (entity name, jurisdiction, payment processor, registered address, sub-processor list, DPO designation, refund-policy alignment with the shipped FAQ). The TocRail is a new client component at `apps/web/src/components/legal/toc-rail.tsx` that structurally mirrors slice-006's `FaqScrollSpyRail` (`IntersectionObserver`-driven topmost-visible active section, sticky vertical rail on desktop, horizontal pill row on mobile with auto-scroll-into-view, `prefers-reduced-motion` short-circuit on `scrollIntoView`) — **not** a refactor of the FAQ rail; a tracked follow-up dedupes the two into a shared `SectionScrollSpyRail` in a future refactor slice (same pattern as slice 008's tracked `NewsletterStub` duplication). The four routes were "known out-of-scope 404s" in the slice-005 footer Legal column — both `site-footer.tsx` and the four `href` values are unchanged this slice; the links flip from 404 to live the moment slice 009 ships. **No new dependency, no DB schema change, no edit to any shipped slice file.**

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor reads a legal page and navigates between its sections (Priority: P1)

A visitor clicking "Terms" / "Privacy" / "Security" / "GDPR" in the footer Legal column — or following an inbound link from search or a support email — lands on a fully rendered legal page: editorial hero (eyebrow + serif headline + last-updated caption), table-of-contents rail on the left listing 10 numbered sections, ten body sections on the right. They can read top-to-bottom, click a TOC anchor to jump to a specific section, or scroll naturally and watch the TOC's active state follow them. On mobile, the TOC collapses to a horizontal pill row above the content with the same active-tracking behavior. Anchored URLs (`/terms#cancellation-refunds`) deep-link to the right section.

**Why this priority**: Legal pages are the trust surface. Visitors check them before paying. Search engines crawl them and they affect organic discoverability. Customers also link directly to specific sections (e.g. "see section 6 of our Terms") so the per-section anchor pattern is load-bearing for ongoing customer support. This story is the slice — the four pages and the TOC navigation are the entire customer-facing surface.

**Independent Test**: Open `/terms` on a production build; confirm the page renders top nav + hero + 10-item TOC rail + 10 numbered sections + footer; click each TOC anchor and confirm smooth scroll to the matching section; scroll the page and confirm the TOC's active item follows; deep-link to `/terms#cancellation-refunds` and confirm the page loads scrolled to that section. Repeat for `/privacy`, `/security`, `/gdpr`.

**Acceptance Scenarios**:

1. **Given** `/terms` on a production build, **When** the page loads, **Then** the page renders top to bottom: top nav (reused from slice 005), LegalHero (`LEGAL` eyebrow in accent color + serif headline `Terms of Service` + `Last updated · 2026-05-24 · Effective 2026-05-24` caption), two-column body — left column = sticky TocRail listing the 10 numbered TOC items in order, right column = 10 `LegalSection` components in order — and site footer (reused from slice 005).
2. **Given** the same page, **When** the visitor clicks the 6th TOC anchor (`6. Cancellation & refunds`), **Then** the page smooth-scrolls to the section with `id="cancellation-refunds"`; with `prefers-reduced-motion: reduce` set the scroll is instant.
3. **Given** the visitor scrolls down the page, **When** the topmost visible section is section 7 (Termination), **Then** the TocRail's 7th item gets `aria-current="location"`; the active visual treatment (vertical accent bar on desktop, filled pill on mobile) updates to match.
4. **Given** a deep-link URL `https://bristle.vercel.app/terms#cancellation-refunds`, **When** the visitor opens it, **Then** the browser scrolls to the matching section on load (native anchor behavior preserved).
5. **Given** the rendered page vs `design/Public_pages.pdf` page 10 (Terms template reference) at the design viewport, **When** compared, **Then** each section matches within a 4px tolerance. The other three routes (Privacy, Security, GDPR) apply the same template; their visual correctness is **structural** (same components, same layout, different content), not pixel-diffed against a PDF.

---

### User Story 2 - The four slice-005 footer Legal links flip from known-404 to live (Priority: P1)

A visitor scrolling to the footer of any page sees the Legal column — Terms / Privacy / Security / GDPR — and clicks any of them. Pre-slice-009: the click navigated to a hard 404 page (those four routes did not exist yet). Post-slice-009: the click lands on the matching legal page. **No edit to `site-footer.tsx` is required** — the footer's hrefs already point to `/terms` / `/privacy` / `/security` / `/gdpr` from slice 005, and the routes go live the moment slice 009 ships.

**Why this priority**: Three of the four legal pages are statutory or quasi-statutory pieces that the rest of the product copy already references — the GDPR page is named in the FAQ's q-4 answer ("Full GDPR details are on our Privacy page" — slice 008), the refund policy in the Terms page must align with FAQ q-5 ("No automatic refund policy — case-by-case"), and the Privacy page is referenced from the GDPR page's section 6 (Sub-processors). Until slice 009 ships, all of those references resolve to 404s and the trust surface is broken. P1.

**Independent Test**: Open `/` on a production build, scroll to the footer's Legal column, click each of the four links in turn, confirm each lands on the corresponding `/terms` / `/privacy` / `/security` / `/gdpr` page (HTTP 200, not 404). Verify the existing `site-footer.tsx` file has not been modified by this slice (`git diff --stat`).

**Acceptance Scenarios**:

1. **Given** the slice-005 footer's Legal column, **When** the visitor clicks "Terms", **Then** the visitor lands on `/terms` (HTTP 200) — pre-slice-009 was a known out-of-scope 404.
2. **Given** the same footer, **When** the visitor clicks "Privacy" / "Security" / "GDPR", **Then** each click lands on the corresponding `/privacy` / `/security` / `/gdpr` page (HTTP 200).
3. **Given** the implementing PR's diff, **When** inspected, **Then** `apps/web/src/components/landing/site-footer.tsx` is **unchanged** (additive-only — the four hrefs already pointed at these routes from slice 005).
4. **Given** the slice-008 FAQ q-4 answer ("Full GDPR details are on our Privacy page"), **When** a visitor following that prose navigates to `/privacy`, **Then** the page resolves (live) — closing the cross-page reference broken since slice 008 shipped.

---

### User Story 3 - Each page meets the perf, a11y, SEO, voice, and responsive floors (Priority: P1)

`/terms`, `/privacy`, `/security`, `/gdpr` each load quickly on mobile, are keyboard- and screen-reader-usable end-to-end (including the new TocRail), are correctly described to search engines and social-share cards, are statically prerendered, and reflow cleanly across the six target widths. The TocRail's IntersectionObserver respects `prefers-reduced-motion` for scroll behavior. All four pages are launched, indexable pages (no `robots: noindex`).

**Why this priority**: Same posture as every prior public-page slice — credibility floors are non-negotiable for the skeptical-technical audience the product targets. Legal pages specifically have an extra discipline: they're long-form documents where keyboard navigation, deep-link anchors, and screen-reader landmark semantics matter more than on a marketing page (visitors and reviewers actually navigate them by section).

**Independent Test**: Run Lighthouse against each of `/terms`, `/privacy`, `/security`, `/gdpr` on a production build and confirm all four category scores meet the floor on each; measure the initial script payload for each route; resize across the six target widths and confirm clean reflow; inspect emitted metadata + OG tags; tab through the TocRail and confirm every anchor is reachable with a visible focus ring; verify section semantics (h1 for page title in LegalHero, h2 per numbered section).

**Acceptance Scenarios**:

1. **Given** a production build of each of `/terms`, `/privacy`, `/security`, `/gdpr`, **When** audited, **Then** Performance, Accessibility, Best Practices, and SEO each score at least 90.
2. **Given** each route, **When** its initial script payload is measured, **Then** it is under 180 KB compressed.
3. **Given** the build output, **When** inspected, **Then** all four legal routes are marked `○ Static` (prerendered at build time — no DB reads, no `force-dynamic`).
4. **Given** widths of 320, 375, 768, 1024, 1280, and 1440, **When** each page is viewed at each, **Then** there is no horizontal scroll, no overlapping content, and no clipped text; the TocRail collapses to a horizontal pill row at and below the mobile breakpoint with the same active-tracking behavior.
5. **Given** each page head, **When** inspected, **Then** it emits a page-level `<title>` (`Terms of Service — Bristle`, `Privacy Policy — Bristle`, `Security — Bristle`, `GDPR Compliance — Bristle`), meta description, og:title, og:description, og:url (absolute, consuming `SITE_URL`), and og:image (absolute, reusing the slice-005 raster); **no `robots: noindex`** on any of the four.
6. **Given** the TocRail on each page, **When** exercised with keyboard alone, **Then** every anchor is reachable via Tab, focus rings are visible, the active section is announced via `aria-current="location"`, and the section headings render with semantic `<h2>` numbering (the page's `<h1>` is the LegalHero headline; no deeper levels needed).
7. **Given** `prefers-reduced-motion: reduce` is set in the browser, **When** the visitor clicks a TocRail anchor or scrolls naturally, **Then** the `scrollIntoView` behavior is instant (`auto`), not smooth — matching the slice-006 FAQ rail's pattern.

---

### Edge Cases

- **Deep-link to a section** (`/privacy#data-retention`): the browser performs its native anchor-jump scroll on page load; the TocRail's IntersectionObserver fires the moment the section enters the viewport and marks it active. The active state matches the URL hash within ~100ms of load.
- **TocRail "between sections"**: when the visitor is scrolled to a position where no section's marker element is intersecting (e.g. between section 5's body bottom and section 6's heading), the rail keeps its previous `active` value — no flicker, no "no-section" intermediate state. Same rule as slice 006's FAQ rail.
- **Long section with multiple paragraphs**: each `LegalSection` renders a single `<section id="..."> <h2>N. Title</h2> <p>...</p>` group; multiple paragraphs render as separate `<p>` elements in source order; the IntersectionObserver tracks the section wrapper element (`data-legal-section="{id}"`), not each paragraph.
- **Reduced-motion at runtime**: the `prefers-reduced-motion` media query is read on each `scrollIntoView` invocation (not cached at component mount), so a user toggling the OS preference mid-session takes effect immediately on the next jump.
- **Mobile pill row at narrow widths (320)**: the horizontal pill row scrolls horizontally inside its own container; the active pill auto-scrolls into view (`scrollIntoView({inline: "center", block: "nearest"})`) so the visitor always sees which section they're in. Instant under reduced-motion.
- **Visitor reads to the bottom of the page**: the last section (section 10) becomes the active section and stays active as the visitor scrolls past it (no section follows; the rail does not unset).
- **Browser without IntersectionObserver** (none in target support — Safari 12.1+ baseline since 2019): the TocRail still renders as static anchor links; the active-state tracking degrades silently to "no active state" — anchors still work (native browser anchor navigation), just no rail-side highlight. No JavaScript error.
- **`[REVIEW: ...]` markers in content**: these are developer-facing comments alongside the paragraph data in TypeScript source; the `LegalSection` component renders **only the prose paragraphs**, not the review notes. A reader of the rendered page never sees them. A reviewer of the source / PR description sees them in the pre-launch checklist.
- **No PDF for Privacy / Security / GDPR**: only `design/Public_pages.pdf` page 10 (Terms) exists as a visual reference. The other three routes inherit the same template structurally; their visual correctness is asserted at the template level (same `LegalLayout` + `LegalHero` + `TocRail` + `LegalSection`) rather than at the per-page-pixel level. No additional PDFs need to be authored this slice.
- **No `/privacy/sub-processors` deep-page**: the Privacy section 5 and GDPR section 6 reference this path, but it is **not built this slice**. The link resolves to 404 until a follow-up slice (likely 2.7 or a separate sub-processors slice). The link still renders in the prose; visitors land on the 404 page Next.js generates. This is a documented out-of-scope link (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

**Routes (US1, US2)**

- **FR-001**: Four new route files MUST be created — `apps/web/src/app/terms/page.tsx`, `apps/web/src/app/privacy/page.tsx`, `apps/web/src/app/security/page.tsx`, `apps/web/src/app/gdpr/page.tsx`. Each is an async Server Component that imports its content data file and renders `<LegalLayout content={content} />`. None of these four routes had prior soft-404 stubs (unlike slice-005's `/about`, `/blog`, `/changelog`, `/login`, `/signup`) — they were "known out-of-scope 404s" in the slice-005 footer Legal column, and the footer's `href` values already point to these routes.
- **FR-002**: Each of the four routes MUST return HTTP 200 on a local production build and on the Vercel preview deploy.

**Shared template (US1)**

- **FR-003**: A `LegalLayout` Server Component at `apps/web/src/components/legal/legal-layout.tsx` MUST accept a `content: LegalContent` prop and render: slice-005 `TopNav` + the LegalHero (rendered from `content.hero`) + two-column body (`md:grid-cols-[16rem_1fr]` or equivalent — TocRail left, sectioned content right) + slice-005 `SiteFooter`. The two-column layout collapses to a single column at the `md` breakpoint with the TocRail rendered as a horizontal pill row above the section content.
- **FR-004**: A `LegalHero` Server Component at `apps/web/src/components/legal/legal-hero.tsx` MUST render: a left-aligned `LEGAL` eyebrow in `text-accent-bristle` + a serif display headline (the page title) + a small caption reading `Last updated · {posted}` (when `lastUpdated.effective` is unset) or `Last updated · {posted} · Effective {effective}` (when both are set). Date values are pulled from `content.hero.lastUpdated`.
- **FR-005**: A `LegalSection` Server Component at `apps/web/src/components/legal/legal-section.tsx` MUST render a single numbered section: `<section id="{id}" data-legal-section="{id}"> <h2>{number}. {title}</h2> <p>{paragraphs[0]}</p> ...</section>`. The `id` attribute drives native anchor links; `data-legal-section` is the marker the TocRail's IntersectionObserver queries against.
- **FR-006**: A shared `LegalContent` type MUST be defined at `apps/web/src/components/legal/types.ts` (or co-located in `legal-layout.tsx` per the plan's file decision):
  ```
  hero: { eyebrow: string; headline: string; lastUpdated: { posted: string; effective?: string } }
  sections: Array<{ id: string; number: number; title: string; paragraphs: string[]; reviewNote?: string }>
  ```
  The `reviewNote` field is optional and is the structured home for `[REVIEW: ...]` markers; the `LegalSection` component MUST NOT render `reviewNote` to the user-visible page (it's developer-facing only — see FR-018).

**TocRail (US1)**

- **FR-007**: A `TocRail` client component at `apps/web/src/components/legal/toc-rail.tsx` MUST exist and carry `"use client"`. It MUST accept the page's TOC items (derived from `content.sections`) as a prop and render: a desktop sticky vertical rail (visible at `md+`) and a mobile horizontal pill row (visible below `md`). The mobile pill row MUST be scrollable horizontally and MUST auto-scroll the active pill into view (`pill.scrollIntoView({ inline: "center", block: "nearest" })`) when the active item changes.
- **FR-008**: The TocRail MUST use the browser `IntersectionObserver` API to track which `[data-legal-section]` element is in the upper-middle of the viewport. The rule matches slice-006 `FaqScrollSpyRail`: `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`; the topmost intersecting element's `id` becomes the new active section; when no element is intersecting, the previously-active value is **preserved** (no flicker). The component MUST be additive — it MUST NOT import from or modify `apps/web/src/components/faq/scroll-spy-rail.tsx`.
- **FR-009**: Clicking a TocRail anchor MUST smooth-scroll the page to the matching section (`target.scrollIntoView({ behavior: "smooth", block: "start" })`). When `prefers-reduced-motion: reduce` is set, the scroll behavior MUST be `"auto"` (instant). The reduced-motion check MUST be read fresh on each invocation (via `window.matchMedia(...).matches`), not cached at component mount.
- **FR-010**: The TocRail anchor matching the currently-active section MUST carry `aria-current="location"`. Non-active anchors MUST NOT carry that attribute. The visual active treatment is `border-l-2 border-accent-bristle` (desktop vertical rail) and a filled pill background (mobile horizontal pill row).
- **FR-011**: TocRail anchors MUST be standard `<a href="#{id}">` elements (not buttons). This preserves native browser anchor behavior (deep-linking, back-button history, Cmd-click for new tab, keyboard activation) while the JS handler intercepts plain-click for the smooth-scroll behavior. Same pattern as slice 006's `FaqScrollSpyRail` after the user-requested semantic fix.

**Content data files (US1)**

- **FR-012**: Four content data files MUST be created under `apps/web/src/components/legal/`:
  - `terms-content.ts` — Terms of Service content (per spec scope §9)
  - `privacy-content.ts` — Privacy Policy content (per spec scope §10)
  - `security-content.ts` — Security content (per spec scope §11)
  - `gdpr-content.ts` — GDPR Compliance content (per spec scope §12)
  Each file MUST export a single typed `LegalContent` constant conforming to FR-006.
- **FR-013**: Each of the four content data files MUST begin with a header comment exactly reading `// [PLACEHOLDER — legal review needed before production launch]` (lighter version of slice-006 FR-012a / slice-008 FR-006 discipline — single header, no per-item bullet list).
- **FR-014**: Each content data file MUST contain exactly **10 sections** with the section ids and titles documented in scope §§9-12 of the user brief, in the order documented. Each section's `paragraphs` array MUST contain the verbatim copy documented in the user brief (verifiable by grepping each file for a distinctive opening phrase from each section per AC-4).
- **FR-015**: The Terms content's section 6 ("Cancellation & refunds") MUST align with the FAQ q-5 answer shipped in slice 008 ("No automatic refund policy — case-by-case"). The `[REVIEW: ...]` marker on this section in source documents the alignment requirement — if the policy changes, both `terms-content.ts` section 6 AND `faq-data.ts` q-5 MUST update together.

**Per-page metadata (US3)**

- **FR-016**: Each of the four route pages MUST export a `metadata: Metadata` object consuming `SITE_URL` from `@bristle/shared`. Title strings: `Terms of Service — Bristle`, `Privacy Policy — Bristle`, `Security — Bristle`, `GDPR Compliance — Bristle`. Description strings: one sentence each in §6 voice (plain-spoken, no exclamations / emoji / hype). `og:title` and `og:description` mirror the page-level title and description. `og:url` is absolute (`SITE_URL + "/{slug}"`). `og:image` is the slice-005 raster at `${SITE_URL}/og-image.png` (reused unchanged across all four pages). **No `robots` field** on any of the four — all four pages are launched and indexable.
- **FR-017**: No new OG image MUST be authored this slice. All four pages share the slice-005 raster (per Assumptions §"OG image strategy" + clarification (d)).

**Voice, tokens, a11y, perf (US3)**

- **FR-018**: All `[REVIEW: ...]` markers (from the user brief's scope §§9-12) MUST be carried in source via the optional `reviewNote?: string` field on the section type. The `LegalSection` component MUST render **only `section.paragraphs`** to the user-visible output; `section.reviewNote`, when present, MUST NOT appear in any rendered page. The markers surface for the founder via (a) the source file content and (b) the eventual PR description's pre-launch review checklist (which mirrors the markers verbatim).
- **FR-019**: All tokens (color, type, spacing, radii, motion) in every new file MUST resolve through the design tokens. Every new file MUST contain zero hardcoded hex color literals and zero hardcoded font-family strings. Lucide-react icons (if any are used for the mobile pill row indicator or similar) MUST render at the 1.5px stroke per §3.
- **FR-020**: All visible prose on all four pages MUST follow the voice rules — no exclamation marks, no emoji, no "amazing/awesome" register. Em-dashes are punctuation, not exclamations. The `[REVIEW: ...]` markers MAY contain stronger language (developer-facing) but are exempt because they are never rendered to the user (per FR-018).
- **FR-021**: All four pages MUST render correctly in Editorial Light with no document-root theme marker set. next-themes integration remains deferred to slice 2.6.
- **FR-022**: The four route entries MUST be async Server Components. **Only** `apps/web/src/components/legal/toc-rail.tsx` MUST carry the `"use client"` directive. Every other new file — `LegalLayout`, `LegalHero`, `LegalSection`, the four content data files, the `LegalContent` type module — MUST be a Server Component or server-only module. Verifiable by `grep -l "use client" apps/web/src/components/legal apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx` returning exactly one file.
- **FR-023**: All four legal routes MUST be statically prerendered (`○ Static` in `next build` output). No DB reads, no `force-dynamic`, no client components other than the `TocRail` (which prerenders its initial state SSR'd; the IntersectionObserver runs only after hydration).
- **FR-024**: First Load JS for each of `/terms`, `/privacy`, `/security`, `/gdpr` MUST be under 180 KB compressed (per CLAUDE.md §5 budget). Expected: close to the slice-005 baseline (~106-110 KB) + the small TocRail client bundle (~1-2 KB) — well within budget.
- **FR-025**: This slice is **additive only**. **No** files under `apps/web/src/components/landing/` (slice-005), `apps/web/src/components/pricing/` or `apps/web/src/components/faq/` (slice-006), `apps/web/src/components/about/` or `apps/web/src/components/contact/` (slice-008), `apps/web/src/lib/resend.ts` (slice-008), or `apps/web/src/app/contact/actions.ts` (slice-008) MUST be modified. `apps/web/src/components/landing/site-footer.tsx` is **unchanged** — the four footer Legal column hrefs already pointed at `/terms` / `/privacy` / `/security` / `/gdpr` from slice 005.
- **FR-026**: No new top-level dependency MUST be added. The TocRail is hand-rolled `IntersectionObserver`, same pattern as slice 006's FAQ rail; no new package needed. `pnpm-lock.yaml` MUST remain unchanged.
- **FR-027**: Type-check, lint, and a production build of the web app MUST all succeed with no errors.

### Key Entities *(include if feature involves data)*

This slice introduces **no database schema changes**, **no new query helpers**, and **no persisted data**. All content is statically authored in the codebase. The following are content-shape entities — what each file exports — not persisted records:

- **LegalContent** (shared shape at `apps/web/src/components/legal/types.ts`):
  - `hero: { eyebrow: string; headline: string; lastUpdated: { posted: string; effective?: string } }` (one per page)
  - `sections: Array<{ id: string; number: number; title: string; paragraphs: string[]; reviewNote?: string }>` (10 entries per page; section ids per the scope §§9-12 enumeration)
- **terms content** (`terms-content.ts`) — `LegalContent` instance with 10 Terms sections per scope §9
- **privacy content** (`privacy-content.ts`) — `LegalContent` instance with 10 Privacy sections per scope §10
- **security content** (`security-content.ts`) — `LegalContent` instance with 10 Security sections per scope §11 (no `effective` date — `lastUpdated.effective` omitted)
- **gdpr content** (`gdpr-content.ts`) — `LegalContent` instance with 10 GDPR sections per scope §12 (no `effective` date — `lastUpdated.effective` omitted)
- **TocItem** (consumed by `TocRail`): derived in the component (or passed by `LegalLayout`) as `{ id: string; number: number; title: string }` — the minimal projection of a section needed by the rail (no body paragraphs, no reviewNote).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a local production build, each of `/terms`, `/privacy`, `/security`, `/gdpr` responds HTTP 200. *(AC US1-1, US2-1, US2-2)*
- **SC-002**: Each of the four pages renders the full `LegalLayout`: top nav (reused) + LegalHero (eyebrow + headline + last-updated caption) + two-column body (TocRail left, sectioned LegalSection content right) + site footer (reused). *(AC US1-1)*
- **SC-003**: Each page renders **exactly 10** numbered sections in the order documented in scope §§9-12 of the user brief — verifiable by counting `<section>` elements or `data-legal-section` markers in the rendered HTML.
- **SC-004**: Section bodies match the verbatim copy in scope §§9-12 — verifiable by grepping each content data file for a distinctive opening phrase from each section (e.g. Terms section 1: `"These terms govern your use of Bristle"`; Privacy section 8: `"You can access, correct, export"`; Security section 4: `"All traffic to and from Bristle is encrypted"`; GDPR section 7: `"EU and UK data subjects have the following rights"`).
- **SC-005**: Each content data file (`terms-content.ts`, `privacy-content.ts`, `security-content.ts`, `gdpr-content.ts`) carries the `// [PLACEHOLDER — legal review needed before production launch]` header comment on line 1 (verifiable by `head -1`).
- **SC-006**: The TocRail on each of the four pages renders **10 anchor links** on desktop (sticky vertical list) AND **10 horizontal pill anchors** on mobile (below `md`). *(AC US1-3, US3-4)*
- **SC-007**: Clicking a TocRail anchor scrolls smoothly to the matching section (`scrollIntoView({behavior: "smooth"})`). With `prefers-reduced-motion: reduce` set, the scroll becomes instant (`behavior: "auto"`). *(AC US1-2, US3-7)*
- **SC-008**: As the visitor scrolls each legal page, the TocRail's active state follows the topmost-visible section — same topmost-visible resolution rule as the slice-006 FAQ rail. *(AC US1-3)*
- **SC-009**: The active TocRail anchor carries `aria-current="location"`; non-active anchors do NOT carry that attribute. *(AC US3-6)*
- **SC-010**: On mobile (`<md`), the horizontal pill row auto-scrolls the active pill into view as the visitor scrolls the page; this scroll is instant under `prefers-reduced-motion: reduce`.
- **SC-011**: Visual diff vs `design/Public_pages.pdf` page 10 (Terms template reference) at 1280 width passes within a 4px tolerance per section for the `/terms` route. The other three routes (`/privacy`, `/security`, `/gdpr`) apply the same template; their visual correctness is **structural** (same `LegalLayout` + components, same spacing, same TOC behavior), not pixel-diffed against a PDF (no PDFs exist for those three). *(AC US1-5)*
- **SC-012**: Responsive sweep at 320 / 375 / 768 / 1024 / 1280 / 1440 for all four routes — no horizontal scroll, no overlapping content, no clipped text; the TocRail collapses to a horizontal pill row at and below the `md` breakpoint. *(AC US3-4)*
- **SC-013**: Each page emits page-level `<title>` (per FR-016), `<meta name="description">`, `og:title`, `og:description`, `og:url` (absolute, from `SITE_URL`), and `og:image` (absolute, slice-005 raster). **None set `robots: noindex`** in the page body. *(AC US3-5)*
- **SC-014**: The slice-005 footer's Legal column links — "Terms" / "Privacy" / "Security" / "GDPR" — flip from known-out-of-scope-404 to live links, navigating from the landing footer to each of the four destinations. **`apps/web/src/components/landing/site-footer.tsx` is unchanged** in this slice's diff (`git diff --stat`). *(AC US2-1 through US2-3)*
- **SC-015**: `pnpm typecheck`, `pnpm lint`, and `pnpm --filter web build` each exit 0. *(FR-027)*
- **SC-016**: First Load JS for each of the four legal pages is under 180 KB compressed. *(FR-024 / AC US3-2)*
- **SC-017**: Lighthouse on each of the four pages served from the local production build scores at least 90 for Performance, Accessibility, Best Practices, and SEO. SEO 60 on the Vercel preview hostname is the documented `x-robots-tag: noindex` artifact (preview-only) and is not a regression. *(AC US3-1)*
- **SC-018**: The deployed Vercel preview URL renders all four pages identically to local and produces no browser-console errors. The TocRail behaves identically on the preview (smooth-scroll, active-state tracking, mobile pill auto-scroll).
- **SC-019**: Build output marks all four routes as `○ Static`. *(AC US3-3)*
- **SC-020**: Server vs Client boundary: each of `/terms`, `/privacy`, `/security`, `/gdpr` `page.tsx` is an async Server Component with no `"use client"`; only `toc-rail.tsx` carries `"use client"`. Verifiable by `grep -l "use client" apps/web/src/components/legal/ apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx` returning **exactly one** file: `toc-rail.tsx`.
- **SC-021**: Greps across all new files in `apps/web/src/components/legal/` plus the four route `page.tsx` files: zero hex color literals, zero font-family strings, zero exclamation marks in **user-visible copy** (the `[REVIEW: ...]` developer comments are exempt — they live in `reviewNote` fields that are never rendered, and any in-source comment-block usage is exempt per FR-020), zero emoji, zero "amazing/awesome" register in any prose.
- **SC-022**: `git diff --stat origin/main..HEAD` shows zero modifications under `apps/web/src/components/landing/`, `apps/web/src/components/pricing/`, `apps/web/src/components/faq/`, `apps/web/src/components/about/`, `apps/web/src/components/contact/`, `apps/web/src/lib/`, `apps/web/src/app/contact/`, `packages/`, or `design/`. Additive only. *(FR-025)*
- **SC-023**: No new top-level dependency in `apps/web/package.json` — `pnpm-lock.yaml` is unchanged by this slice (the TocRail is hand-rolled `IntersectionObserver`, no new package). *(FR-026)*

## Assumptions

- **Slice numbering**: this is slice **009**, the part-2 follow-up to slice 008 (About + Contact + Resend), completing the originally-enumerated build-plan slice "2.3 About + Contact + Legal". Same precedent as slice 007 splitting off from slice 006: a single Tier-2 build-plan slice splits into two implementation slices when the surface is large enough to merit separate review cycles.
- **Branch stacking**: `009-legal-pages` was cut from `origin/main` after slice 008 merged via PR #7 (merge commit `1f729ba`). The branch starts on clean main with no inherited slice-008 commits — same posture as slice 008 was after slice 007 merged.
- **Mobile TocRail pattern (resolved per clarification (a))**: horizontal pill row, mirroring slice-006 FAQ rail. Visitors already know the pattern from `/faq`; cross-page consistency over novelty.
- **Sticky behavior on desktop (resolved per clarification (b))**: TocRail uses `md:sticky md:top-grid` (or equivalent token resolution to ~16px below the top), matching the slice-006 FAQ rail's sticky behavior.
- **Last-updated date strategy (resolved per clarification (c))**: fixed string per content data file. Initial ship sets all four to `2026-05-24`. Founder updates manually when revising. Same pattern as slice 008's About byline; an auto-generated date would drift on every deploy and erode trust on a legal document.
- **OG image strategy (resolved per clarification (d))**: all four pages reuse the slice-005 raster at `${SITE_URL}/og-image.png`. These are legal pages, not marketing surfaces — the brand wordmark + tagline OG is sufficient. No new OG image authored this slice.
- **TocRail naming (resolved per clarification (e))**: `TocRail`. Shorter than `LegalSectionScrollSpyRail`, clearer about purpose (table-of-contents navigation). The shared abstraction lives in the tracked follow-up: dedupe `FaqScrollSpyRail` and `TocRail` into a shared `SectionScrollSpyRail` in a future refactor slice.
- **Section heading levels (resolved per clarification (f))**: `<h1>` is the LegalHero page headline ("Terms of Service" etc.); each of the 10 numbered sections is an `<h2>` (`"3. Subscriptions & billing"`). No deeper heading levels are needed (every section is a single body — multiple paragraphs render as `<p>` elements, not nested headings).
- **`[REVIEW: ...]` rendering discipline (resolved per clarification (g))**: the `LegalSection` component renders only `section.paragraphs` — never `section.reviewNote`. The `reviewNote` field lives alongside the paragraph data in TypeScript source and is exposed only to developers (source readers, PR description, source greps for the pre-launch checklist). The user-visible page is **never** polluted with `[REVIEW: ...]` markers.
- **Refund-policy alignment with the FAQ**: Terms section 6 ("Cancellation & refunds") is authored to align with the FAQ q-5 answer shipped in slice 008 ("No automatic refund policy — case-by-case"). A `[REVIEW: ...]` marker on this section in source explicitly documents the cross-slice alignment requirement (per FR-015).
- **No `/privacy/sub-processors` deep page**: Privacy section 5 and GDPR section 6 both reference this path. This slice does NOT build that route — it remains a 404 until a follow-up slice (likely 2.7 or a separate sub-processors slice). The prose references it as the documented future location; visitors hitting the link land on Next.js's 404 page. This is the only out-of-scope-known-404 introduced by slice 009; documented here so a reader of the spec sees it.
- **TocRail vs FAQ rail duplication (tracked follow-up)**: TocRail is intentionally a structural mirror of `FaqScrollSpyRail`, not a refactor. Both components share ~80% of the IntersectionObserver + mobile-pill-auto-scroll + reduced-motion logic. A future refactor slice (likely 2.7 final wire-up or a separate refactor slice) will extract a shared `SectionScrollSpyRail` parameterised over (a) section-marker selector (e.g. `[data-faq-item]` vs `[data-legal-section]`), (b) section labels source, (c) optional click handler customizations. **NOT done in slice 009** — would expand scope from additive-only to refactor and risk regressing the shipped FAQ rail.
- **Visual diff scope**: only `design/Public_pages.pdf` page 10 (Terms) exists as a PDF reference. The other three routes (`/privacy`, `/security`, `/gdpr`) inherit the same template structurally; their visual correctness is asserted at the template level (same components + spacing + TOC behavior), not pixel-diffed per page. SC-011 documents this scope.
- **Placeholder content discipline**: every line of prose in the four content data files is `[PLACEHOLDER]` per the spec's lighter FR-012a-style discipline. The founder + legal counsel review and revise before the Tier-2 v0.2.0 tag (which ships after all slices 2.1–2.7 land). The slice MERGES with the placeholder copy in place; **production launch is gated separately on the pre-launch review**.
- **Cross-page link integrity**: the four legal pages reference each other and other pages by relative URLs (`/privacy`, `/changelog`, `/status`). After this slice merges: `/privacy` is real, `/changelog` is still a slice-005 stub (slice 2.5 ships it), `/status` is still a 404 (slice 2.7). All such links are inline prose, not buttons — they're informational links the visitor may follow at their discretion; broken ones land on slice-005 stubs or Next.js 404.
- **No tag**: per the project's release-tagging discipline, `v0.X.0` ships at tier completion. Slice 009 is the part-2 of Tier-2 slice 2.3 (with slice 2.4 Blog / 2.5 Changelog / 2.6 Public sample problem detail / 2.7 Final wire-up still to come). The wait for `v0.2.0` continues.

## Clarifications

All seven open questions surfaced before `/speckit.plan` were resolved by the user's slice-009 brief on 2026-05-25 and folded into the requirements / assumptions above:

- **(a) Mobile TocRail pattern → horizontal pill row** (mirrors slice-006 FAQ rail). (FR-007, Assumptions §"Mobile TocRail pattern".)
- **(b) Desktop sticky behavior → `md:sticky md:top-grid`** matching slice-006 FAQ rail. (FR-007, Assumptions §"Sticky behavior on desktop".)
- **(c) Last-updated dates → fixed strings per content data file**, founder updates manually when revising; initial ship date `2026-05-24` for all four. (FR-004, FR-014, Assumptions §"Last-updated date strategy".)
- **(d) OG image → all four pages reuse slice-005 raster** at `${SITE_URL}/og-image.png`; no new OG image authored. (FR-017.)
- **(e) Component naming → `TocRail`** (not `LegalSectionScrollSpyRail` or `SectionScrollSpyRail`); shared abstraction lives in the tracked follow-up. (FR-007, Assumptions §"TocRail naming".)
- **(f) Heading levels → h1 in LegalHero, h2 per numbered section**, no deeper levels. (FR-005, AC US3-6, Assumptions §"Section heading levels".)
- **(g) `[REVIEW: ...]` markers → live in `reviewNote?: string` on the section type**, never rendered to user-visible page. The `LegalSection` component renders only `paragraphs`; the marker is exposed via source / PR description / pre-launch checklist. (FR-006, FR-018, AC §Edge Cases.)

### Planning readiness

All clarifications resolved; no outstanding decisions. The spec is ready for `/speckit.plan`. The plan should pin: the file decisions (where `LegalContent` type lives — co-located in `legal-layout.tsx` vs separate `types.ts`), the TocRail's exact mobile-pill data-attribute names (need to differ from FAQ rail's `data-faq-item` to scope the IntersectionObserver correctly — the spec assumes `data-legal-section` per FR-005), the `LegalLayout` two-column grid template (`md:grid-cols-[16rem_1fr]` matches slice-006 FaqBody but could be revisited), and the implementation batching (recommended: 4-batch / 4-STOP mirroring slice 006 / slice 008, given the surface size — 4 content data files + 4 components + 1 client component + 4 routes = ~14 new files).
