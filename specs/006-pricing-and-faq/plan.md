# Implementation Plan: Pricing + FAQ

**Branch**: `006-pricing-and-faq` | **Date**: 2026-05-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-pricing-and-faq/spec.md`

> **HARD CONSTRAINT honored**: plan only. No code written by this command. Snippets are illustrative shapes for review.

## Summary

Replace the slice-005 soft-404 `/pricing` with the full Pricing page (`design/Public_pages.pdf` p.3) and add the brand-new `/faq` route (p.4). Both pages reuse the slice-005 `TopNav` and `SiteFooter` unchanged (apart from a one-line `Help center` href flip from `/help` → `/faq`, mandated by FR-016). Three new interactive client components ship: a segmented Monthly/Annual billing toggle owned by a thin client wrapper that keeps the tier cards themselves server-rendered, a Radix-based single-expansion FAQ accordion with `"Where does Bristle get its data?"` open by default with the verbatim answer, and an IntersectionObserver-driven scroll-spy rail that doubles as the mobile horizontal-pill section nav. The Pricing page also introduces a 9-row "Compare in detail" table and an Enterprise contact-sales card. Both pages render in Editorial Light (next-themes deferred to slice 2.6), set per-page metadata via the existing `SITE_URL` constant, and reuse the slice-005 `/og-image.png` raster. **One new top-level dependency added** (`@radix-ui/react-accordion`, the only specific Radix primitive package needed — confirmed not yet present in `packages/ui`); no other new runtime deps.

## Technical Context

**Language/Version**: TypeScript 5.8.x strict, React 19.1.0, Next.js 15.5.18 (App Router), Node 20.
**Primary Dependencies**: existing — `@bristle/ui` (no new exports), `@bristle/shared` (`SITE_URL` consumed for metadata), `@bristle/db` (untouched — no DB reads this slice), Tailwind v4, `next/font/google`, `lucide-react` (existing 1.16.0 in `@bristle/ui` deps; `Check`, `ChevronDown` consumed by name). New runtime dep: **`@radix-ui/react-accordion`** added to `packages/ui` (the single specific Radix primitive package needed; `shadcn/ui`-style Radix primitives are the locked primitive layer per §3, so this is consistent with the stack and is documented as an addition).
**Storage**: N/A — both pages are content-static; tier metadata, FAQ items, and compare-table rows are TypeScript constants in the codebase. **No DB reads, no schema change, no new query helpers.**
**Testing**: gates only (typecheck/lint/build/Lighthouse/visual-diff/responsive/grep). No Vitest/Playwright added this slice (see §13).
**Target Platform**: Web (Vercel preview + production).
**Performance Goals (binding, §5)**: Lighthouse ≥90 Performance/Accessibility/Best-Practices/SEO on each of `/pricing` and `/faq`; First-Load JS < 180 KB gz **per route**; mobile LCP < 2.5s.
**Constraints**: Server Components by default; `"use client"` strictly scoped to the three interactive components (toggle wrapper, accordion, scroll-spy rail); Tailwind tokens only — zero hex, zero font-family literals; no `localStorage` (toggle state in-memory only, resets on refresh, per §9.6 + spec edge case); WCAG 2.2 AA across both pages incl. keyboard semantics on all three interactive components; voice §6 across all new copy; additive only — `ProblemCardFull`/`ProblemCardCompact`/tokens/`@bristle/db` query helpers untouched (FR-022, §9).
**Scale/Scope**: 2 routes (1 rewrite + 1 new), 2 small content data files, ~10 new section/component files, 1 new top-level dep, 1 one-line edit to `site-footer.tsx`. ~13 files added/changed; zero DB migrations.

## Constitution Check

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | Next 15 App Router, Tailwind v4, `lucide-react` (existing, no new icons-pkg), `next/font` (no new font calls). **One new top-level dep**: `@radix-ui/react-accordion` — consistent with §3's `shadcn/ui` (Radix primitives are the underlying primitive layer); §9.5 satisfied by the explicit addition recorded here. No other new deps; scroll-spy is hand-rolled on `IntersectionObserver` (platform API, not a library). |
| §4 Tokens exact | PASS | All color/type/spacing/radii/motion via tokens; checkmarks via `lucide-react` `Check` at 1.5px stroke; accent color on Pro column header via `accent/bristle` (light) — zero hex, zero font-family literals (SC-017). |
| §4.1a Category tints | N/A | Pricing/FAQ have no category pills this slice. |
| §5 Conventions + floors | PASS | Server Components default; client surface = 3 named components only (`PricingBillingSection` wrapper, `FaqAccordion`, `FaqScrollSpyRail`); kebab-case files / PascalCase components; Tailwind only; no storage; Zod N/A (no forms/inputs this slice); perf/a11y floors explicit (SC-007/014/015); reduced-motion respected (FR-013 scroll-spy, accordion motion). |
| §6 Voice | PASS | Pricing copy from the design; FAQ verbatim answer locked (FR-012); the 11 implementor-authored answers gated by FR-012a's `Policy claims needing founder sign-off` PR section; voice grep clean (SC-020). |
| §8 Repo structure | PASS | Per-page section components under `apps/web/src/components/pricing/` and `apps/web/src/components/faq/` (mirrors slice-005's `landing/`). Content data files (`tier-data.ts`, `compare-data.ts`, `faq-data.ts`) colocated with consumers (not `packages/shared`) — they are page-specific, not cross-cutting. |
| §9 Never-do | PASS | No edits to `design/`, PDFs, or docs; spec→plan→tasks→implement honored; building exactly the spec; **ProblemCardFull / ProblemCardCompact / tokens / `@bristle/db` untouched** (FR-022); no browser storage. The one-line `Help center` href flip in `site-footer.tsx` is an **href-value change** explicitly mandated by FR-016 — not a structural edit; documented under decision §11 below. |
| §10 Ambiguity | PASS | All 5 clarifications resolved in the spec (annual format / FAQ authorship + FR-012a / FAQ section mapping / next-themes target / mobile rail pinned in this plan §9). |

**Result**: PASS. One new top-level dependency added (`@radix-ui/react-accordion`) is recorded under §9.5 as a proposed-and-accepted addition consistent with §3's locked primitive layer. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)
```text
specs/006-pricing-and-faq/
├── spec.md            # done (all clarifications resolved; FR-012a folded in)
├── plan.md            # this file
├── research.md        # Phase 0 — the 14 decisions
├── data-model.md      # Phase 1 — content shapes (Tier, CompareRow, FaqItem, RailSection) + their fixed instances
├── quickstart.md      # Phase 1 — build/gate recipe + SC mapping
├── contracts/
│   └── ui-and-db.md   # New client-component contracts + per-page metadata shape + footer one-line diff
├── checklists/
│   └── requirements.md  # already passing (16/16)
└── tasks.md           # Phase 2 — NOT created here
```

### Source Code (exact file tree of changes/additions)
```text
packages/ui/
└── package.json                                  # CHANGE — add "@radix-ui/react-accordion" to dependencies

