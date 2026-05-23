# Tasks: Pricing + FAQ

**Input**: `spec.md` + `plan.md` + `research.md` + `data-model.md` + `contracts/` in `specs/006-pricing-and-faq/`
**Branch**: `006-pricing-and-faq`
**Tests**: none added this slice (no Vitest/Playwright wired yet; same as slice 005). Verification is the gate phase — typecheck/lint/build, per-route Lighthouse (prod build), responsive sweep, keyboard semantics walk on the three interactive components, hex/font/voice greps, per-CTA href check, per-page metadata check, `pnpm why @radix-ui/react-*` audit, the **FR-012a policy-claims review-surface check**, and a **human visual-diff vs `design/Public_pages.pdf` p.3 + p.4** (acceptance-criteria, **not** an automated test).

## Conventions

- **One commit per task.** Each task lists a suggested commit message; verification/deploy gates produce no commit.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (Pricing page renders + converts), US2 (FAQ page renders + answers), US3 (perf/a11y/SEO floors), US4 (footer Help-center repoint), or SETUP.
- Every task has a **Verify** line — the objective check before committing.
- **Batching**: four batches, each ending in **one STOP** for review (per slice-005 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (already done)**: PR #4 (slice 005) merged to `main` on 2026-05-23; `006-pricing-and-faq` rebased onto `origin/main` (`543fb88`). Branch is 2 commits ahead of clean main. **Additive-only**: `ProblemCardFull`, `ProblemCardCompact`, design tokens, and `@bristle/db` query helpers are NOT modified (§9 + FR-022).
- **Boundary reminder**: `page.tsx` files for both routes are async Server Components (no `"use client"`); only `pricing/billing-section.tsx` + `pricing/billing-toggle.tsx` + `faq/accordion.tsx` + `faq/scroll-spy-rail.tsx` carry the client directive (plan §2).

---

## Batch A — content data + dep + footer flip  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] Add `@radix-ui/react-accordion` dependency to `@bristle/ui`
Edit `packages/ui/package.json` to add `"@radix-ui/react-accordion": "^1.2.0"` (or current 1.x) to `dependencies`. Run `pnpm install` to update `pnpm-lock.yaml`. The package travels with `@bristle/ui` so future Tier 3+ consumers inherit it.
- **Files**: `packages/ui/package.json`, `pnpm-lock.yaml`
- **Depends on**: —
- **Verify**: `pnpm --filter @bristle/ui typecheck` exits 0; `pnpm why @radix-ui/react-accordion` shows the package + its actual transitive deps only (`react-collapsible`, `primitive`, `compose-refs`, etc.) — no unused Radix peers (`react-dialog`, `react-popover`, etc.).
- **Commit**: `chore(ui): add @radix-ui/react-accordion dependency`

### T002 · [P] [US1] `tier-data.ts` (3 Tier constants)
Create `apps/web/src/components/pricing/tier-data.ts` exporting `interface Tier`, `type TierCtaVariant`, and `TIERS: readonly Tier[]` with the three instances from `data-model.md` (Starter $29 / Pro $79 highlighted / Team $199; per-tier eyebrow + tagline + ctaLabel ("Choose Starter" / "Start Pro trial" / "Choose Team") + ctaHref `/signup` + ctaVariant + isMostPopular + features bullets per the PDF).
- **Files**: `apps/web/src/components/pricing/tier-data.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `TIERS.length === 3`; Pro is the only `isMostPopular: true`; Pro is the only `ctaVariant: "primary"`; `monthlyPriceUsd` values are 29 / 79 / 199.
- **Commit**: `feat(web): add Pricing tier-data with three TIERS`

### T003 · [P] [US1] `compare-data.ts` (9 CompareRow constants)
Create `apps/web/src/components/pricing/compare-data.ts` exporting `type CompareCell = string | { kind: "check" } | { kind: "dash" }`, `interface CompareRow`, and `COMPARE_ROWS: readonly CompareRow[]` with the nine rows from spec FR-006 / `data-model.md`, in exact order with exact values.
- **Files**: `apps/web/src/components/pricing/compare-data.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `COMPARE_ROWS.length === 9`; row labels in FR-006 order; rows 7–8 (Shared collections / SSO) have Team cell `{ kind: "check" }`; rows 4–5 (Comparison view / API access) have Starter cell `{ kind: "dash" }`.
- **Commit**: `feat(web): add Pricing compare-data with 9 COMPARE_ROWS`

### T004 · [P] [US2] `faq-data.ts` (12 FaqItem constants + FR-012a header)
Create `apps/web/src/components/faq/faq-data.ts` exporting `type FaqSection`, `interface FaqItem`, and `FAQ_ITEMS: readonly FaqItem[]` with the twelve items from spec FR-011 / `data-model.md`, in PDF order, each with stable id `faq-q-1`…`faq-q-12`. **`faq-q-1` answer MUST match FR-012 verbatim — character-diff against the spec before committing** (no smart quotes, no paraphrase). The other eleven answers are implementor-authored to voice (§6: no exclamation, no emoji, no "amazing/awesome", 1–3 sentences each). The file MUST begin with the `Policy claims needing founder sign-off (FR-012a)` comment block listing any triggered items (or `None this PR.`) — mirror this list into the eventual PR description under the same heading.
- **Files**: `apps/web/src/components/faq/faq-data.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; `FAQ_ITEMS.length === 12`; ids `faq-q-1`…`faq-q-12` in PDF order; `faq-q-1.answer` is the FR-012 verbatim text character-for-character; file header contains `Policy claims needing founder sign-off (FR-012a):` line with either bullets or `None this PR.`; voice grep on the file → no `!`, no emoji, no "amazing"/"awesome".
- **Commit**: `feat(web): add FAQ faq-data with 12 items (faq-q-1 verbatim + FR-012a header)`

### T005 · [P] [US4] Footer `Help center` href flip `/help` → `/faq`
Edit `apps/web/src/components/landing/site-footer.tsx` line 27: change `href: "/help"` to `href: "/faq"`. Per plan decision §11: explicitly mandated by FR-016; an href-value change, not a structural change; own-commit for reviewability.
- **Files**: `apps/web/src/components/landing/site-footer.tsx`
- **Depends on**: —
- **Verify**: `grep -n "Help center" apps/web/src/components/landing/site-footer.tsx` → the line's href is `/faq` (not `/help`); no other line changed.
- **Commit**: `fix(web): repoint footer Help center /help → /faq (FR-016)`

### T006 · [SETUP] VERIFY — content data + dep + footer (gate)
Run the Batch A verification checks.
- **Depends on**: T001, T002, T003, T004, T005
- **Verify**: `pnpm typecheck && pnpm --filter @bristle/ui typecheck` exit 0; `pnpm why @radix-ui/react-accordion` lists only accordion's actual transitive deps (no `react-dialog`/`react-popover`/etc.); `TIERS.length === 3` and `COMPARE_ROWS.length === 9` and `FAQ_ITEMS.length === 12`; `faq-data.ts` has the FR-012a comment header and the `faq-q-1` verbatim answer matches FR-012; footer Help-center href is `/faq`.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing check.

**▸ STOP 1** — foundations ready: Radix dep installed, three content data files, footer href repointed.

---

## Batch B — client primitives  ▸ STOP 2

### Phase 3: User Story 1 / 2 (interactive primitives)

### T007 · [P] [US1] `PricingBillingToggle` component (client)
Create `apps/web/src/components/pricing/billing-toggle.tsx` — client component with `"use client"`. Props: `{ value: "monthly" | "annual"; onChange: (next: "monthly" | "annual") => void }`. Renders a segmented `role="radiogroup"` with two `role="radio"` buttons (Monthly + Annual); the Annual button carries a "-30%" badge per the PDF. Keyboard: Tab to focus the group, Left/Right arrows move focus AND selection (radiogroup pattern), Home/End jump to first/last, Enter/Space activate. Focus ring visible (2px `accent/bristle` per §5). Zero hex literals, zero font-family literals.
- **Files**: `apps/web/src/components/pricing/billing-toggle.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file has `"use client"`; `grep -E "#[0-9A-Fa-f]{3,8}"` → none; renders two `role="radio"` elements + `role="radiogroup"`; the "-30%" badge text is present on the Annual pill.
- **Commit**: `feat(web): add PricingBillingToggle (radiogroup with -30% badge)`

### T008 · [P] [US2] `FaqAccordion` component (client, Radix-based)
Create `apps/web/src/components/faq/accordion.tsx` — client component with `"use client"`. Uses `@radix-ui/react-accordion` (`Accordion.Root` type="single" collapsible defaultValue="faq-q-1"). Maps `FAQ_ITEMS` from `faq-data.ts`; each `<Accordion.Item value="faq-q-{N}" data-section="{section}" data-faq-item id="faq-q-{N}">` carries the three attributes the scroll-spy reads. Trigger uses lucide-react `ChevronDown` at `stroke-[1.5]`, rotated 180° via `data-state="open"`. Question in `font-sans text-body-md text-text-primary`; answer body in `font-serif text-body-md text-text-secondary` (matches the design's editorial reading register). Wrap `Accordion.Root` with an `onKeyDown` handler that calls `setValue("")` when the key is `Escape` (Radix doesn't ship ESC-close by default — adds the FR-010 behavior in ~5 lines). Single open item at a time; focus ring visible.
- **Files**: `apps/web/src/components/faq/accordion.tsx`
- **Depends on**: T001 (Radix dep), T004 (FAQ_ITEMS)
- **Verify**: `pnpm --filter web typecheck` exits 0; file has `"use client"`; imports `* as Accordion from "@radix-ui/react-accordion"` (or named members); renders 12 `Accordion.Item` elements with `value="faq-q-{N}"` + `data-section="…"` + `data-faq-item` + `id="faq-q-{N}"`; `defaultValue="faq-q-1"`; `onKeyDown` on Root handles Escape → setValue(""); lucide `ChevronDown` imported by name with `stroke-[1.5]`.
- **Commit**: `feat(web): add FaqAccordion (Radix single-expansion + ESC-close)`

### T009 · [P] [US2] `FaqScrollSpyRail` component (client, IntersectionObserver)
Create `apps/web/src/components/faq/scroll-spy-rail.tsx` — client component with `"use client"`. Defines `SECTIONS = [{id:"pricing",label:"Pricing"}, {id:"data-sources",label:"Data sources"}, {id:"privacy",label:"Privacy"}, {id:"cancellation",label:"Cancellation"}, {id:"api",label:"API"}]` (initial `active = "data-sources"` so the pill matches the default-open `faq-q-1`). `useEffect` sets up an `IntersectionObserver` on `document.querySelectorAll("[data-faq-item]")` with `rootMargin: "-80px 0px -55% 0px"`, `threshold: 0`; tracks intersecting items' `boundingClientRect.top` in a ref `Map<itemId, topY>`; picks the topmost (smallest `topY`) visible item and reads its `dataset.section` to set `active`; when nothing intersects, keeps previous `active` (no flicker). Click handler: read `prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches`, call `target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })`. Layout: desktop (`md+`) sticky vertical rail with active section showing the left vertical accent bar; mobile (`<md`) horizontal pill row with `role="tablist"` + pill `role="tab" aria-selected={active === id}`, `flex overflow-x-auto snap-x`; when `active` changes the active pill auto-scrolls into view via `pill.scrollIntoView({ inline: "center", block: "nearest", behavior: prefersReducedMotion ? "auto" : "smooth" })`. Zero hex literals, zero font-family literals.
- **Files**: `apps/web/src/components/faq/scroll-spy-rail.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; file has `"use client"`; renders 5 section pills/links; observer config matches `rootMargin: "-80px 0px -55% 0px"` + `threshold: 0`; click handler reads `prefers-reduced-motion`; mobile layout uses `role="tablist"` + per-pill `role="tab"` + `aria-selected`; auto-scroll-into-view of active pill keyed off the same reduced-motion flag.
- **Commit**: `feat(web): add FaqScrollSpyRail (IO + mobile pill row + reduced-motion)`

**▸ STOP 2** — three client primitives done: toggle, accordion, scroll-spy rail. Each typechecks in isolation.

---

## Batch C — server components + page composition  ▸ STOP 3

### Phase 4: User Story 1 (pricing sections + route) + User Story 2 (faq sections + route)

### T010 · [P] [US1] `PricingHero` section (server)
Create `apps/web/src/components/pricing/hero.tsx` — async Server Component. Centered hero: eyebrow `PRICING` (`text-body-sm font-medium uppercase tracking-wide text-text-secondary`), serif display headline "Pricing that scales with discovery." (`font-serif text-display-lg text-text-primary`), subhead "Cancel any time. No usage gotchas. Annual saves 30%." (`font-sans text-body-lg text-text-secondary`). Zero hex literals, zero font-family literals.
- **Files**: `apps/web/src/components/pricing/hero.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; `grep -E "#[0-9A-Fa-f]{3,8}"` → none; contains the three exact strings ("PRICING", "Pricing that scales with discovery.", "Cancel any time. No usage gotchas. Annual saves 30.").
- **Commit**: `feat(web): add PricingHero`

### T011 · [P] [US1] `TierCard` component (server, billingMode-aware price)
Create `apps/web/src/components/pricing/tier-card.tsx` — async Server Component. Props: `{ tier: Tier; billingMode: "monthly" | "annual" }`. Layout: card with category-pill-style eyebrow (top-left), optional "Most popular" tag on the right when `tier.isMostPopular`, large price = `${displayedMonthly}` + `/month` suffix where `displayedMonthly = billingMode === "annual" ? Math.round(tier.monthlyPriceUsd * 0.7) : tier.monthlyPriceUsd`, **"billed annually" caption beneath the price in annual mode only**, tagline, features bullet list, CTA `<Link href={tier.ctaHref}>` styled per `tier.ctaVariant` (primary = filled `bg-accent-bristle text-surface-card`; outline = `border border-text-primary text-text-primary`). Zero hex literals.
- **Files**: `apps/web/src/components/pricing/tier-card.tsx`
- **Depends on**: T002
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; uses `Math.round(tier.monthlyPriceUsd * 0.7)` for annual; renders "billed annually" caption iff `billingMode === "annual"`; the "Most popular" tag is rendered iff `tier.isMostPopular`; CTA href = `tier.ctaHref`; CTA classes vary by `tier.ctaVariant`; `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add TierCard (server, billingMode-aware price + caption)`

### T012 · [US1] `PricingBillingSection` wrapper (client, owns toggle state)
Create `apps/web/src/components/pricing/billing-section.tsx` — client component with `"use client"`. Owns `useState<"monthly" | "annual">("monthly")`. Renders `<PricingBillingToggle value={mode} onChange={setMode} />` followed by a `<div className="grid gap-grid md:grid-cols-3">` mapping `TIERS` to `<TierCard tier={tier} billingMode={mode} />` children. On mobile (below `md`) the three cards stack `Starter → Pro → Team`; Pro is positioned as the middle column on desktop via `order-2 md:order-none` so it visually dominates the row without dominating the mobile stack (plan risk R6).
- **Files**: `apps/web/src/components/pricing/billing-section.tsx`
- **Depends on**: T007, T011, T002
- **Verify**: `pnpm --filter web typecheck` exits 0; file has `"use client"`; owns one `useState` with initial value `"monthly"`; renders one `PricingBillingToggle` + 3 `TierCard`; the toggle's `onChange` updates state; the row uses `md:grid-cols-3` with the `order-2 md:order-none` class on Pro.
- **Commit**: `feat(web): add PricingBillingSection (client wrapper owning toggle state)`

### T013 · [P] [US1] `CompareTable` component (server)
Create `apps/web/src/components/pricing/compare-table.tsx` — async Server Component. Renders an `<h2>` "Compare in detail" eyebrow + serif heading, then a `<table>` with: header row showing Starter / **Pro** / Team where the Pro header has `text-accent-bristle`; body rows mapped from `COMPARE_ROWS`. Cell renderer: `typeof cell === "string"` → render as-is; `cell.kind === "check"` → `<Check className="size-4 stroke-[1.5]" aria-label="included" />` (lucide-react, imported by name); `cell.kind === "dash"` → em-dash character `—`. Zero hex literals.
- **Files**: `apps/web/src/components/pricing/compare-table.tsx`
- **Depends on**: T003
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; imports `Check` from `lucide-react` by name; Pro column header has `text-accent-bristle`; maps `COMPARE_ROWS` once (no inline JSX duplication); cell renderer handles all three CompareCell shapes; `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add CompareTable (9 rows from COMPARE_ROWS)`

### T014 · [P] [US1] `EnterpriseCard` section (server)
Create `apps/web/src/components/pricing/enterprise-card.tsx` — async Server Component. Eyebrow "ENTERPRISE", serif headline "Need custom seats, on-prem ingestion, or category requests?", subhead "Talk to us about a private dataset, SLA, and procurement-friendly invoicing.", outline `<Link href="/contact">Contact sales →</Link>` (out-of-scope-known-404 until slice 2.3). Zero hex literals.
- **Files**: `apps/web/src/components/pricing/enterprise-card.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains the three exact strings (ENTERPRISE / "Need custom seats…" / "Talk to us…"); CTA href is `/contact`; outline-variant classes (`border border-text-primary`); `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add EnterpriseCard (Contact sales → /contact)`

### T015 · [US1] `/pricing/page.tsx` — Server-Component route + metadata
Rewrite `apps/web/src/app/pricing/page.tsx` wholesale, removing the slice-005 `<ComingSoon version="0.2.2" />` and its `metadata.robots = { index: false, follow: false }`. New file: `async function Pricing()` Server Component composing `<TopNav /> <PricingHero /> <PricingBillingSection /> <CompareTable /> <EnterpriseCard /> <SiteFooter />` (reuses slice-005 `TopNav` + `SiteFooter` from `apps/web/src/components/landing/`). Export `metadata` per plan decision §10 / contracts: `metadataBase: new URL(SITE_URL)`, `title: "Pricing — Bristle"`, `description: "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%."`, `openGraph` with same title/description + `type: "website"` + `url: SITE_URL + "/pricing"` + `images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }]`. **No `robots` field** → indexable by default.
- **Files**: `apps/web/src/app/pricing/page.tsx`
- **Depends on**: T010, T012, T013, T014
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export is `async function`; six section components composed in order (TopNav / Hero / BillingSection / CompareTable / Enterprise / SiteFooter); metadata object has `title`, `description`, `openGraph` (with `url: SITE_URL + "/pricing"` and the absolute OG image), and **no `robots` field**; the old `ComingSoon` import + the noindex metadata are gone.
- **Commit**: `feat(web): replace /pricing stub with full Pricing page + metadata`

### T016 · [P] [US2] `FaqHero` section (server)
Create `apps/web/src/components/faq/hero.tsx` — async Server Component. Left-aligned hero: eyebrow `SUPPORT` (in `text-accent-bristle` per the PDF — the FAQ eyebrow is accent-colored, unlike Pricing's secondary-text eyebrow), serif headline "Frequently asked questions", subhead "If you do not find your answer here, email support@bristle.dev. We respond within one business day." Zero hex literals.
- **Files**: `apps/web/src/components/faq/hero.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; eyebrow has `text-accent-bristle`; contains the three exact strings ("SUPPORT", "Frequently asked questions", "If you do not find your answer here…"); `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add FaqHero (SUPPORT eyebrow in accent color)`

