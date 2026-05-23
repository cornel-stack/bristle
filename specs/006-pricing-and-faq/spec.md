# Feature Specification: Pricing + FAQ

**Feature Branch**: `006-pricing-and-faq`

**Created**: 2026-05-23

**Status**: Draft

**Input**: User description: "Slice 2.2 (Tier 2): the Pricing page and the FAQ page. Replace the slice-005 soft-404 stub at `/pricing` with the full Pricing page from `design/Public_pages.pdf` page 3 (hero, Monthly/Annual segmented toggle, three tier cards with Pro highlighted, 9-row compare table, Enterprise card). Add a brand-new `/faq` route from `design/Public_pages.pdf` page 4 (hero, sticky left-rail with scroll-spy, 12-item Radix accordion with one verbatim answer, bottom CTA box). Reuse the slice-005 top nav and site footer unchanged on both pages, repoint the footer's Help center link from `/help` to `/faq`, and ship Editorial Light only — next-themes is still deferred."

## Overview

This slice replaces the slice-005 `/pricing` placeholder with the real Pricing page and adds the new `/faq` page, taking Tier 2 from two-of-five public pages to four-of-five. Both pages reuse the slice-005 top nav and site footer unchanged and introduce three new interactive client components: a segmented Monthly/Annual billing toggle that drives all three tier-card prices, a Radix-based single-expansion FAQ accordion with one item open by default, and an IntersectionObserver-driven scroll-spy rail that highlights the active FAQ section as the visitor scrolls. The Pricing page additionally introduces a 9-row "Compare in detail" feature table and an Enterprise contact-sales card. Both pages render in Editorial Light, set their own page-level metadata (no `robots: noindex`), reuse the slice-005 Open Graph image, and meet the same perf/a11y/SEO/voice floors as the landing. The footer's `Resources → Help center` link is repointed from the still-404 `/help` to the now-real `/faq` to give the FAQ page chrome-level discoverability. The value is two launch-quality public pages — one that turns price-curious visitors into trial signups, one that absorbs support volume before it reaches inbox — plus the interactive-component vocabulary (segmented control, accordion, scroll-spy) that later Tier 2 slices will reuse.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A price-curious visitor compares plans and chooses one (Priority: P1)

A visitor clicks Pricing from the top nav or footer and lands on the full Pricing page: a hero that frames the offer, a Monthly/Annual segmented toggle that previews the 30% annual discount, three tier cards (Starter / Pro highlighted with "Most popular" / Team) whose prices update together as the toggle flips, a detailed 9-row feature-comparison table that lets them confirm what each tier includes, and an Enterprise card for the procurement case. Choosing a tier puts them on the signup path; choosing Enterprise puts them on the contact path.

**Why this priority**: This is the slice's commercial surface. A visitor who can't see, compare, and choose a plan on a marketing page can't convert. Everything else in this slice (FAQ, footer relink, perf/a11y floors) supports or surrounds this conversion path.

**Independent Test**: Open `/pricing` on a production build; confirm all six sections render (nav · hero · toggle · three tier cards · compare table · Enterprise card · footer) and match the design within a 4px tolerance; toggle Monthly ↔ Annual and confirm all three tier prices update together with the discounted per-month figure and "billed annually" caption in the Annual state; click each tier CTA and the Enterprise CTA and confirm each navigates to its documented target.

**Acceptance Scenarios**:

1. **Given** `/pricing`, **When** it loads, **Then** the page renders, top to bottom: top nav, centered hero (eyebrow "PRICING", serif headline "Pricing that scales with discovery.", subhead "Cancel any time. No usage gotchas. Annual saves 30%."), centered Monthly/Annual segmented toggle with a "-30%" badge on the Annual pill, three tier cards in a row (Starter / Pro-highlighted / Team), the "Compare in detail" 9-row feature table, the Enterprise card, and the site footer.
2. **Given** the Pricing toggle in the default Monthly state, **When** the visitor activates the Annual pill, **Then** all three tier prices change together to the discounted per-month figure (rounded to the nearest dollar) and a small "billed annually" caption appears beneath each price; flipping back to Monthly restores the undiscounted figures and removes the caption.
3. **Given** the toggle is focused, **When** the visitor presses Left/Right arrow keys, **Then** focus and selection move between Monthly and Annual; the focus ring is visible at every step.
4. **Given** the compare table, **When** inspected against the design, **Then** the nine rows appear in the exact order and with the exact values specified in FR-006; the Pro column header uses the accent color; absent features show an em-dash and present features show a checkmark icon.
5. **Given** the Pro tier card, **When** rendered, **Then** it carries the "Most popular" tag and an orange-filled CTA; the Starter and Team CTAs are outline-style.
6. **Given** any tier CTA, **When** clicked, **Then** it navigates to `/signup`; the Enterprise CTA navigates to `/contact`.
7. **Given** the rendered page vs `design/Public_pages.pdf` page 3, **When** compared at the design viewport, **Then** each section matches within a 4px tolerance.