apps/web/
└── src/
    ├── app/
    │   ├── pricing/page.tsx                      # REWRITE — replace slice-005 ComingSoon with full page (server entry)
    │   └── faq/page.tsx                          # ADD — new route (server entry)
    └── components/
        ├── landing/
        │   └── site-footer.tsx                   # CHANGE — one href flip: "/help" → "/faq" (FR-016)
        ├── pricing/
        │   ├── hero.tsx                          # ADD — server
        │   ├── tier-data.ts                      # ADD — three Tier constants
        │   ├── billing-section.tsx               # ADD — client (owns useState + renders toggle + tier-card row)
        │   ├── billing-toggle.tsx                # ADD — client (radiogroup primitive)
        │   ├── tier-card.tsx                     # ADD — server (receives { tier, billingMode })
        │   ├── compare-data.ts                   # ADD — 9 CompareRow constants
        │   ├── compare-table.tsx                 # ADD — server
        │   └── enterprise-card.tsx               # ADD — server
        └── faq/
            ├── hero.tsx                          # ADD — server
            ├── faq-data.ts                       # ADD — 12 FaqItem constants (+ policy-claims comment header per FR-012a)
            ├── faq-body.tsx                      # ADD — server (2-col layout container: rail + accordion)
            ├── scroll-spy-rail.tsx               # ADD — client (IntersectionObserver; desktop sticky + mobile pill row)
            ├── still-stuck-card.tsx              # ADD — server (static, below rail)
            ├── accordion.tsx                     # ADD — client (Radix Accordion)
            └── bottom-cta.tsx                    # ADD — server
