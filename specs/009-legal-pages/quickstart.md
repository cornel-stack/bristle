# Quickstart / Verification: Slice 009

How to build and verify once implemented. (No code yet — the gate recipe.)

## Pre-flight (already done at plan time)

- PR #7 (slice 008) merged to `main` via merge commit `1f729ba` on 2026-05-24.
- `009-legal-pages` cut from clean `origin/main` (no stacking; branch is 1 commit ahead — the spec commit `715accf`).
- Slice-005 footer Company column links `/terms` (line 33), `/privacy` (line 34), `/security` (line 35), `/gdpr` (line 36) — verified at plan time; **no footer edit this slice**.
- No new top-level deps (TocRail is hand-rolled `IntersectionObserver`, same pattern as slice-006 FAQ rail).

## Local

```bash
pnpm install                                          # no new dep this slice — pnpm-lock.yaml unchanged
pnpm typecheck && pnpm lint
pnpm --filter web build && pnpm --filter web start    # all four legal routes render
```

No DB env required. All four pages are content-static.

## Acceptance checks (map to SC-001 … SC-023)

### Routes resolve (T021)

- **SC-001** — `curl -sI <local>/terms` / `/privacy` / `/security` / `/gdpr` → all HTTP 200.

### Structure (T021)

- **SC-002** — each of the four pages renders: top nav (reused) + LegalHero (eyebrow + headline + last-updated caption) + 2-col body (TocRail left, sectioned content right) + site footer (reused).
- **SC-003** — each page renders **exactly 10** numbered sections in source order. Verifiable by counting `<section data-legal-section=...>` elements per page or `data-legal-section` markers in the SSR HTML.
- **SC-004** — content bodies verbatim match spec §§9-12. Verifiable by grepping each content data file for a distinctive opening phrase per section (e.g. Terms section 1: `"These terms govern your use of Bristle"`; Privacy section 8: `"You can access, correct, export"`; Security section 4: `"All traffic to and from Bristle is encrypted"`; GDPR section 7: `"EU and UK data subjects have the following rights"`).
- **SC-005** — each content data file's first line is `// [PLACEHOLDER — legal review needed before production launch]`. Verifiable via `head -1 apps/web/src/components/legal/{terms,privacy,security,gdpr}-content.ts`.

### TocRail behavior (T021)

- **SC-006** — TocRail renders **10 anchor links** on desktop (sticky vertical) AND **10 horizontal pill anchors** on mobile (below `md`).
- **SC-007** — clicking a TocRail anchor smooth-scrolls to the matching section. With OS reduced-motion ON, scroll becomes instant.
- **SC-008** — as the visitor scrolls each page, the TocRail's active state follows the topmost-visible section (same rule as slice-006 FAQ rail).
- **SC-009** — the active TocRail anchor carries `aria-current="location"`; non-active anchors do NOT carry that attribute.
- **SC-010** — on mobile (`<md`), the horizontal pill row auto-scrolls the active pill into view as the visitor scrolls; instant under reduced-motion.

### Deep-link anchors (T021)

- Visiting `<local>/terms#cancellation-refunds` lands the visitor scrolled to the matching `<section id="cancellation-refunds">`. The TocRail's 6th item becomes `aria-current="location"` within ~100ms of load.

### Slice-005 footer regression check (T021)

- **SC-014** — from `<local>/`, click footer Legal column "Terms" → lands on `/terms` (HTTP 200, was 404). Repeat for "Privacy", "Security", "GDPR" — each lands on its matching page. `apps/web/src/components/landing/site-footer.tsx` is **unchanged** in `git diff --stat`.

### Visual diff (T021 + T022, human-only)

- **SC-011** — `/terms` at 1280 width vs `design/Public_pages.pdf` page 10 within 4px tolerance per section. The other three routes (`/privacy`, `/security`, `/gdpr`) apply the same template; structural correctness is reviewed via code review + Lighthouse, NOT pixel-diffed (no PDFs exist for those three).

### Responsive sweep (T021)

- **SC-012** — sweep at 320 / 375 / 768 / 1024 / 1280 / 1440 on all four routes — no h-scroll / overlap / clip; TocRail collapses to horizontal pill row at and below `md`.

### Metadata (T021)

- **SC-013** — each of the four routes emits `<title>` (per FR-016), `<meta name="description">`, `og:title`, `og:description`, `og:url` (absolute, from `SITE_URL`), `og:image` (absolute, slice-005 raster). **No `<meta robots>`** in body on any of the four.

### Build (T021)