---

### User Story 2 - A confused visitor self-serves an answer from the FAQ (Priority: P1)

A visitor with a question — about data sources, privacy, pricing, cancellation, or the API — lands on `/faq` from the top-nav About link's neighborhood, from the footer's Help center link (now pointed here), or from a support reply. They see the hero, a sticky left rail listing the five topic sections, and a 12-item accordion on the right with one item ("Where does Bristle get its data?") expanded by default. They click a rail item to jump to that section, or they scroll the accordion and watch the rail's active state follow them. They open and close items with mouse, Enter/Space, or ESC. If they can't find their answer, the bottom CTA box hands them off to email support.

**Why this priority**: Support volume is the silent tax on a small team. A skeptical-builder audience asks specific questions (legality, data freshness, refund policy, GDPR) before they sign up — the FAQ is the only place this slice can answer them. It is independent of the Pricing page and equally launch-blocking for the Tier 2 public surface.

**Independent Test**: Open `/faq` on a production build; confirm the seven elements render (nav · hero · two-column body with sticky rail + 12-item accordion · bottom CTA · footer) and match the design within a 4px tolerance; confirm the "Where does Bristle get its data?" item is open on first load with the verbatim answer; click each rail section and watch the page scroll to the first item of that section; scroll the accordion manually and watch the rail's active state follow; activate an accordion item with Enter/Space, then close it with ESC; click the "Email a human" mailto and the "Contact support →" / "Open a ticket →" links and confirm each navigates to its documented target.

**Acceptance Scenarios**:

1. **Given** `/faq`, **When** it loads, **Then** the page renders, top to bottom: top nav, left-aligned hero (eyebrow "SUPPORT" in accent color, serif headline "Frequently asked questions", subhead "If you do not find your answer here, email support@bristle.dev. We respond within one business day."), two-column body (sticky left rail with five sections — Pricing / Data sources / Privacy / Cancellation / API — plus a "STILL STUCK?" card below the rail; right column 12-item accordion), bottom CTA box ("STILL DIDN'T FIND IT?" eyebrow, "Email a human at support@bristle.dev." with a mailto link, microcopy, "Open a ticket →" button), and site footer.
2. **Given** the FAQ on first load, **When** the accordion is inspected, **Then** the item "Where does Bristle get its data?" is expanded and its answer matches the design verbatim: *"We ingest from six public sources via official APIs and approved scrapers: GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We never use private channels or content behind authentication walls."*
3. **Given** any closed accordion item, **When** the visitor clicks it or presses Enter/Space while it is focused, **Then** it expands and any previously open item collapses (single-expansion); pressing ESC while an item is open collapses it.
4. **Given** the scroll-spy rail, **When** the visitor scrolls the accordion, **Then** the rail's active section updates to match the topmost visible accordion item; clicking a rail item smooth-scrolls to the first accordion item of that section; with `prefers-reduced-motion` set, the scroll becomes instant (no animation).
5. **Given** the active rail item, **When** rendered, **Then** it carries the vertical accent bar on its left edge per the design.
6. **Given** the bottom CTA box, **When** the visitor clicks "Email a human at support@bristle.dev", **Then** the browser opens a `mailto:` link; the "Open a ticket →" and the rail's "Contact support →" buttons navigate to `/contact`.
7. **Given** the rendered page vs `design/Public_pages.pdf` page 4, **When** compared at the design viewport, **Then** each section matches within a 4px tolerance.

---

### User Story 3 - Both pages meet the perf, a11y, SEO, and responsive floors (Priority: P1)

`/pricing` and `/faq` each load quickly on mobile, are keyboard- and screen-reader-usable end-to-end (including the three new interactive components), are correctly described to search engines and social-share cards, and reflow cleanly across the six target widths.

**Why this priority**: A public marketing page that fails these floors undercuts product credibility with exactly the skeptical, technical audience it targets. These are non-negotiable for launch-quality public pages and independently measurable.

