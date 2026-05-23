# Quickstart / Verification: Slice 006

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (one-time, before any 006 work)

When PR #4 (slice 005) lands on `main`, rebase `006-pricing-and-faq` onto the new `main`:

```bash
git fetch origin
git checkout 006-pricing-and-faq
git rebase origin/main
```

This drops the duplicated 005 commits inherited when the branch was cut from `005-landing-page`'s tip.

## Local

```bash
pnpm install                                          # picks up @radix-ui/react-accordion
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # /pricing and /faq render
```

No DB env required — both pages are content-static (no `getDb()` calls, no `force-dynamic` needed; both can be statically prerendered at build).

## Acceptance checks (map to SC-001 … SC-021)

### Visual & responsive
- **SC-001** — `/pricing` (local prod build) visual-diff vs `design/Public_pages.pdf` p.3 within 4px per section (hero · toggle · 3 tier cards w/ Pro highlighted + "Most popular" tag · 9-row compare table · Enterprise card · footer).
- **SC-002** — `/faq` (local prod build) visual-diff vs `design/Public_pages.pdf` p.4 within 4px per section (hero · left rail w/ 5 sections + Still-Stuck card · 12-item accordion w/ `faq-q-1` open · bottom CTA · footer).
- **SC-007** — responsive sweep at 320/375/768/1024/1280/1440 on both routes: no horizontal scroll, no overlap, no clipped text. Pricing tier cards stack `Starter → Pro → Team` below `md`; FAQ left rail collapses to the horizontal pill row below `md`.
- **SC-016** — Vercel preview deploy renders both pages identically to local within 4px; browser console clean on both routes.

### Interactive behavior
- **SC-003** — toggle: starts in Monthly on every fresh load. Click/keyboard-activate Annual → all three tier prices update together (Starter `$20/month`, Pro `$55/month`, Team `$139/month`) and a "billed annually" caption appears beneath each. Click Monthly → restore Starter `$29/month`, Pro `$79/month`, Team `$199/month`, captions removed.
- **SC-004** — toggle keyboard: Tab reaches it; Left/Right arrows move focus + selection between Monthly and Annual (radiogroup pattern); focus ring visible on each.
- **SC-005** — accordion: `faq-q-1` open on first paint with the FR-012 verbatim answer. Click another item → it opens, `faq-q-1` closes (single-expansion). Press Enter/Space on a closed item → opens. Press ESC while an item is open → it closes. Focus ring visible at every step.
- **SC-006** — scroll-spy: scroll the page; the active rail item updates to the topmost visible accordion item's section. Click a rail item → smooth-scroll to that section's first accordion item; with OS reduced-motion ON → scroll is instant. Active pill in the mobile horizontal row scrolls into view as `active` changes.

### Footer link
- **SC-008** — from `/` (landing), click the footer's `Resources → Help center` link → navigates to `/faq`. The footer's `href` attribute is `/faq` (not `/help`).

### Metadata, voice, tokens
- **SC-009** — `/pricing` head: `<title>Pricing — Bristle</title>`, meta description present, `og:title` + `og:description` + `og:url` (`https://bristle.vercel.app/pricing`) + `og:image` (absolute, slice-005 raster) present; **no `<meta name="robots" content="noindex">`**. Same checks for `/faq` with `FAQ — Bristle`.
- **SC-010** — `compare-table.tsx` rendered output: nine rows in FR-006 order, exact values, em-dashes for absent, lucide `Check` for present, Pro column header uses `text-accent-bristle`.
- **SC-011** — `faq-data.ts`: `faq-q-1` answer matches FR-012 character-for-character (no smart quotes, no paraphrase). Other 11 answers exist, 1–3 sentences each.
- **SC-011a** — PR description contains a heading exactly titled `Policy claims needing founder sign-off`. Section is populated (each claim quoted with its `faq-q-N` id) or contains the literal "None this PR." — never absent. The same bullet list appears in `faq-data.ts`'s file header.
- **SC-012** — per-CTA href check:
  - Pricing tier CTAs: Choose Starter / Start Pro trial / Choose Team → all 3 = `/signup`.
  - Enterprise card "Contact sales →" → `/contact`.
  - FAQ rail Still-Stuck card "Contact support →" → `/contact`.
  - FAQ bottom CTA "Open a ticket →" → `/contact`.
  - FAQ bottom CTA email → `mailto:support@bristle.dev`.
- **SC-017** — grep `apps/web/src/components/pricing/`, `apps/web/src/components/faq/`, `apps/web/src/app/pricing/page.tsx`, `apps/web/src/app/faq/page.tsx`: zero `#[0-9A-Fa-f]{3,8}` hex literals; zero `font-family`/`font-name` string literals.
- **SC-020** — voice grep on the same paths: no `!` (excluding the literal `"!"` inside `"Promise."` — N/A, no `!` in any approved copy), no emoji, no "amazing"/"awesome" register.

### Architecture
- **SC-019** — server/client split: `grep -l "use client" apps/web/src/components/pricing/ apps/web/src/components/faq/` returns exactly four files: `pricing/billing-section.tsx`, `pricing/billing-toggle.tsx`, `faq/accordion.tsx`, `faq/scroll-spy-rail.tsx`. Both route entries (`pricing/page.tsx`, `faq/page.tsx`) are async Server Components (no `"use client"`, `export default async function`).
- **SC-021** — diff vs `main` (after rebase): `packages/ui/src/`, `packages/shared/src/`, `packages/db/src/`, design tokens (`apps/web/src/app/globals.css` and Tailwind config), `apps/web/src/components/landing/top-nav.tsx`, `apps/web/src/components/landing/site-footer.tsx` (apart from line 27) — all unchanged.

### Build & budget
- **SC-013** — `pnpm typecheck && pnpm lint && pnpm --filter web build` exit 0.
- **SC-014** — `next build` output: First-Load JS for `/pricing` and for `/faq` each < 180 KB gz.
- **SC-015** — Lighthouse on local prod build for `/pricing` and `/faq`: Perf / A11y / Best-Practices / SEO each ≥ 90.
- **SC-018** — `pnpm why @radix-ui/react-accordion` confirms only `react-accordion` and its actual transitive deps (`react-collapsible`, `primitive`, `compose-refs`, etc.) appear; no unused Radix peers (`react-dialog`, `react-popover`, etc.).

## Production

- Vercel env already set (slice 004 + 005). Push branch → preview renders both pages from the static build.
- No DB seed step (no DB reads).
- OG image: slice-005's `https://bristle.vercel.app/og-image.png` continues to resolve.

## Notes

- Toggle state is **not** persisted (per spec edge case + §9.6 no-storage rule). Refreshing `/pricing` resets to Monthly. This is the contract, not a bug.
- The scroll-spy's IntersectionObserver runs only client-side; SSR output has the rail rendered with the default `active="data-sources"` so the first paint is correct.
- The verbatim `faq-q-1` answer must be hand-typed (or pasted from the PDF text layer with smart-quote auto-format DISABLED). Reviewer character-diffs it against FR-012.
- The mobile pill row scroll position auto-syncs to the active pill (`pill.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" | "auto" })` keyed off the same `prefersReducedMotion` flag) so the user always sees which section they're in even when scrolling the accordion changes the active pill out of view.