### T017 · [P] [US2] `StillStuckCard` (server, static below rail)
Create `apps/web/src/components/faq/still-stuck-card.tsx` — async Server Component. Static card: eyebrow "STILL STUCK?", line "Email gets answered. Promise.", outline `<Link href="/contact">Contact support →</Link>`. Does NOT participate in the scroll-spy (no `data-faq-item` attribute). Zero hex literals.
- **Files**: `apps/web/src/components/faq/still-stuck-card.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains the three exact strings; CTA href = `/contact`; no `data-faq-item` attribute anywhere in the file; `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add StillStuckCard (Contact support → /contact)`

### T018 · [US2] `FaqBody` 2-col container (server)
Create `apps/web/src/components/faq/faq-body.tsx` — async Server Component. Two-column layout container: left column (`md` only) renders `<FaqScrollSpyRail />` then `<StillStuckCard />` (rail sticky, card static below); right column renders `<FaqAccordion />`. Below `md`, the rail's mobile horizontal pill row sits above the accordion (the rail component itself handles its desktop/mobile layout switch — see T009); the StillStuck card moves to the bottom of the body on mobile (after the accordion) so it doesn't compete with the pill row for vertical space. Layout token: `grid md:grid-cols-[16rem_1fr] gap-section`.
- **Files**: `apps/web/src/components/faq/faq-body.tsx`
- **Depends on**: T008, T009, T017
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"` (a Server Component containing client children — both Accordion and ScrollSpyRail are imported and used as JSX); desktop layout uses two columns (`md:grid-cols-[…_1fr]`); mobile order is rail pills → accordion → StillStuck card (test by reading at 320 width).
- **Commit**: `feat(web): add FaqBody 2-col container (rail + accordion + still-stuck)`

