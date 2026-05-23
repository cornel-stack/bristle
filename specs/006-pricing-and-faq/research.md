# Research: Pricing + FAQ

Phase 0 decisions (the 14 the user required). Format: Decision / Rationale / Alternatives.

## D1 — Composition: thin server entry + per-section components, mirroring slice 005
- **Decision**: `pricing/page.tsx` and `faq/page.tsx` are thin async Server Components composing per-section files under `apps/web/src/components/{pricing,faq}/`. Pricing sections: hero, billing-section (client wrapper), compare-table, enterprise-card. FAQ sections: hero, faq-body (2-col container), bottom-cta. Plus the reused `TopNav` + `SiteFooter` from slice 005.
- **Rationale**: maps 1:1 to spec sections + per-section 4px gate; small reviewable diffs; matches slice-005's `landing/` pattern.
- **Alternatives**: single inline `page.tsx` per route — rejected (300+ lines each, unreviewable per section).

## D2 — Server vs Client boundary: 3 interactive concerns, 4 client files
- **Decision**: only `billing-section.tsx` + `billing-toggle.tsx` (pricing) and `accordion.tsx` + `scroll-spy-rail.tsx` (faq) carry `"use client"`. Everything else — both route entries, both heroes, the tier cards, the compare table, the Enterprise card, the FAQ body container, the Still-Stuck card, the bottom CTA — is a Server Component.
- **Rationale**: minimizes client JS; tier-card markup stays zero-JS HTML (rendered as React children inside a client wrapper, the component itself doesn't ship JS); satisfies §5 perf budgets.
- **Alternatives**: push toggle state into each tier card (rejected — three sources of truth + three `"use client"` files); context provider (rejected — overkill for a 2-option toggle bound to 3 children).

## D3 — Toggle state lifting: single client wrapper owns useState
- **Decision**: `billing-section.tsx` ("use client") owns `useState<"monthly"|"annual">("monthly")`, renders `<PricingBillingToggle value onChange/>` and three `<TierCard tier billingMode/>` children. Tier cards remain server.
- **Rationale**: one stateful file, three pure children. No prop-drilling beyond one hop. Easiest to reason about.
- **Alternatives**: lift state to the toggle itself with children subscribing (rejected — context or imperative subscriptions for no gain); per-card state (rejected — sync nightmare).

## D4 — TierCard contract: { tier, billingMode }; price math in card; data-source-of-truth is monthlyPriceUsd
- **Decision**: `TierCardProps = { tier: Tier; billingMode }` where `Tier = { name, eyebrow, monthlyPriceUsd, tagline, ctaLabel, ctaHref, ctaVariant, isMostPopular, features[] }`. Annual displayed price computed in card: `Math.round(monthlyPriceUsd * 0.7)`; suffix `/month`; "billed annually" caption only when `billingMode === "annual"`.
- **Rationale**: single source of truth for prices (no risk of monthly/annual drift), centralized rounding rule, tiny data file. Split `ctaLabel`/`ctaHref` (vs user's combined `cta`) because Pro's label is "Start Pro trial" while Starter/Team are "Choose X" — separate labels avoid encoding three different ternaries.
- **Alternatives**: pre-compute both prices in `tier-data.ts` (rejected — duplication, drift risk).

## D5 — Compare table: typed constants array, one renderer
- **Decision**: `compare-data.ts` exports `COMPARE_ROWS: CompareRow[]` with discriminated cell type `CompareCell = string | { kind: "check" } | { kind: "dash" }`. `compare-table.tsx` maps once.
- **Rationale**: nine homogeneous rows render via one switch; type-level guard against typo'd em-dashes; single review surface vs the PDF.
- **Alternatives**: inline JSX (rejected — 9× duplication, no type guard); all-string cells with sentinel chars (rejected — no compile-time distinction between text "—" and absent-feature semantics).

## D6 — FaqAccordion: Radix Accordion, single-expansion, default-open faq-q-1, ESC-close wrapper
- **Decision**: `@radix-ui/react-accordion` v1.x. **Confirmed not present in `packages/ui` deps** (current deps are `lucide-react@1.16.0` only) — adding to `packages/ui/package.json` `dependencies`. `<Accordion.Root type="single" collapsible defaultValue="faq-q-1">`. Item ids `faq-q-1`…`faq-q-12`. ESC-to-close added via `onKeyDown` setting `value=""` (Radix doesn't ship ESC-close by default; ~5 lines).
- **Rationale**: Radix ships keyboard + ARIA (`button[aria-expanded]`, `region`) for free; `shadcn/ui` (locked in §3) builds on Radix; adding the one primitive consistent with that. Hand-rolled would re-invent ~150 lines of a11y plumbing for no token-fidelity gain.
- **Alternatives**: `<details>`/`<summary>` (rejected — no programmatic single-expansion, no smooth motion control, ARIA semantics weaker for "FAQ" pattern); hand-rolled (rejected — a11y plumbing burden).

## D7 — FaqScrollSpyRail: hand-rolled IntersectionObserver in useEffect
- **Decision**: `IntersectionObserver` with `rootMargin: "-80px 0px -55% 0px"` (top inset for fixed nav, bottom inset to bias toward upper-middle), `threshold: 0`. Active section = topmost intersecting item's `data-section`. When nothing intersects: keep previous `active` (no flicker). Click-to-scroll: `scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })`. Stable item ids `faq-q-1`…`faq-q-12` shared with the accordion. Selector marker `[data-faq-item]` distinguishes the right elements.
- **Rationale**: IntersectionObserver baseline support is Safari 12.1+ (2019), well past the project floor; library would add bundle weight for ~30 lines of logic; matches MV-pattern scroll-spies in editorial sites (e.g. Stripe docs).
- **Alternatives**: scroll-position polling (rejected — main-thread lag, jank); a scroll-spy npm package (rejected — adds dep for 30 lines).

## D8 — FAQ content: single faq-data.ts with policy-claims comment header
- **Decision**: `apps/web/src/components/faq/faq-data.ts` holds `FAQ_ITEMS: FaqItem[]` (12 entries, FR-011 order). File header is a fixed comment block titled "Policy claims needing founder sign-off (FR-012a):" listing bullets (or "None this PR."). The implementor mirrors the bullets into the PR description under the same heading. FR-012 verbatim answer locked at `faq-q-1`.
- **Rationale**: colocates the FR-012a gate with the content it gates — the implementor can't save the file without reading the rule. Discriminated `FaqSection` union catches typos at type level.
- **Alternatives**: external JSON or `packages/shared` (rejected — page-specific, no reuse value); answers in MDX (rejected — over-engineered for 12 short strings, breaks single-grep voice check).

## D9 — Mobile FAQ rail pattern: (iii) horizontal-scrolling pill row, accept user recommendation
- **Decision**: below `md`, the rail collapses to a horizontal pill row pinned above the accordion; same component, media-query layout switch (`md:flex-col md:sticky` desktop vs `flex overflow-x-auto snap-x` mobile); same active-state machinery.
- **Rationale**: one-tap (vs (i) two-tap disclosure); preserves visible active state (vs (ii) hidden behind native `<select>` picker); same code path desktop and mobile; standard `role="tablist"`/`role="tab"` a11y; no nested focus-trap surface.
- **Alternatives**: (i) collapsible disclosure — rejected (two taps + focus trap surface + active state hidden when closed); (ii) native `<select>` — rejected (iOS picker obscures page, awkward to "update value on scroll").

## D10 — Per-page metadata: SITE_URL from @bristle/shared, slice-005 OG image reused
- **Decision**: both routes export `metadata` consuming `SITE_URL`. Titles: `Pricing — Bristle`, `FAQ — Bristle`. Descriptions: one sentence each in §6 voice. `metadataBase: new URL(SITE_URL)`. OG image: `${SITE_URL}/og-image.png` (slice-005 raster reused; no new image). `og:url` per route. **No `robots` field** → both pages indexable.
- **Rationale**: single source of truth (`SITE_URL`); zero new assets; absolute URLs survive preview-host social shares.
- **Alternatives**: per-page OG raster (rejected — explicit FR-017 says reuse); relative `og:image` (rejected — breaks on preview origins).

## D11 — Footer "Help center" href flip: acceptable, mandated by FR-016
- **Decision**: single-line change to `apps/web/src/components/landing/site-footer.tsx` line 27, `/help` → `/faq`. Own commit for reviewability.
- **Rationale**: §9 forbids `design/` and PDF edits, not slice-file edits; FR-022's "additive only" protects nav/footer structure, not href values; FR-016 explicitly mandates this exact change. Smallest possible scope (no add/remove/rename, just a value).
- **Alternatives**: defer the relink to a later slice (rejected — would ship a known-broken footer past the slice that made the answer reachable).

## D12 — Perf/SEO budget: tree-shaking, named imports, no new fonts, no on-page images
- **Decision**: Radix Accordion imported as named members or `* as Accordion` (Next 15 tree-shakes ES modules); lucide-react `Check` + `ChevronDown` imported by name (existing pattern); no other `@radix-ui/react-*` peers; no new `next/font` calls (root layout already loads the three families); zero on-page rasters (every visual is text + inline SVG); LCP candidate = serif hero headline; no PostHog/Sentry on these pages.
- **Rationale**: Expected First-Load JS ≈ slice-005 baseline (~110 KB gz) + ~3 KB (Pricing toggle) or ~8 KB (FAQ accordion + rail) = well under 180 KB gz floor.
- **Alternatives**: barrel import `import { ... } from "lucide-react"` (no — already uses named; just confirming); per-page OG raster + image preload (rejected — no on-page image, no LCP need).

## D13 — Test surface: gates only, no Playwright
- **Decision**: same as slice 005 — typecheck/lint/build, Lighthouse on local prod build, responsive sweep, keyboard semantics walk, hex/font/voice greps, visual-diff vs PDF (human review), `pnpm why @radix-ui/react-*` audit, deploy-preview parity.
- **Rationale**: Playwright not yet wired; standing it up is its own slice. Visual-diff is acceptance-criteria, not an automated test.

## D14 — Risks: see plan §14 (new dep recorded; IO Safari baseline OK; policy-claim review gate is FR-012a)
The main novel risk is the new top-level dep (`@radix-ui/react-accordion`) — flagged in the Constitution Check + decision §6 + risk R2 so the user can veto it before tasks. Everything else (perf budgets, IntersectionObserver support, focus interplay, mobile stacking) is well-understood territory.