```

**Structure Decision**: section + interactive components live under `apps/web/src/components/{pricing,faq}/` (app-local, not shared) since they're page-specific, mirroring slice-005's `landing/`. Content data (`tier-data.ts`, `compare-data.ts`, `faq-data.ts`) colocated with consumers — these are page content, not cross-cutting. The one Radix primitive package is added to `@bristle/ui`'s `dependencies` (not the app) so it travels with the UI package and can be reused by future Tier 3+ slices that need an Accordion. No tokens, problem cards, or DB helpers touched.

---

## The 14 required decisions

### 1. Page composition — **thin server entry composing one component per section, mirroring slice-005**
Each route is a thin async Server Component that renders its sections in order.

`apps/web/src/app/pricing/page.tsx` composes:
`<TopNav/>` *(reused from slice 005)* → `<PricingHero/>` → `<PricingBillingSection/>` *(client wrapper containing `<PricingBillingToggle/>` + 3× `<TierCard/>`)* → `<CompareTable/>` → `<EnterpriseCard/>` → `<SiteFooter/>` *(reused)*.

`apps/web/src/app/faq/page.tsx` composes:
`<TopNav/>` *(reused)* → `<FaqHero/>` → `<FaqBody/>` *(2-col container rendering `<FaqScrollSpyRail/>` + `<StillStuckCard/>` in the left column and `<FaqAccordion/>` in the right)* → `<FaqBottomCta/>` → `<SiteFooter/>` *(reused)*.

**Rationale**: maps 1:1 to spec sections + the per-section 4px gate; small reviewable diffs; matches slice-005's `landing/` pattern exactly. Single-file inline `page.tsx` for either page would be 300+ lines and impossible to per-section review.

### 2. Server vs Client boundary — **three named client components, everything else server**
The route entries (`pricing/page.tsx`, `faq/page.tsx`) are async Server Components. The only files carrying `"use client"`:
- `apps/web/src/components/pricing/billing-section.tsx` *(wrapper that owns the toggle state)*
- `apps/web/src/components/pricing/billing-toggle.tsx` *(the segmented control itself — kept separate from the wrapper for review/testability)*
- `apps/web/src/components/faq/accordion.tsx` *(Radix Accordion)*
- `apps/web/src/components/faq/scroll-spy-rail.tsx` *(IntersectionObserver)*

So **four** client files total, **three** interactive concerns (toggle, accordion, scroll-spy). `TierCard` is a Server Component — it receives `billingMode: "monthly" | "annual"` as a prop from its client parent and re-renders on the server when React re-renders the tree (the wrapper *is* the client component; tier cards are React children of that client component but stay as Server Components themselves under RSC, since their JSX is computed during the render pass owned by the client wrapper but their markup is still token-styled HTML with no JS). **Rationale**: keeps client JS minimal; the toggle's `useState` is the only stateful piece on Pricing; tier-card markup, the compare table, the Enterprise card, the FAQ hero, the FAQ body container, the Still-Stuck card, and the bottom CTA all ship as zero-JS HTML.

### 3. Toggle state lifting — **single client wrapper owns `useState`, renders toggle + tier-card row**
```tsx
// apps/web/src/components/pricing/billing-section.tsx
"use client";
import { useState } from "react";
import { PricingBillingToggle } from "./billing-toggle";
import { TierCard } from "./tier-card";
import { TIERS } from "./tier-data";

export function PricingBillingSection() {
  const [mode, setMode] = useState<"monthly" | "annual">("monthly");
  return (
    <>
      <PricingBillingToggle value={mode} onChange={setMode} />
      <div className="grid gap-grid md:grid-cols-3">
        {TIERS.map((tier) => (
          <TierCard key={tier.name} tier={tier} billingMode={mode} />
        ))}
      </div>
    </>
  );
}
```
**Rationale**: one stateful component owns the toggle; three tier cards remain pure props consumers (Server Components by file, rendered as React children inside the client tree — no `"use client"` directive on them, so they stay zero-JS HTML in the bundle accounting). Lifting state to the toggle itself would force the tier cards to subscribe (context or prop-drilling through a separate context provider). Pushing state into each tier card (e.g. each card holds its own `useState`) would require sync between three sources of truth and three `"use client"` files instead of one. The decision minimizes the `"use client"` surface (one stateful file) while keeping all markup tokens-only.

### 4. `TierCard` contract — **confirmed with one nit, plus the annual-price computation rule**
```ts
// apps/web/src/components/pricing/tier-card.tsx (server)
import type { Tier } from "./tier-data";

export interface TierCardProps {
  tier: Tier;                                    // see tier-data.ts
  billingMode: "monthly" | "annual";
}
```
where `Tier` (in `tier-data.ts`) is:
```ts
export interface Tier {
  name: "Starter" | "Pro" | "Team";
  eyebrow: string;                               // e.g. "STARTER"
  monthlyPriceUsd: number;                       // 29 | 79 | 199 — the source of truth
  tagline: string;
  ctaLabel: string;                              // "Choose Starter" | "Start Pro trial" | "Choose Team"
  ctaHref: string;                               // "/signup" for all three
  ctaVariant: "primary" | "outline";             // "primary" only for Pro
  isMostPopular: boolean;                        // true only for Pro
  features: string[];                            // bullet list per the design
}
```
The `TierCard` computes the displayed price inline:
```tsx
const displayedMonthly =
  billingMode === "annual"
    ? Math.round(tier.monthlyPriceUsd * 0.7)     // FR-005: monthly × 0.7, nearest dollar
    : tier.monthlyPriceUsd;