### T019 · [P] [US2] `FaqBottomCta` section (server)
Create `apps/web/src/components/faq/bottom-cta.tsx` — async Server Component. Box with eyebrow "STILL DIDN'T FIND IT?", headline "Email a human at support@bristle.dev." where `support@bristle.dev` is rendered as `<a href="mailto:support@bristle.dev">`, microcopy ("We respond within one business day." or similar from PDF), outline `<Link href="/contact">Open a ticket →</Link>`. Zero hex literals.
- **Files**: `apps/web/src/components/faq/bottom-cta.tsx`
- **Depends on**: —
- **Verify**: `pnpm --filter web typecheck` exits 0; no `"use client"`; contains "STILL DIDN'T FIND IT?" + the mailto link with exact address `support@bristle.dev` + the "Open a ticket →" link with href `/contact`; `grep -E "#[0-9A-Fa-f]{3,8}"` → none.
- **Commit**: `feat(web): add FaqBottomCta (mailto + Open a ticket → /contact)`

### T020 · [US2] `/faq/page.tsx` — Server-Component route + metadata
Create `apps/web/src/app/faq/page.tsx` — brand-new route, no prior placeholder. `async function Faq()` Server Component composing `<TopNav /> <FaqHero /> <FaqBody /> <FaqBottomCta /> <SiteFooter />` (reuses slice-005 chrome). Export `metadata` per plan decision §10 / contracts: `metadataBase: new URL(SITE_URL)`, `title: "FAQ — Bristle"`, `description: "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API."`, `openGraph` with same title/description + `type: "website"` + `url: SITE_URL + "/faq"` + `images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }]`. **No `robots` field** → indexable by default.
- **Files**: `apps/web/src/app/faq/page.tsx`
- **Depends on**: T016, T018, T019
- **Verify**: `pnpm --filter web typecheck` exits 0; file has no `"use client"`; default export is `async function`; five elements composed in order (TopNav / Hero / Body / BottomCta / SiteFooter); metadata object has `title: "FAQ — Bristle"`, `description`, `openGraph.url: SITE_URL + "/faq"`, absolute OG image, and **no `robots` field**.
- **Commit**: `feat(web): add /faq route (full FAQ page + metadata)`