**Independent Test**: Run the audit tool against `/pricing` and `/faq` on a production build and confirm all four category scores meet the floor on each; measure the initial script payload for each route; resize across the six target widths and confirm clean reflow on each; inspect the emitted metadata and Open Graph tags on each page; verify no `robots: noindex` is set on either.

**Acceptance Scenarios**:

1. **Given** a production build of `/pricing` and of `/faq`, **When** each is audited, **Then** Performance, Accessibility, Best Practices, and SEO each score at least 90.
2. **Given** each route, **When** its initial script payload is measured, **Then** it is under 180 KB compressed.
3. **Given** widths of 320, 375, 768, 1024, 1280, and 1440, **When** each page is viewed at each, **Then** there is no horizontal scroll, no overlapping content, and no clipped text; the Pricing tier cards stack on mobile; the FAQ left rail collapses into a mobile-appropriate pattern (a section header above the accordion, a dropdown, or an equivalent).
4. **Given** each page head, **When** inspected, **Then** it emits a page-level title, meta description, og:title, and og:description; neither page sets `robots: noindex`; both reference the slice-005 OG image at the canonical origin.
5. **Given** the three new interactive components, **When** exercised with keyboard alone, **Then** every control is reachable, focus is visible at every step, and the documented keyboard semantics work (toggle arrow keys, accordion Enter/Space, accordion ESC, rail click + smooth-scroll).

---

### User Story 4 - The footer's Help center link reaches the FAQ (Priority: P3)

A visitor scrolling to the footer of any page sees the same Resources column from slice 005, but the "Help center" link — which previously pointed at the still-unbuilt `/help` route — now navigates to the new `/faq` page. The fix is invisible to users who never clicked it; it matters because the alternative is a 404 from a high-traffic chrome surface.

**Why this priority**: Pure plumbing. It is independent of the Pricing and FAQ pages themselves, ships in the same slice for cohesion, and is the smallest possible change to the slice-005 footer (one href). Could in principle ship in a later micro-slice without blocking US1/US2.

**Independent Test**: From any page that renders the slice-005 footer (e.g., `/`), click the "Help center" link in the Resources column and confirm it navigates to `/faq`.

**Acceptance Scenarios**:

1. **Given** the slice-005 site footer, **When** the "Resources → Help center" link is inspected, **Then** its target is `/faq` (no longer `/help`).
2. **Given** a click on that link from the landing page, **When** navigation completes, **Then** the visitor lands on the FAQ page rendered by `/faq`.

---

### Edge Cases