```
and renders `${displayedMonthly}/month`; below the price, in annual mode only, it adds a `text-body-sm text-text-secondary` "billed annually" caption. **Rationale**: passing `monthlyPriceUsd` as the source of truth (not pre-computed annual/monthly) keeps the data file tiny and the rounding rule centralized in the card. The shape matches the user's proposal with one refinement: split CTA into separate `ctaLabel`/`ctaHref` fields (per-tier labels are not all "Choose X" — Pro's is "Start Pro trial"); added `eyebrow` because tier names rendered all-caps in the design are stylistically distinct from the `name` (which is also the React key).

### 5. Compare table — **typed constants in `compare-data.ts`, table renders from the array**
```ts
// apps/web/src/components/pricing/compare-data.ts
export type CompareCell = string | { kind: "check" } | { kind: "dash" };
export interface CompareRow {
  label: string;
  starter: CompareCell;
  pro: CompareCell;
  team: CompareCell;
}
export const COMPARE_ROWS: CompareRow[] = [
  { label: "Tracked categories",  starter: "5",                pro: "Unlimited",            team: "Unlimited" },
  { label: "Saved problems",      starter: "50",               pro: "Unlimited",            team: "Unlimited" },
  { label: "Alert delivery",      starter: "Daily email",      pro: "Email · in-app · API", team: "Email · Slack · webhook" },
  { label: "Comparison view",     starter: { kind: "dash" },   pro: "Up to 4",              team: "Up to 4" },
  { label: "API access",          starter: { kind: "dash" },   pro: "50k req/mo",           team: "200k req/mo" },
  { label: "Team seats",          starter: "1",                pro: "1",                    team: "5 included" },
  { label: "Shared collections",  starter: { kind: "dash" },   pro: { kind: "dash" },       team: { kind: "check" } },
  { label: "SSO",                 starter: { kind: "dash" },   pro: { kind: "dash" },       team: { kind: "check" } },
  { label: "Support",             starter: "Community",        pro: "Priority email",       team: "Dedicated CSM" },
];
```
The table component (`compare-table.tsx`) maps over `COMPARE_ROWS`; cell renderer: string → render as-is, `{kind:"check"}` → `<Check className="size-4 stroke-[1.5]" aria-label="included"/>`, `{kind:"dash"}` → renders the em-dash character `—`. **Rationale**: a typed array is the right shape for nine homogeneous rows — it's the single review surface at PR time (one diff against the PDF), the rendering logic is one map + one cell-kind switch (no inline JSX duplication), and the discriminated union (`string | check | dash`) makes the absent/present/value distinction explicit at the type level (typo'd "—" in a string would lint as a wrong type). Inline JSX would scatter the row content across nine `<tr>` blocks with identical structure — review burden ~9× higher and no type-level guard against an off-by-one or wrong-column value.

### 6. `FaqAccordion` implementation — **Radix Accordion, single-expansion, default-open `faq-q-1`**
- **Package**: `@radix-ui/react-accordion`. **Confirmed not yet present in `packages/ui`'s `dependencies`** (current deps are `lucide-react@1.16.0` only). Add to `packages/ui/package.json` `dependencies` (so any future consumer — Tier 3+ — inherits the primitive via `@bristle/ui`). React-19 compatible (Radix UI primitives have supported React 19 since 1.1.x).
- **Mode**: `<Accordion.Root type="single" collapsible defaultValue="faq-q-1">` — single-expansion (matches the design's "one open" state); `collapsible` so the default-open item can be closed; `defaultValue="faq-q-1"` so `Where does Bristle get its data?` is open on first paint. Keyboard semantics (Enter/Space to toggle, Up/Down to move focus, Home/End to jump) are Radix defaults. ESC-to-close is added via an `onKeyDown` on `Accordion.Root` that calls `setValue("")` when the key is Escape (Radix doesn't ship ESC-close by default; small wrapper, no new dep).
- **Item ids**: `faq-q-1` through `faq-q-12` — stable, sequential, also serve as the anchor targets the rail's click-to-scroll uses (decision §7).
- **Data-section attribute**: each `<Accordion.Item value="faq-q-{n}" data-section="{sectionId}">` carries the rail-section key (`pricing` / `data-sources` / `privacy` / `cancellation` / `api`) for the scroll-spy to read via `entry.target.dataset.section`.
- **Trigger**: lucide-react `ChevronDown` 1.5px stroke, rotated 180° via `data-state="open"` per Radix's standard pattern. Question text in `font-sans text-body-md text-text-primary`; answer body in `font-serif text-body-md text-text-secondary` (matches the design's serif body register for editorial reading).
- **Rationale**: Radix is the project-locked primitive layer (§3 `shadcn/ui`); Accordion ships the keyboard semantics, focus management, and ARIA roles for free (`button[aria-expanded]`, `region`). Hand-rolling would re-invent ~150 lines of a11y plumbing for no token-fidelity gain (the design's chevron + serif body are token utilities applied to the unstyled Radix slots).

### 7. `FaqScrollSpyRail` implementation — **hand-rolled IntersectionObserver, no new dep**
```tsx
// apps/web/src/components/faq/scroll-spy-rail.tsx
"use client";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "pricing",      label: "Pricing" },
  { id: "data-sources", label: "Data sources" },
  { id: "privacy",      label: "Privacy" },
  { id: "cancellation", label: "Cancellation" },
  { id: "api",          label: "API" },
] as const;