**▸ STOP 3** — both routes composed end-to-end with metadata; typecheck/lint pass in isolation.

---

## Batch D — gates  ▸ STOP 4

### Phase 5: User Story 3 (perf/a11y/SEO/voice floors) + verification

### T021 · [US3] VERIFY — local gate
Run the local loop and audits.
- **Depends on**: T015, T020
- **Verify**:
  - **Build**: `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0. *(SC-013)*
  - **Visual (Pricing)**: `/pricing` (prod build, `pnpm --filter web start`) renders all six sections; visual-diff vs `Public_pages.pdf` p.3 within 4px per section (hero · toggle · 3 tier cards w/ Pro highlighted + "Most popular" tag · 9-row compare table · Enterprise card · footer). *(SC-001)*
  - **Visual (FAQ)**: `/faq` renders all seven elements; visual-diff vs `Public_pages.pdf` p.4 within 4px (hero · left rail w/ 5 sections + Still-Stuck card · 12-item accordion w/ `faq-q-1` open + verbatim answer · bottom CTA · footer). *(SC-002)*
  - **Toggle**: Click and arrow-key Monthly↔Annual; all three prices update together; Annual shows Starter `$20/month`, Pro `$55/month`, Team `$139/month` with "billed annually" captions; Monthly removes captions. *(SC-003, SC-004)*
  - **Accordion**: `faq-q-1` open on first load with FR-012 verbatim answer; opening another item closes the previous (single-expansion); Enter/Space toggles; ESC closes the open one; focus ring visible. *(SC-005)*
  - **Scroll-spy**: scrolling updates the active rail item to match the topmost visible accordion question; clicking a rail item smooth-scrolls to that section; OS reduced-motion ON → scroll is instant; mobile active pill auto-scrolls into view. *(SC-006)*
  - **Responsive**: sweep at 320/375/768/1024/1280/1440 on both routes — no h-scroll/overlap/clip; Pricing tier cards stack Starter→Pro→Team below `md`; FAQ rail collapses to horizontal pill row. *(SC-007)*
  - **Footer link**: from `/`, the footer's `Resources → Help center` link `href` is `/faq` and navigates there. *(SC-008)*
  - **Metadata**: `/pricing` head has `<title>Pricing — Bristle</title>`, meta description, og:title, og:description, og:url = `https://bristle.vercel.app/pricing`, og:image = absolute slice-005 raster, **no `<meta name="robots" content="noindex">`**; same checks for `/faq` with `FAQ — Bristle`. *(SC-009)*
  - **Compare table**: nine rows in FR-006 order with exact values; Pro col header uses `text-accent-bristle`; em-dashes for absent; lucide `Check` for present. *(SC-010)*
  - **FAQ content**: `faq-q-1.answer` character-matches FR-012; the other 11 answers exist, 1–3 sentences each. *(SC-011)*
  - **FR-012a policy-claims surface**: `faq-data.ts` file header contains the `Policy claims needing founder sign-off (FR-012a):` block with either bullets or `None this PR.`. Reviewer prepares the matching PR description section before opening the PR. *(SC-011a — code-side check)*
  - **CTA hrefs**: Pricing tier CTAs all `/signup`; Enterprise `/contact`; FAQ rail Still-Stuck `/contact`; FAQ bottom Open-a-ticket `/contact`; FAQ bottom email `mailto:support@bristle.dev`. *(SC-012)*
  - **Build budget**: `next build` output: First-Load JS for `/pricing` and for `/faq` each < 180 KB gz. *(SC-014)*
  - **Lighthouse**: local prod build for `/pricing` and `/faq` — Perf / A11y / Best-Practices / SEO each ≥ 90. *(SC-015)*
  - **Tokens grep**: `grep -rnE "#[0-9A-Fa-f]{3,8}" apps/web/src/components/pricing/ apps/web/src/components/faq/ apps/web/src/app/pricing/page.tsx apps/web/src/app/faq/page.tsx` → none; `grep -rnE "font-family" same paths` → none. *(SC-017)*
  - **Radix audit**: `pnpm why @radix-ui/react-accordion` lists only accordion's actual transitive deps; no unused Radix peers. *(SC-018)*
  - **Server/Client boundary**: `grep -l "use client" apps/web/src/components/pricing/ apps/web/src/components/faq/` returns exactly four files (`pricing/billing-section.tsx`, `pricing/billing-toggle.tsx`, `faq/accordion.tsx`, `faq/scroll-spy-rail.tsx`); both route entries are `async function` (no `"use client"`). *(SC-019)*
  - **Voice grep**: `grep -rE "[!]|amazing|awesome" apps/web/src/components/pricing/ apps/web/src/components/faq/ apps/web/src/app/pricing/page.tsx apps/web/src/app/faq/page.tsx` → none (excluding `!important` if any — none expected). No emoji. *(SC-020)*
  - **Additive only**: `git diff origin/main` shows no changes under `packages/ui/src/`, `packages/shared/src/`, `packages/db/src/`, `apps/web/src/components/landing/top-nav.tsx`; the only change under `apps/web/src/components/landing/site-footer.tsx` is the line-27 href flip. *(SC-021)*
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T022 · [US3] VERIFY — deploy preview parity (gate)
Push the branch; confirm the Vercel preview.
- **Depends on**: T021
- **Verify (SC-016)**: preview URL renders `/pricing` and `/faq` identically to local within 4px per section, no client-side errors in the browser console; the toggle / accordion / scroll-spy all behave as on local; OG tags resolve to the slice-005 raster at `https://bristle.vercel.app/og-image.png` (200 + image/png 1200×630).
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — Pricing + FAQ live locally and on the preview; slice complete.