- **SC-015** — `pnpm typecheck && pnpm lint && pnpm --filter web build` all exit 0.
- **SC-016** — First Load JS for each of the four legal routes < 180 KB gz. Expected: ~107-110 KB each (slice-005 baseline + TocRail ~1-2 KB). If ≥130 KB on any, investigate — likely an accidental bundle leak (zod / Radix Accordion / Resend SDK).
- **SC-019** — build output marks all four legal routes as `○ Static`.
- **SC-023** — `pnpm-lock.yaml` is unchanged (`git diff --stat origin/main..HEAD -- pnpm-lock.yaml` empty).

### Lighthouse (T021, human-only)

- **SC-017** — Lighthouse on each of the four pages on local prod build: Performance / Accessibility / Best Practices / SEO each ≥ 90. SEO 100 on local-prod; SEO 60 on Vercel preview is the documented `x-robots-tag` artifact (preview-only).

### Server/client boundary + additive-only (T021)

- **SC-020** — `grep -l "use client" apps/web/src/components/legal/ apps/web/src/app/{terms,privacy,security,gdpr}/page.tsx` returns **exactly one** file: `toc-rail.tsx`.
- **SC-022** — `git diff --stat origin/main..HEAD` shows zero modifications under `apps/web/src/components/{landing,pricing,faq,about,contact}/`, `apps/web/src/lib/`, `apps/web/src/app/contact/`, `packages/`, or `design/`. Additive only.

### Voice / tokens (T021)

- **SC-021** — greps across `apps/web/src/components/legal/` plus the four `page.tsx` files: zero `#[0-9A-Fa-f]{3,8}` hex literals; zero `font-family`/`font-name` string literals; zero exclamation marks in **user-visible copy** (the `[REVIEW: ...]` markers live in `reviewNote?` fields that are never rendered — exempt); zero emoji; zero "amazing/awesome" register in any rendered prose.

### Reviewer-side checks (T021, human-only — defer to your browser walk)

- Keyboard reach: Tab through `/terms` (and one other) — every TocRail anchor reachable, focus rings visible (FR-019).
- Reduced-motion walk: with OS preference ON, click a TocRail anchor → instant scroll, no animation. Toggle preference OFF mid-session → next click should smooth-scroll without reload.
- TocRail mobile: at 375 width, scroll the page → active pill auto-scrolls into view in the horizontal pill row.

### Preview parity (T022)

- **SC-018** — Vercel preview URL renders all four pages identically to local. No browser-console errors. TocRail behavior identical (smooth-scroll, active tracking, mobile pill auto-scroll).
- Slice-006 / slice-008 regression check: `/pricing` Enterprise card "Contact sales →" still lands on `/contact` (slice 008); `/faq` rail / accordion / bottom CTA still work; landing footer "Help center" still goes to `/faq` (slice 006); landing footer "About" / "Contact" still work (slice 008).
- The four slice-009 footer Legal column links light up live (regression check from the opposite direction — preview-version of SC-014).

## Production

- Vercel env already set for slices 004 / 005 / 006 / 008. **No new env vars** this slice.
- All four legal pages prerender at build time; first paint is instant.
- **No `v0.2.0` tag** from this slice. Tier 2 ships `v0.2.0` only after all of 2.1–2.7 lands. Slice 009 is part-2 of 2.3 — Tier 2 is **5/7** done after merge (counting the interleaved 007 patch: 2.1 ✓, 2.2 ✓, 007 patch ✓, 2.3 part 1 (008) ✓, **2.3 part 2 (009)** ✓; remaining: 2.4 Blog, 2.5 Changelog, 2.6 Public sample problem detail, 2.7 Final wire-up).

## Notes

- **Pre-launch review** of every `[REVIEW: ...]` marker (founder/legal sign-off) happens BEFORE production launch, NOT before slice 009 merge. Slice 009 ships with placeholders intact, marked as such in source. The PR description surfaces every reviewNote verbatim for the eventual pre-launch checklist.
- **Refund-policy alignment** (FR-015): Terms section 6 was authored to align with FAQ q-5 (slice 008, "No automatic refund policy — case-by-case"). Any future slice that edits one MUST audit the other. Permanent cross-slice integrity constraint.
- **Three known cross-page inline links** (`/changelog` → slice-005 stub, `/status` → 404 until slice 2.7, `/privacy/sub-processors` → 404 until follow-up) are documented expected behavior, not slice-009 defects.
- **The TocRail is a structural mirror of the slice-006 FaqScrollSpyRail** — additive only this slice; the eventual shared `SectionScrollSpyRail` refactor is a tracked follow-up.