export function FaqScrollSpyRail() {
  const [active, setActive] = useState<string>("data-sources");   // matches faq-q-1's section
  const visible = useRef<Map<string, number>>(new Map());          // itemId → topY

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-faq-item]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;                                  // faq-q-N
          if (e.isIntersecting) visible.current.set(id, e.boundingClientRect.top);
          else visible.current.delete(id);
        }
        // pick the topmost visible item; its data-section becomes active
        let topId: string | null = null;
        let topY = Infinity;
        for (const [id, y] of visible.current) if (y < topY) { topY = y; topId = id; }
        if (topId) {
          const section = document.getElementById(topId)?.dataset.section;
          if (section) setActive(section);
        }
        // if NOTHING is visible, leave `active` as-is — no flicker between sections
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onJump = (sectionId: string) => {
    const target = document.querySelector<HTMLElement>(`[data-faq-item][data-section="${sectionId}"]`);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  // ...renders the desktop sticky vertical rail above md, horizontal pill row below md.
  // The active section gets the vertical accent bar on its left edge.
}
```
- **Observer config**: `rootMargin: "-80px 0px -55% 0px"` — top inset of 80px accounts for the visible TopNav height (so a question scrolled "behind" the nav doesn't count as visible); bottom inset of 55% biases active state to whatever is in the upper-middle of the viewport (avoids the active section flipping the moment a long answer at the top barely peeks above the bottom edge). `threshold: 0` — fires on any intersection so we always have current `boundingClientRect.top` values to compare.
- **Active-section resolution rule when multiple items are visible**: track all currently-intersecting items in a ref map of `itemId → top-y`; pick the one with the smallest (topmost) `top` value; its `data-section` becomes the new active section. When nothing is intersecting (between two sections), **keep the previous active value** — no flicker, no "no-section" intermediate state (matches the spec's edge case).
- **Click-to-scroll**: `target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })` where `reduce` is `window.matchMedia("(prefers-reduced-motion: reduce)").matches`. `"auto"` = instant; `"smooth"` = animated. Read on each invocation so a user changing the OS setting mid-session takes effect immediately.
- **Stable ids**: `faq-q-1` … `faq-q-12` on every accordion `<Accordion.Item>`. The rail anchors via the same ids. The Item also carries `data-faq-item` (a presence marker the IO selector uses, so the observer never accidentally picks up an unrelated `[id^=faq-q-]` element) and `data-section="data-sources"` etc. (the section key the observer reads).
- **Rationale**: IntersectionObserver is widely available (Safari 12.1+, baseline since 2020 — see §14 risk R3 below); polling-based scroll-spy is laggy and burns main-thread CPU; a library would add bundle weight for ~30 lines of logic.

### 8. FAQ content data — **single `faq-data.ts` with a policy-claims comment header (FR-012a)**
```ts
// apps/web/src/components/faq/faq-data.ts
//
// Policy claims needing founder sign-off (FR-012a):
// - <item id> · <claim quoted here>
// - ... (or "None this PR." if no implementor-authored answer asserts a claim
//   in: refund window | polling/refresh cadence | category-request SLA |
//   data retention | data residency | free-tier rules)
// Mirror this section into the PR description under the same heading.

export type FaqSection = "pricing" | "data-sources" | "privacy" | "cancellation" | "api";
export interface FaqItem { id: string; question: string; answer: string; section: FaqSection; }