---

## Dependencies & Execution Order

```
Batch A: T001 ; (T002 ∥ T003 ∥ T004 ∥ T005) → T006
Batch B: (T007 ∥ T008 ∥ T009) ; T008 needs T001+T004
Batch C: (T010 ∥ T011 ∥ T013 ∥ T014 ∥ T016 ∥ T017 ∥ T019) ; T012 needs T007+T011 ; T015 needs T010+T012+T013+T014 ; T018 needs T008+T009+T017 ; T020 needs T016+T018+T019
Batch D: T021 (needs T015+T020) → T022
```

- **US1** spans the pricing data (T002, T003), pricing client primitive (T007), pricing server components (T010, T011, T012, T013, T014), and the pricing route (T015).
- **US2** spans the FAQ data (T004), FAQ client primitives (T008, T009), FAQ server components (T016, T017, T018, T019), and the FAQ route (T020).
- **US3** = the perf/a11y/SEO/voice gate (T021) + preview (T022).
- **US4** = the footer href flip (T005), independent of everything else.
- **SETUP** = the Radix dep (T001) and the foundations verify (T006).

### Parallel opportunities
- **Batch A**: T002/T003/T004/T005 touch independent files → parallel; T001 (dep) is independent too but listed first because it gates T008; T006 (verify) joins them.
- **Batch B**: T007/T008/T009 are all independent files (T008 needs T001/T004 which are in Batch A — already done).
- **Batch C**: T010/T011/T013/T014/T016/T017/T019 are all independent section files (parallel); T012 depends on T011 (within batch); T018 depends on T017 (within batch); T015 + T020 are the page-composition tasks at the tail.

## Implementation strategy (4 stops)
1. **Stop 1 (Batch A)**: foundations — Radix dep, three content data files, footer href repointed.
2. **Stop 2 (Batch B)**: three client primitives (toggle, accordion, scroll-spy rail) typecheck in isolation.
3. **Stop 3 (Batch C)**: all server section components + both route entries with metadata.
4. **Stop 4 (Batch D)**: full quality/preview gate.

## Task count
22 tasks — **19 commit-producing** (T001–T005, T007–T020), **3 verification gates** (T006, T021, T022). Grouped into **4 batches / 4 stops**.

## Out of scope (no tasks)
Real Stripe billing wiring; real `/contact` route (slice 2.3 ships it); real `/support`/`/help`/ticket system; next-themes integration / theme toggle UI / Editorial Dark on either page (re-deferred to slice 2.6); newsletter wiring (slice 2.7); Better Stack status (slice 2.7); any modifications to slice-005 top nav, `ProblemCardFull`, `ProblemCardCompact`, design tokens, or `@bristle/db` query helpers; any `/api` docs route (footer "API" continues to 404); automated test files (Playwright still deferred).