- **Toggle state across refresh**: the billing toggle does not persist across page loads; reloading `/pricing` resets to the default Monthly state (consistent with the project rule against client-side storage).
- **No persistence across navigation**: navigating away from `/pricing` and back resets the toggle to Monthly — by design, no URL state, no cookie, no localStorage.
- **Reduced motion**: the scroll-spy rail's click-to-scroll behavior becomes instant when `prefers-reduced-motion` is set; the accordion's expand/collapse motion follows the same rule per the design-system motion policy.
- **All accordion items closed**: after the visitor closes the default-open item, the right column can render with zero items expanded; the scroll-spy rail still tracks the topmost visible item's section and highlights it.
- **Narrow widths on FAQ**: the left rail collapses to a mobile-appropriate pattern (e.g., a section header above the accordion, a select dropdown) so the visitor never sees a sticky rail competing with a narrow accordion column.
- **Section with no visible item** in the viewport: if the visitor is between two sections (e.g., the last item of "Pricing" has just scrolled off and the first item of "Data sources" is below the fold), the rail's active state stays on the last-confirmed section until a new section's first item enters; no flicker, no "no-section" intermediate state.
- **Annual price rounds to the same dollar as Monthly** (would never happen at the published prices, but the math contract should be defined): the figure is still shown with the "billed annually" caption — the caption is the toggle-state signal, not the figure.
- **Long FAQ answer**: the accordion body wraps and reflows; the scroll-spy continues to track the question (the item's anchor row), not the body.
- **Out-of-scope-known-404 CTAs**: `/contact` returns 404 until slice 2.3 ships; this is documented and is not a 2.2 defect (see Assumptions). All four CTAs that target `/contact` (Pricing Enterprise card, FAQ rail "Contact support →", FAQ bottom CTA "Open a ticket →", and any other) hit the same 404 surface until then.
- **Open Graph image**: the slice-005 OG image is reused unchanged for both pages; no per-page OG raster is authored this slice.

## Requirements *(mandatory)*

### Functional Requirements

**Pricing page (US1)**

- **FR-001**: The route at `/pricing` MUST be replaced wholesale; the slice-005 soft-404 "Coming in v0.2.2" stub MUST NOT remain. The Pricing page MUST render seven sections in order — top nav (reused from slice 005), centered hero, centered Monthly/Annual segmented toggle, three tier cards in a row, "Compare in detail" 9-row table, Enterprise card, site footer (reused from slice 005) — matching `design/Public_pages.pdf` page 3 within a 4px tolerance per section.
- **FR-002**: The **Pricing hero** MUST contain a centered eyebrow "PRICING", the serif display headline "Pricing that scales with discovery.", and the subhead "Cancel any time. No usage gotchas. Annual saves 30%."
- **FR-003**: The **billing toggle** MUST be a segmented Monthly/Annual control, centered beneath the hero, with a small "-30%" badge on the Annual pill. It MUST default to Monthly on every page load (no persistence — no cookie, no client-side storage, no URL parameter). It MUST be operable with arrow keys (radiogroup pattern: Left/Right move focus and selection between the two options), reachable by Tab, and carry a visible focus ring at every step.
- **FR-004**: The three **tier cards** MUST appear in a row (Starter, Pro, Team in that order). The Pro card MUST carry a "Most popular" tag and a primary CTA in the brand orange filled style; Starter and Team MUST carry outline-style CTAs. Each card MUST contain an eyebrow (tier name), a price (responsive to the toggle — see FR-005), a tagline, the CTA button, and the tier's feature list. The three CTAs target: Starter → `/signup`, Pro ("Start Pro trial") → `/signup`, Team → `/signup` (all three resolve to the existing slice-005 stub).
- **FR-005**: **Annual pricing math** — the displayed Annual price for each tier MUST be `monthly_base × 0.7` rounded to the nearest dollar, suffixed with "/month", and accompanied by a small "billed annually" caption beneath the price. The Monthly state MUST display the undiscounted monthly figure with the "/month" suffix and NO caption. Base monthly prices: Starter $29, Pro $79, Team $199.
- **FR-006**: The **"Compare in detail" table** MUST contain exactly the nine rows below, in this order, with a row-header column on the left and three tier columns (Starter / Pro / Team) on the right; the Pro column header MUST use the accent color per the design; absent features MUST be rendered as the em-dash character "—"; present features MUST be rendered with a checkmark icon (the project's locked icon set, 1.5px stroke):

  | Row | Starter | Pro | Team |
  |---|---|---|---|
  | Tracked categories | 5 | Unlimited | Unlimited |
  | Saved problems | 50 | Unlimited | Unlimited |
  | Alert delivery | Daily email | Email · in-app · API | Email · Slack · webhook |
  | Comparison view | — | Up to 4 | Up to 4 |
  | API access | — | 50k req/mo | 200k req/mo |
  | Team seats | 1 | 1 | 5 included |
  | Shared collections | — | — | ✓ |
  | SSO | — | — | ✓ |
  | Support | Community | Priority email | Dedicated CSM |

- **FR-007**: The **Enterprise card** at the bottom of the Pricing page MUST contain the eyebrow "ENTERPRISE", the serif headline "Need custom seats, on-prem ingestion, or category requests?", the subhead "Talk to us about a private dataset, SLA, and procurement-friendly invoicing.", and an outline-style "Contact sales →" CTA targeting `/contact`. `/contact` is a documented out-of-scope-known-404 until slice 2.3 ships.

**FAQ page (US2)**

- **FR-008**: A new route at `/faq` MUST be added (no prior placeholder exists). It MUST render seven elements in order — top nav (reused), left-aligned hero, two-column body (sticky left rail with five sections + "STILL STUCK?" card; right column 12-item accordion), bottom CTA box, site footer (reused) — matching `design/Public_pages.pdf` page 4 within a 4px tolerance per section.
- **FR-009**: The **FAQ hero** MUST contain a left-aligned eyebrow "SUPPORT" in the accent color, the serif headline "Frequently asked questions", and the subhead "If you do not find your answer here, email support@bristle.dev. We respond within one business day."
- **FR-010**: The **FAQ accordion** MUST contain exactly twelve question/answer pairs in the order listed in FR-011 below. It MUST operate in **single-expansion mode** (at most one item open at a time; opening one closes the previously open one). It MUST be reachable and operable by keyboard: focus moves with Tab, items activate on Enter or Space, ESC collapses the currently open item. Focus rings MUST be visible at every step. On first page load, exactly one item — "Where does Bristle get its data?" — MUST be open by default with the verbatim answer specified in FR-012.
- **FR-011**: The **twelve FAQ questions**, in PDF order, each tagged with a section, are:

  1. *Where does Bristle get its data?* — Data sources
  2. *Is reading App Store reviews legal?* — Data sources
  3. *Can I cancel any time?* — Cancellation
  4. *What about GDPR?* — Privacy
  5. *Do you offer a refund?* — Pricing
  6. *How fresh is the data?* — Data sources
  7. *Does the API include synthesis text?* — API
  8. *Is there a free tier?* — Pricing
  9. *Can I request a new category?* — API
  10. *How do you cluster duplicates?* — Data sources
  11. *Will I see clusters from my own GitHub issues?* — Privacy
  12. *Can I export data?* — API

  Each accordion item MUST carry a stable section identifier matching one of the five rail sections (Pricing / Data sources / Privacy / Cancellation / API) so the scroll-spy rail can correlate visible items to sections.
- **FR-012**: The default-open answer to "Where does Bristle get its data?" MUST be the verbatim text: *"We ingest from six public sources via official APIs and approved scrapers: GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We never use private channels or content behind authentication walls."* The other eleven answers MUST exist, be 1–3 sentences each, and follow the project voice rules: plain-spoken, technical, no exclamation marks, no emoji, no "amazing/awesome" register.
- **FR-012a**: For the eleven implementor-authored answers, any answer that asserts a **specific commercial-policy claim** MUST be surfaced in the implementing pull request's description under a heading titled exactly `Policy claims needing founder sign-off`, listed item-by-item with the claim quoted, so the founder can confirm or revise before the PR merges. The claim categories that trigger this gate are: refund window (e.g. "30-day refund"), exact polling/refresh cadence (e.g. "every 4 hours"), SLA on category requests (e.g. "new categories live within 14 days"), data-retention windows (e.g. "we retain raw mentions for 90 days"), region or data-residency specifics (e.g. "EU-hosted Postgres"), and free-tier rules (e.g. "free read-only access for solo accounts"). Facts already established elsewhere in the project — the 7-day Pro trial, the six-source list, "Cancel any time" — MAY be referenced as-is and do NOT trigger the gate. The PR section MAY be empty (a literal "None this PR." line) if no eleven-answer text contains a triggering claim; the heading is still required so reviewers can see the implementor consciously checked.
- **FR-013**: The **scroll-spy rail** MUST list the five sections (Pricing / Data sources / Privacy / Cancellation / API) in the order shown in the design. As the visitor scrolls the accordion, the rail's active state MUST update to the section of the topmost visible accordion item. Clicking a rail item MUST smooth-scroll the page to the first accordion item of that section; when `prefers-reduced-motion` is set, the scroll MUST be instant (no animation). The active rail item MUST render with the vertical accent bar on its left edge per the design. The rail's update mechanism MUST be IntersectionObserver-based; no scroll-position polling, and no new top-level dependency.
- **FR-014**: The **"STILL STUCK?" card** below the rail MUST contain the eyebrow "STILL STUCK?", the line "Email gets answered. Promise.", and a "Contact support →" button targeting `/contact` (out-of-scope-known-404). This card MUST be a static element below the rail; it MUST NOT participate in the scroll-spy.
- **FR-015**: The **bottom CTA box** MUST contain the eyebrow "STILL DIDN'T FIND IT?", the headline "Email a human at support@bristle.dev." with the address rendered as a `mailto:support@bristle.dev` link, supportive microcopy, and an "Open a ticket →" button targeting `/contact` (out-of-scope-known-404).

**Footer link repoint (US4)**

- **FR-016**: The slice-005 footer's `Resources → Help center` link target MUST be changed from `/help` to `/faq`. No other footer change ships in this slice; the literal "v0.2.0 · status: operational" string and the disabled newsletter stub remain unchanged.

**Cross-cutting (US3)**

- **FR-017**: Each new page MUST emit a page-level title and meta description, plus `og:title` and `og:description` matching the page. Both pages MUST reuse the slice-005 OG image at the canonical origin (`https://bristle.vercel.app/og-image.png`) — no new OG raster is authored this slice. **Neither page** sets `robots: noindex` (these are launched, indexable pages, unlike the slice-005 placeholders). Title strings: "Pricing — Bristle" and "FAQ — Bristle".
- **FR-018**: All tokens (color, type, spacing, radii, motion) in the new files MUST resolve through the design tokens. Every new file (Pricing route, FAQ route, billing toggle, tier card(s), FAQ accordion, scroll-spy rail) MUST contain zero hardcoded hex color literals and zero hardcoded font-family strings. Functional icons (the compare table's checkmarks and any other glyph) MUST use the project's locked icon set at the documented 1.5px stroke.
- **FR-019**: All copy on both pages MUST follow the voice rules — no exclamation marks, no emoji, no "amazing/awesome" register. (The design's "STILL STUCK? Email gets answered. Promise." copy passes — no exclamation marks, no banned words.)
- **FR-020**: Both pages MUST render correctly in Editorial Light with no document-root theme marker set. **next-themes integration, the theme toggle UI, and Editorial Dark on either page are all out of scope this slice** and remain deferred (see Clarifications for the proposed landing slice).
- **FR-021**: The route files for `/pricing` and `/faq` MUST be async Server Components. Only the three interactive components — the billing toggle, the FAQ accordion, and the scroll-spy rail — carry the client directive.
- **FR-022**: This slice is **additive only**. The slice-005 top nav, the slice-005 site footer's structure (everything except the single href change in FR-016), the canonical full problem card, the compact problem card, the design tokens, and the database query helpers MUST NOT be modified.
- **FR-023**: **No new top-level dependency** MUST be added except the Radix accordion primitive package if it is not already present in the UI package's dependency graph (it should be — the project's locked stack pins Radix primitives — but the specific package is added if missing). The scroll-spy MUST be built on the platform's IntersectionObserver, not on a new library.
- **FR-024**: Type-check, lint, and a production build of the web app MUST all succeed with no errors.

### Key Entities *(include if feature involves data)*

This slice introduces **no database schema changes** and **no new query helpers**. All Pricing and FAQ content is statically authored in the codebase (tier metadata, FAQ questions/answers, compare-table rows). The following are content-shape entities — what each component receives — not persisted records:

- **Tier**: shape consumed by each tier card — `{ name, eyebrow, priceMonthlyUsd, tagline, ctaLabel, ctaHref, featureBullets, highlighted?: boolean }`. Three instances ship: Starter (29, outline, → `/signup`), Pro (79, filled, "Most popular", → `/signup`), Team (199, outline, → `/signup`). The displayed price is derived from `priceMonthlyUsd` and the billing-mode state per FR-005.
- **Compare row**: shape consumed by the table — `{ label, starter, pro, team }` where each tier cell is either a short string or a "checkmark" sentinel (rendered with the icon per FR-006). Nine instances per FR-006.
- **FAQ item**: shape consumed by the accordion — `{ id, question, answer, section }` where `section` is one of the five rail enum values (`pricing` | `data-sources` | `privacy` | `cancellation` | `api`). Twelve instances per FR-011; one has the verbatim answer from FR-012, eleven are authored to voice.
- **Rail section**: shape consumed by the rail — `{ id, label }`. Five instances per the design.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a local production build, `/pricing` renders the full Pricing page; a 4px-tolerance visual comparison against `design/Public_pages.pdf` page 3 passes for hero, toggle, three tier cards (Pro highlighted with "Most popular" tag), 9-row compare table, Enterprise card, and footer. *(AC US1-1, US1-7)*
- **SC-002**: On a local production build, `/faq` renders the full FAQ page; a 4px-tolerance visual comparison against `design/Public_pages.pdf` page 4 passes for hero, left-rail (with the five sections and the "STILL STUCK?" card), the 12-item accordion (with "Where does Bristle get its data?" open by default), bottom CTA box, and footer. *(AC US2-1, US2-7)*
- **SC-003**: The billing toggle switches between Monthly and Annual; all three tier prices update together; the Annual state shows the discounted per-month figure (`monthly × 0.7`, rounded to nearest dollar) with a "billed annually" caption; the Monthly state shows the undiscounted figure with no caption. Default state on every fresh page load is Monthly. *(AC US1-2)*
- **SC-004**: The billing toggle is reachable by Tab and operable with arrow keys per the radiogroup pattern; the focus ring is visible at every step. *(AC US1-3)*
- **SC-005**: The FAQ accordion expands and collapses on click, Enter, and Space; only one item is open at a time; ESC collapses the currently open item; the focus ring is visible at every step. *(AC US2-3)*
- **SC-006**: The scroll-spy rail's active state matches the section of the topmost visible accordion item as the visitor scrolls the accordion; clicking a rail item smooth-scrolls to that section's first accordion item; with `prefers-reduced-motion` set, the scroll becomes instant. *(AC US2-4)*
- **SC-007**: `/pricing` and `/faq` are responsive at 320, 375, 768, 1024, 1280, and 1440 widths with no horizontal scroll, no overlapping content, and no clipped text. On mobile, the Pricing tier cards stack and the FAQ left rail collapses to a mobile-appropriate pattern (section header above the accordion, dropdown, or equivalent). *(AC US3-3)*
- **SC-008**: The slice-005 footer's `Resources → Help center` link targets `/faq`; clicking it from any page that renders the footer navigates to the FAQ page. *(AC US4-1, US4-2)*
- **SC-009**: `/pricing` and `/faq` each emit a page-level title (`Pricing — Bristle`, `FAQ — Bristle`), a meta description, `og:title`, and `og:description`; neither sets `robots: noindex`; both reference the slice-005 OG image at the canonical origin. *(AC US3-4)*
- **SC-010**: The nine compare-table rows match FR-006 exactly: values, ordering, tier-column headers (Starter / Pro / Team), em-dashes for absent features, checkmark icons for present features. The Pro column header uses the accent color. *(AC US1-4)*
- **SC-011**: The "Where does Bristle get its data?" answer matches FR-012 verbatim. The other eleven answers exist, are 1–3 sentences each, and contain no exclamation marks, no emoji, and no "amazing/awesome" register.
- **SC-011a**: The implementing pull request's description contains a `Policy claims needing founder sign-off` heading per FR-012a. The section is either populated (each claim quoted and tied to its FAQ item) or contains the literal "None this PR." — never absent.
- **SC-012**: Every CTA button on both pages has the documented link target — Start Pro trial → `/signup`, Choose Starter → `/signup`, Choose Team → `/signup`, Enterprise Contact sales → `/contact`, FAQ rail Contact support → `/contact`, FAQ bottom CTA Open a ticket → `/contact`, and the bottom-CTA email link uses `mailto:support@bristle.dev`. `/contact` is the documented out-of-scope-known-404 until slice 2.3.
- **SC-013**: Type-check, lint, and the web production build each complete with success and no errors. *(AC FR-024)*
- **SC-014**: The initial script payload for `/pricing` and for `/faq` is each under 180 KB compressed. *(AC US3-2)*
- **SC-015**: A production-build audit of `/pricing` and of `/faq` each scores at least 90 for Performance, Accessibility, Best Practices, and SEO. *(AC US3-1)*
- **SC-016**: The deployed preview renders both pages identically to local within the 4px tolerance and produces no browser-console errors.
- **SC-017**: All new files (the two route files, the billing toggle, the tier card(s), the FAQ accordion, the scroll-spy rail, and any colocated subcomponents) contain zero hardcoded hex color literals and zero hardcoded font-family strings. *(AC FR-018)*
- **SC-018**: No new top-level dependency is added other than the Radix accordion primitive package if it was not already present in the UI package's dependency graph. *(AC FR-023)*
- **SC-019**: The two route files are async Server Components; only the billing toggle, the FAQ accordion, and the scroll-spy rail carry the client directive. *(AC FR-021)*
- **SC-020**: No exclamation marks, no emoji, and no "amazing/awesome" register appear anywhere in the new files (verified by grep against the new files added this slice). *(AC FR-019)*
- **SC-021**: The slice-005 top nav, the slice-005 site footer (everything except the single `Help center` href in FR-016), the canonical full problem card, the compact problem card, the design tokens, and the database query helpers remain unmodified. *(AC FR-022)*

## Assumptions

- **Slice numbering**: this is slice **006** (001 walking skeleton, 002 Spec Kit wiring, 003 design tokens + card, 004 persistence, 005 landing page). The build plan labels it "Slice 2.2".
- **Page count this slice**: **two** new pages (`/pricing` rewritten, `/faq` brand-new). The Tier 2 public surface goes from 2/5 (landing + four soft-404 stubs) to 4/5 (landing + Pricing + FAQ + two remaining soft-404 stubs for `/about` and `/blog` and `/changelog`).
- **Annual pricing display (resolved per FR-005)**: monthly-equivalent figure (rounded to nearest dollar) plus a small "billed annually" caption — NOT a yearly total. Rationale: matches the design pattern visible on page 3 and matches the segmented control's per-month price column. Open for confirmation, see Clarifications (a).
- **FAQ answer authorship (resolved)**: the one verbatim answer is locked by FR-012. The other eleven are drafted by the implementor in voice; per FR-012a, any answer that asserts a specific commercial-policy claim (refund window, polling cadence, category-request SLA, retention window, data residency, free-tier rules) MUST be surfaced in the PR description under `Policy claims needing founder sign-off` for explicit confirmation before merge. Facts already established (7-day Pro trial, six-source list, "Cancel any time") are exempt.
- **FAQ section mapping**: the 12-question → 5-section mapping in FR-011 is taken as authoritative from the user's brief. "How do you cluster duplicates?" could arguably live in a Methodology section, but no Methodology rail exists in the design, so it lives in Data sources. Open for confirmation, see Clarifications (c).
- **next-themes deferral**: theme switching is re-deferred per the user's recommendation. This slice ships Editorial Light only on both pages. Open for confirmation of the **target** slice (2.6 problem detail vs 2.7 final tier wire-up), see Clarifications (d).
- **Mobile left-rail pattern**: the responsive collapse pattern for the FAQ left rail (section header above accordion, select dropdown, or equivalent) is implementor's choice within the responsive floor in SC-007. The pattern picked at plan time is documented in the plan, not the spec. Open for confirmation if the user wants to pin it now — see Clarifications (e).
- **Reused chrome**: the slice-005 top nav and site footer are imported and rendered as-is on both pages. The single change is `Resources → Help center` `href` from `/help` to `/faq` (FR-016). The disabled newsletter stub, the literal "v0.2.0 · status: operational", and every other footer column remain unchanged.
- **Indexability**: unlike the slice-005 placeholder stubs (which set `robots: noindex`), `/pricing` and `/faq` are launched pages and MUST be indexable. No `robots` directive is set on either.
- **OG image**: the slice-005 raster at `https://bristle.vercel.app/og-image.png` is reused on both pages. No new image is authored. Per-page `og:title` and `og:description` differ between Pricing and FAQ; the image does not.
- **Out-of-scope-known-404s** (Tier 2 chrome still points at these; not 2.2 defects):
  - `/contact` — referenced by the Enterprise card's "Contact sales →", the FAQ rail's "Contact support →", and the FAQ bottom CTA's "Open a ticket →". Becomes real in slice 2.3.
  - `/about`, `/blog`, `/changelog` — slice-005 stubs remain (the corresponding rewrites land in slices 2.3, 2.4, 2.5).
  - `/login`, `/signup` — slice-005 stubs remain (Tier 3 overwrites them).
  - `/library`, `/problems/{slug}`, `/roadmap`, `/press`, `/docs`, `/api`, `/status`, `/terms`, `/privacy`, `/security`, `/gdpr` — same documented set as slice 005; unchanged by this slice. (`/help` exits the list — repointed to `/faq` per FR-016.)
- **No new icon files or hosted images**: the compare-table checkmark uses the project's locked icon set; the FAQ chevron uses the same set; no per-page raster, no logo file, no third-party-hosted image.
- **Voice authority**: copy is taken from the design page where shown (Pricing headlines, FAQ hero, the one verbatim FAQ answer) and written in the project voice elsewhere; exact wording for any copy not legible in the design is drafted to match the voice and confirmed against the design at the visual gate.
- **No request-time data reads**: both pages are content-static this slice — no DB fetches, no API calls, no per-request rendering required. They can in principle be statically prerendered at build; the implementation choice (static vs dynamic) is the plan's call, not the spec's.

## Clarifications

All five open questions surfaced before `/speckit.plan` were resolved by the user on 2026-05-23 and folded into the requirements above:

- **(a) Annual pricing display format → monthly-equivalent + "billed annually" caption** (the default), not yearly total. (FR-005, SC-003.)
- **(b) The 11 unauthored FAQ answers → implementor-drafts in voice, reviewed at PR time, with the policy-claims gate.** Added as FR-012a / SC-011a: any answer asserting a specific commercial-policy claim (refund window, polling cadence, category-request SLA, retention window, data residency, free-tier rules) MUST appear in the PR description under a `Policy claims needing founder sign-off` heading. Pre-established facts (7-day Pro trial, six-source list, "Cancel any time") are exempt. (FR-012, FR-012a, SC-011, SC-011a.)
- **(c) FAQ section categorization → mapping as listed in FR-011** (no sixth Methodology section; "How do you cluster duplicates?" stays under Data sources). (FR-011, FR-013.)
- **(d) next-themes target slice → defer to slice 2.6** (Public sample problem detail — the long-read where Editorial Dark has the strongest reader-facing case). (FR-020.)
- **(e) Mobile left-rail pattern for FAQ → pinned at plan time**, not in the spec. The plan picks one of: static section header above the accordion, `<select>` dropdown, or horizontally scrollable section row. (SC-007 only; no FR change.)

### Planning readiness

All clarifications resolved; no outstanding decisions. The spec is ready for `/speckit.plan`.