export const FAQ_ITEMS: FaqItem[] = [
  { id: "faq-q-1",  section: "data-sources", question: "Where does Bristle get its data?",
    answer: "We ingest from six public sources via official APIs and approved scrapers: GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We never use private channels or content behind authentication walls." },
  // faq-q-2 … faq-q-12 — implementor authors per FR-012 voice rules;
  // any answer asserting a policy claim listed above goes into the comment header
  // AND into the PR description's "Policy claims needing founder sign-off" section.
];
```
- **File location**: colocated with consumers (`apps/web/src/components/faq/`), not `packages/shared` — page-specific content, no cross-cutting reuse.
- **Single review surface**: the entire FAQ corpus is one file. The reviewer reads `faq-data.ts` and the PR's `Policy claims needing founder sign-off` section side-by-side; the comment header and the PR section MUST match (the implementor copies the bullet list).
- **One verbatim entry locked** (FR-012); 11 entries authored by implementor to voice (FR-012); any of those 11 that touch a triggering policy category surface via FR-012a's PR gate.
- **Rationale**: keeping data and policy-claim disclosure colocated makes the gate impossible to forget (the header is right there when the implementor saves the file). The discriminated `FaqSection` union mirrors the rail's `SECTIONS` const so a typo'd section in `faq-data.ts` is a type error, not a runtime "active stays blank" silent failure.

### 9. Mobile FAQ rail pattern — **(iii) horizontal-scrolling pill row, pinned above the accordion** ✅ accept user's recommendation
Below `md`, the desktop sticky vertical rail collapses into a horizontal pill row pinned just below the FAQ hero. The rail is **the same component** (`scroll-spy-rail.tsx`) with a media-query-driven layout switch — the active-state machinery (IntersectionObserver + `active` state + click-to-scroll) is identical; only the wrapper layout changes (`md:flex-col md:sticky md:top-grid` desktop vs `flex overflow-x-auto snap-x` mobile).

**Why (iii) over (i)/(ii)**:
- **vs (i) collapsible disclosure ("Categories ▼")**: a disclosure adds a tap-to-open + tap-to-pick (two taps) where the pill row is one tap. The active state has no visible home when closed — the user loses the "you are reading the Privacy section" cue. Also introduces a focus-trap-adjacent surface (the open disclosure panel needs Escape handling and outside-click dismiss) for no spec gain.
- **vs (ii) native `<select>`**: best one-tap input affordance, but the `<select>` is a black box for active-state display (you'd have to update `<select value={active}>` on scroll, which feels janky as the value visibly changes while the user scrolls — and select UI on iOS opens a system picker that obscures the page). Also breaks the visual continuity with the desktop rail.
- **(iii) horizontal pill row** keeps the same mental model on desktop and mobile: a single row of section labels with the active one accented. Single-tap to jump. Snaps cleanly into a `flex overflow-x-auto snap-x` row; the active pill scrolls into view as `active` changes so the user always sees which section they're in. No new focus-trap concerns. One code path (the same client component) instead of two.
- **Accessibility**: each pill is a `<button>` (keyboard reachable by Tab, activated by Enter/Space); the pill row gets `role="tablist"` and pills get `role="tab" aria-selected={active === id}` so screen readers announce the active section correctly; the accordion's items are unaffected.

The plan accepts the user's recommendation as the pinned decision; recorded under SC-007.

### 10. Per-page metadata — exact shape
Both routes export a `metadata` object that consumes `SITE_URL` from `@bristle/shared` (the slice-005 constant — unchanged). Both reuse the slice-005 OG image at `${SITE_URL}/og-image.png` (1200×630, already deployed); no new OG raster authored this slice (confirmed FR-017).

```ts
// apps/web/src/app/pricing/page.tsx
import { SITE_URL } from "@bristle/shared";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Pricing — Bristle",
  description: "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%.",
  openGraph: {
    title: "Pricing — Bristle",
    description: "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%.",
    type: "website",
    url: SITE_URL + "/pricing",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

// apps/web/src/app/faq/page.tsx
import { SITE_URL } from "@bristle/shared";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FAQ — Bristle",
  description: "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API.",
  openGraph: {
    title: "FAQ — Bristle",
    description: "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API.",
    type: "website",
    url: SITE_URL + "/faq",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};
```
- **No `robots` field** on either page → indexable by default (FR-017).
- **Title strings** are exactly `Pricing — Bristle` and `FAQ — Bristle` (em-dash separator, matches `next/font` default).
- **Description strings** are one sentence each, in voice (§6: no exclamation/emoji/hype). Pricing description rewords the page subhead; FAQ description names the rail's five section topics so a search snippet doubles as a topic preview.

### 11. Footer `Help center` href change — **acceptable, mandated by FR-016, one-line diff**
`apps/web/src/components/landing/site-footer.tsx` line 27 currently reads:
```tsx
{ label: "Help center", href: "/help" },
```
This slice changes it to:
```tsx
{ label: "Help center", href: "/faq" },
```

- **§9 evaluation**: §9 forbids modifying `design/` and the read-only PDFs; it does not forbid editing shipped slice files. FR-022 (additive only) protects the slice-005 nav and footer **structure**, not href values. Changing an `href` value (not adding/removing a link, not changing structure, not changing styling) is the smallest possible scope of edit and is **explicitly mandated** by FR-016 of this slice's spec. The change ships in this slice's commits, in its own one-task commit so the diff is reviewable in isolation.
- **Rationale**: the alternative — leaving `/help` as a 404 link in the chrome — directly contradicts the slice's purpose (the FAQ exists *to be* the help destination). Carrying the relink in a later slice would mean shipping a known-broken footer link past a slice that made the answer reachable.

### 12. Performance / SEO budget — concrete techniques
- **Radix Accordion import**: import named members only — `import * as Accordion from "@radix-ui/react-accordion"` or named (`import { Root, Item, Header, Trigger, Content } from "@radix-ui/react-accordion"`). The package ships ES modules; Next 15's compiler tree-shakes unused exports. **No barrel import of `@radix-ui/*`** umbrella package (which doesn't exist; only the specific primitive package is added).
- **No other `@radix-ui/react-*` peers**: Accordion has no peer-dep on other Radix primitives at runtime (it depends on `@radix-ui/react-collapsible` and a few internal utility packages — those come transitively, are tree-shakeable, and the total accordion footprint is ~5 KB gz per published benchmarks). No `@radix-ui/react-dialog`, `react-popover`, etc. are pulled in.
- **Lucide icons by name**: `import { Check, ChevronDown } from "lucide-react"` — the project's existing `lucide-react@1.16.0` already supports named per-icon imports that tree-shake. The compare table uses `Check`; the accordion uses `ChevronDown`. **No `import * from "lucide-react"`**, no `import "lucide-react/icons"` umbrella.
- **No new fonts**: `next/font/google` already loads Inter / Source Serif Pro / JetBrains Mono in `apps/web/src/app/layout.tsx`; both new pages inherit.
- **No on-page rasters**: every visual on both pages is text + inline SVG (lucide icons). The only image referenced is the OG raster, which is metadata-only (never on-page) — no `next/image`, no preload, no LCP contribution.
- **LCP candidate**: the serif hero headline (text, server-rendered, font `display:swap` from the root layout) on both pages. No image LCP, no JS-blocking LCP.
- **JS budget by page**: Pricing ships the toggle wrapper + toggle (~2 KB gz total user code, no Radix); FAQ ships the accordion (~5–6 KB gz Radix Accordion + ~1 KB gz wrapper) + the scroll-spy rail (~1 KB gz custom). Expected First-Load JS ≈ slice-005 baseline (~110 KB gz) + ~3 KB Pricing or ~8 KB FAQ = well under 180 KB gz (SC-014).
- **No analytics on either page this slice** (PostHog deferred per §3 "loaded deferred"; this slice's pages don't introduce it).

### 13. Test surface — **same as slice 005, confirmed**
No automated test files this slice. Verification is the gate phase: typecheck/lint/build (SC-013), Lighthouse on the local prod build for each route (SC-015), responsive sweep at 320/375/768/1024/1280/1440 (SC-007), per-page metadata check (SC-009), per-CTA href check (SC-012), keyboard semantics walk on the three interactive components (SC-004/005/006), hex/font-family grep (SC-017), voice grep (SC-020), and the **visual-diff vs `Public_pages.pdf` p.3 + p.4** which is **acceptance-criteria (human/screenshot review at the gate), not an automated test** (confirmed). Playwright is still deferred.

### 14. Risks & unknowns
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | 4px visual fidelity to the PDF across 2 pages × multiple sections (Pricing has 5 visual blocks, FAQ has 5) | High | Med | Map every dimension to tokens; screenshot-compare per section at the design viewport; tier-card highlighted state and Pro accent color verified separately; mobile pill row verified at 320/375. |
| R2 | `@radix-ui/react-accordion` is a **new top-level dep** (confirmed not present in `packages/ui` deps); §3 stack approval is implicit via `shadcn/ui` but the addition is novel | Low | Low | Documented in §3 of this plan + Constitution Check table; added to `packages/ui` so future tiers reuse it; **flagged on review checklist** so the user can veto the addition before tasks/implement. |
| R3 | IntersectionObserver behavior in older Safari (the scroll-spy core) | Low | Low | Baseline Safari support is 12.1+ (2019); Vercel mobile preview runs current Safari; **graceful degradation** — if the IO never fires (e.g. test env without window), `active` stays on the default `data-sources`, the rail still renders, the accordion still works. No throw, no blank screen. |
| R4 | The 11 implementor-authored FAQ answers contain a policy claim the implementor didn't catch | Med | Med | FR-012a's PR gate: comment header in `faq-data.ts` + matching `Policy claims needing founder sign-off` section in the PR description; the gate is "absent section = block merge"; the section content is the review surface. |
| R5 | Toggle state lost on refresh surprises a user mid-comparison | Low | Low | Documented as an edge case in the spec and aligned with §9.6 (no localStorage). The "default Monthly on refresh" rule (FR-003) is the user-facing contract; no fix needed. |
| R6 | Tier-card grid stacks awkwardly on `sm` (single column with the Pro card visually dominant for the whole viewport) | Low | Low | Pin Pro to the middle column on desktop (`order-2 md:order-none`); on mobile, stack in Starter → Pro → Team order (Pro still highlighted with its "Most popular" tag, but no longer dominates layout). Verified at 320/375. |
| R7 | Rail/accordion focus interplay (Tab order between rail pills and accordion items) | Low | Low | DOM order is rail first (left col), accordion second (right col) on desktop; Tab moves rail → accordion top → … → accordion bottom → bottom CTA → footer. Pills are buttons (Tab-reachable), accordion items are buttons (Tab-reachable). No focus traps. Walked at the gate. |
| R8 | Hidden hex/font-family literal in the new files (SC-017) | Med | Med | Grep gate against `apps/web/src/components/pricing/` and `apps/web/src/components/faq/` and the two route files for `#[0-9a-f]{3,8}` and `font-family` / `font-name` string literals before commit. |
| R9 | Build pulls in unused `@radix-ui/react-*` peers (SC-014/018) | Low | Med | After install, run `pnpm why @radix-ui/react-*` and confirm only `react-accordion` + its actual transitive deps (`react-collapsible`, `primitive`, `compose-refs`, etc.) appear at the top of the tree. Check First-Load JS via `next build` output for both routes (SC-014). |
| R10 | The verbatim FR-012 answer is paraphrased or smart-quoted by editor auto-formatting | Low | Med | Lock the verbatim text in `faq-data.ts` with the exact characters from the PDF; reviewer character-diffs the answer string against the spec's FR-012 text. |
| R11 | Stacking issue with the still-open PR #4 (slice 005) — branch `006-pricing-and-faq` was cut from `005-landing-page`'s tip | Med | Low | When PR #4 merges, rebase 006 onto the new `main` before continuing work — listed under "Order of operations" pre-flight below. |

## Order of operations
**Pre-flight** (before any 006 work): once PR #4 lands on `main`, `git fetch origin && git rebase origin/main` on `006-pricing-and-faq` to drop the duplicated 005 commits.

1. `packages/ui/package.json`: add `@radix-ui/react-accordion` dependency; `pnpm install`. *(blocks accordion work)*
2. `apps/web/src/components/landing/site-footer.tsx`: one-line `href` flip `/help` → `/faq` (FR-016). *(independent; standalone commit)*
3. **Pricing**: `tier-data.ts` → `compare-data.ts` → `tier-card.tsx` → `billing-toggle.tsx` → `billing-section.tsx` → `compare-table.tsx` → `enterprise-card.tsx` → `hero.tsx` → `pricing/page.tsx` (with metadata).
4. **FAQ**: `faq-data.ts` (with policy-claims comment header) → `accordion.tsx` → `scroll-spy-rail.tsx` → `still-stuck-card.tsx` → `faq-body.tsx` → `hero.tsx` → `bottom-cta.tsx` → `faq/page.tsx` (with metadata).
5. **Gate**: typecheck/lint/build; per-route Lighthouse on local prod build; responsive sweep both routes; keyboard semantics walk on toggle/accordion/rail; visual-diff vs p.3 + p.4; hex/font/voice greps; `pnpm why @radix-ui/react-*` audit; per-CTA href check; per-page metadata + no-robots check; deploy-preview parity check.

Steps 3 and 4 are independent of each other (parallelizable across an implementor splitting work). Step 2 is independent of everything else. Step 1 blocks step 4.

## Complexity Tracking
No constitution violations — section intentionally empty. The new top-level dep (`@radix-ui/react-accordion`) is recorded above in Constitution Check + decision §6 + risk R2, not here, since §3 explicitly permits proposed additions that fit the locked primitive layer.
