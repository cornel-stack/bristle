# Tasks: Landing Page

**Input**: `spec.md` + `plan.md` + `research.md` + `data-model.md` + `contracts/` in `specs/005-landing-page/`
**Branch**: `005-landing-page`
**Tests**: none added this slice (no Vitest/Playwright wired yet). Verification is the gate phase — typecheck/lint/build, Lighthouse (prod build), responsive sweep, seed idempotency, route 200+noindex, hex/font/voice greps, and a **human visual-diff vs `design/Public_pages.pdf` p.1** (acceptance-criteria, **not** an automated test).

## Conventions

- **One commit per task.** Each task lists a suggested commit message; verification/deploy gates produce no commit.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (landing renders + reads in voice), US2 (perf/a11y/SEO/responsive floors), US3 (nav stubs), or SETUP.
- Every task has a **Verify** line — the objective check before committing.
- **Batching**: four batches, each ending in **one STOP** for review (per the slice-004 policy). Commit per task within a batch; do not stop between tasks inside a batch.
- **Execution prereqs (user-owned)**: the DB-touching gates (T004 seed, T018 local render) need the existing `apps/web/.env.local` symlink + a reachable Supabase pooler (sandbox DNS has been intermittent). The preview gate (T019) runs on Vercel's network with injected env. Additive-only: ProblemCardFull and the design tokens are NOT modified (§9).

---

## Batch A — shared + db + seed foundation  ▸ STOP 1

### Phase 1: Setup / Foundational

### T001 · [SETUP] SITE_URL constant
Add `packages/shared/src/site.ts` (`export const SITE_URL = "https://bristle.vercel.app" as const;`) and re-export from `packages/shared/src/index.ts`.
- **Files**: `packages/shared/src/site.ts`, `packages/shared/src/index.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter @bristle/shared typecheck` exits 0; `SITE_URL` importable from `@bristle/shared`.
- **Commit**: `feat(shared): add canonical SITE_URL constant`

### T002 · [US1] Query helpers
In `packages/db/src/queries.ts` add `getProblemBySlug(slug): Promise<Problem>` (eq slug, limit 1, **throws** if absent) and `getRecentProblems({ limit, excludeSlug? }): Promise<Problem[]>` (where `ne(slug, excludeSlug)` when provided, `orderBy desc(lastSeenAt)`, `limit`; empty array on empty DB, never throws); export both from `packages/db/src/index.ts`. Preserve `getFirstProblem`.
- **Files**: `packages/db/src/queries.ts`, `packages/db/src/index.ts`
- **Depends on**: —
- **Verify**: `pnpm --filter @bristle/db typecheck` exits 0; both helpers exported; `getFirstProblem` still exported; return type is `Problem`/`Problem[]`.
- **Commit**: `feat(db): add getProblemBySlug and getRecentProblems`

### T003 · [US1] Expand seed to four rows
Update `packages/db/src/seed.ts` to upsert four rows per data-model.md: the Stripe payments row **verbatim** + `llm-streaming-cdn-buffering` (ai-ml), `expo-ota-ios-18-4` (mobile), `pgvector-index-degradation-2m` (devtools) — exact titles, quotes, sources, momentum, 14-pt sparklines, and `lastSeenAt` (ai-ml 22:00 > mobile 20:00 > devtools 18:00 on 2026-05-21); embedding null. Upsert on slug.
- **Files**: `packages/db/src/seed.ts`
- **Depends on**: —
- **Verify**: typecheck exits 0; four `NewProblem` objects; Stripe row unchanged; titles/quotes match data-model.md; categories payments/ai-ml/mobile/devtools; each sparkline length 14.
- **Commit**: `feat(db): expand seed to four problems (payments, ai-ml, mobile, devtools)`

### T004 · [US1] VERIFY — seed the database (gate)
*(Requires `.env.local` + reachable pooler.)* Run `pnpm --filter @bristle/db db:seed` twice.
- **Depends on**: T002, T003
- **Verify**: SC-008 first run upserts, second run no error and still **exactly four** rows (`SELECT count(*)` = 4). SC-009 categories present incl. mobile; Stripe row verbatim; new rows' embedding null.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

**▸ STOP 1** — data layer ready: SITE_URL, two new queries, four seeded rows.

---

## Batch B — reusable card + OG asset  ▸ STOP 2

### Phase 3: User Story 1 / 2 (shared building blocks)

### T005 · [US1] ProblemCardCompact component
Create `packages/ui/src/problem-card-compact.tsx` per the corrected contract: server component (no `"use client"`), props `{ title, category, categoryColor, momentum, sparkline, topQuote, quoteSource, sources, lastSeenIso, href? }`. Layout: `p-grid` (16px) card; header = category pill (left) + **small inline `<Sparkline>`** (top-right, `text-accent-bristle`); `font-serif text-h4` title (2-line clamp); tighter italic `text-body-sm text-text-secondary` quote with leading `SourceIcon` avatar (~2-line clamp); footer = `SourceIcon` source cluster + momentum delta (↑ `accent/validated` / ↓ `status/error`) + relative time. **Drops** the canonical's large-sparkline row, bottom meta line, and "Open report →". Zero hex literals.
- **Files**: `packages/ui/src/problem-card-compact.tsx`
- **Depends on**: T004 (conceptually; component itself only needs the ui package)
- **Verify**: `pnpm --filter @bristle/ui typecheck` exits 0; no `"use client"`; `grep -E "#[0-9A-Fa-f]{3,8}"` → none; renders `<Sparkline>` + a quote + `SourceIcon`; padding token < 24px.
- **Commit**: `feat(ui): add ProblemCardCompact (denser sample-row card)`

### T006 · [US1] Export ProblemCardCompact
Re-export `ProblemCardCompact` + `ProblemCardCompactProps` from `packages/ui/src/index.ts`; add `"./problem-card-compact"` to `packages/ui/package.json` exports.
- **Files**: `packages/ui/src/index.ts`, `packages/ui/package.json`
- **Depends on**: T005
- **Verify**: typecheck exits 0; imports resolve from both `@bristle/ui` and `@bristle/ui/problem-card-compact` (probe).
- **Commit**: `feat(ui): export ProblemCardCompact from barrel and subpath`

### T007 · [P] [US2] OG image asset
Author `apps/web/public/og-image.png` — 1200×630 raster, Bristle wordmark + the headline "Find real problems worth solving." on the `surface/canvas` (#FAFAF7) background, within brand tokens. PNG (not SVG).
- **Files**: `apps/web/public/og-image.png`
- **Depends on**: —
- **Verify**: file exists; `file` reports PNG; dimensions 1200×630.
- **Commit**: `chore(web): add 1200x630 og-image.png`

**▸ STOP 2** — compact card exported; OG asset committed.

---

## Batch C — stub routes + landing section components  ▸ STOP 3

### Phase 4: User Story 3 (nav stubs) + User Story 1 (sections)

### T008 · [P] [US3] ComingSoon stub component
Create `apps/web/src/components/coming-soon.tsx` — a centered token-styled stub taking `{ version: string }`, rendering "Coming in v{version}" with design-system tokens (no raw hex, no off-system type).
- **Files**: `apps/web/src/components/coming-soon.tsx`
- **Depends on**: —
- **Verify**: typecheck exits 0; zero hex; uses tokens; server component.
- **Commit**: `feat(web): add ComingSoon stub component`

### T009 · [US3] Six placeholder routes
Add `apps/web/src/app/{pricing,about,blog,changelog,login,signup}/page.tsx`, each rendering `<ComingSoon version="…" />` (pricing 0.2.2 / about 0.2.3 / blog 0.2.4 / changelog 0.2.5 / login & signup "0.3.X (Tier 3)") and exporting `metadata = { robots: { index: false, follow: false } }`.
- **Files**: six `page.tsx` under `apps/web/src/app/{pricing,about,blog,changelog,login,signup}/`
- **Depends on**: T008
- **Verify (SC-010)**: typecheck exits 0; six route files present; per-route version copy correct; each exports robots:noindex metadata.
- **Commit**: `feat(web): add six soft-404 placeholder routes (noindex)`

### T010 · [P] [US1] TopNav section
`apps/web/src/components/landing/top-nav.tsx` — wordmark + diamond, Pricing/Blog/Changelog/About links, Sign in → `/login`, primary "Start free →" → `/signup`. Responsive wrap below `md`.
- **Files**: `apps/web/src/components/landing/top-nav.tsx`
- **Depends on**: —
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; links present.
- **Commit**: `feat(web): add landing TopNav`

### T011 · [US1] Hero section
`apps/web/src/components/landing/hero.tsx` — receives `{ problem }`; renders announcement pill, serif display headline "Find real problems worth solving.", source paragraph, primary "Start free →" (`/signup`) + secondary "See sample problems" (anchor `#sample`), trial microcopy, and `<ProblemCardFull {...problem}/>` on the right. Stacks below `md`.
- **Files**: `apps/web/src/components/landing/hero.tsx`
- **Depends on**: T006
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; "See sample problems" href is `#sample`; renders ProblemCardFull.
- **Commit**: `feat(web): add landing Hero with live problem-card preview`

### T012 · [P] [US1] SourceStrip section
`apps/web/src/components/landing/source-strip.tsx` — warm band; caption "EVIDENCE FROM WHERE BUILDERS ACTUALLY COMPLAIN" + six `SourceIcon` wordmarks (scaled via `className`, e.g. `size-6`) with text labels. Caption-above + wrap below `md`.
- **Files**: `apps/web/src/components/landing/source-strip.tsx`
- **Depends on**: —
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; reuses `SourceIcon` (no new SVG files).
- **Commit**: `feat(web): add landing SourceStrip`

### T013 · [P] [US1] HowItWorks section
`apps/web/src/components/landing/how-it-works.tsx` — "HOW IT WORKS" eyebrow, serif heading "A research journal that doesn't sleep.", three numbered cards (01 Ingest / 02 Cluster / 03 Synthesize) with icon + body per PDF. 1-up below `md`.
- **Files**: `apps/web/src/components/landing/how-it-works.tsx`
- **Depends on**: —
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; three cards.
- **Commit**: `feat(web): add landing HowItWorks`

### T014 · [US1] SampleReports section
`apps/web/src/components/landing/sample-reports.tsx` — carries `id="sample"` (the hero anchor target); receives `{ problems }`; renders "SAMPLE REPORTS · PUBLIC" eyebrow, "Today's high-signal problems", "Browse the library →" (`/library`, documented out-of-scope 404), and three `<ProblemCardCompact/>` mapped from the rows. `sm:grid-cols-2 lg:grid-cols-3`.
- **Files**: `apps/web/src/components/landing/sample-reports.tsx`
- **Depends on**: T006
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; `id="sample"`; maps row→compact props.
- **Commit**: `feat(web): add landing SampleReports row`

### T015 · [P] [US1] PricingTeaser section
`apps/web/src/components/landing/pricing-teaser.tsx` — dark band; "One price for serious research. One for casual."; Starter $29 / Pro $79 / Team $199 rows; "See full pricing →" (`/pricing` stub). Stacks below `md`.
- **Files**: `apps/web/src/components/landing/pricing-teaser.tsx`
- **Depends on**: —
- **Verify**: typecheck; no `"use client"`; zero hex/font literals; three price rows.
- **Commit**: `feat(web): add landing PricingTeaser`

### T016 · [US1] SiteFooter section
`apps/web/src/components/landing/site-footer.tsx` — brand block + tagline; **disabled** newsletter input + **disabled** Subscribe button + "Email subscriptions launching soon" associated via `aria-describedby` (no submit handler); Product/Company/Resources/Legal columns; bottom row with copyright + literal "v0.2.0 · status: operational".
- **Files**: `apps/web/src/components/landing/site-footer.tsx`
- **Depends on**: —
- **Verify (SC-011/SC-012)**: typecheck; no `"use client"`; zero hex/font literals; input + button both `disabled`; "Email subscriptions launching soon" present + `aria-describedby`; literal status string present.
- **Commit**: `feat(web): add landing SiteFooter (disabled newsletter stub)`

**▸ STOP 3** — all routes + section components exist and typecheck in isolation (not yet wired into the page).

---

## Batch D — page composition + gate  ▸ STOP 4

### Phase 5: User Story 1 + 2 (assembly + floors)

### T017 · [US1] Homepage rewrite + metadata
Replace `apps/web/src/app/page.tsx` wholesale: `export const dynamic = "force-dynamic"`; `const [hero, recent] = await Promise.all([ getProblemBySlug("stripe-webhooks-vercel-cold-starts"), getRecentProblems({ limit: 3, excludeSlug: "stripe-webhooks-vercel-cold-starts" }) ])`; compose `<TopNav/> <Hero problem={hero}/> <SourceStrip/> <HowItWorks/> <SampleReports problems={recent}/> <PricingTeaser/> <SiteFooter/>`. Export `metadata` (title, description, `metadataBase: new URL(SITE_URL)`, full Open Graph set incl. absolute `og:image` = `SITE_URL + "/og-image.png"`, `og:url` = `SITE_URL + "/"`, `type: "website"`).
- **Files**: `apps/web/src/app/page.tsx`
- **Depends on**: T010, T011, T012, T013, T014, T015, T016
- **Verify (SC-003/004/005/013)**: typecheck; `grep -rn "use client" apps/web/src/app/page.tsx apps/web/src/components/landing` → none; uses `getProblemBySlug` (not `getFirstProblem`); sample read uses `excludeSlug`; metadata has title+description+OG set.
- **Commit**: `feat(web): replace homepage with full landing page`

### T018 · [US2] VERIFY — local gate
*(Requires seeded DB + `.env.local`.)* Run the local loop and audits.
- **Depends on**: T017
- **Verify**:
  - SC-014 `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` all exit 0.
  - SC-001 `/` (prod build) renders all seven sections; visual-diff vs `Public_pages.pdf` p.1 within 4px (human review).
  - SC-002 responsive sweep at 320/375/768/1024/1280/1440 — no h-scroll/overlap/clip.
  - SC-015 Lighthouse ≥90 Performance/Accessibility/Best-Practices/SEO; SC-016 First-Load JS < 180 KB gz; SC-017 mobile LCP < 2.5s.
  - SC-019 grep landing source: zero `#hex`, zero hardcoded font-family. SC-020 grep copy: no `!`, no emoji, no "amazing"/"awesome".
  - SC-010 `/pricing /about /blog /changelog /login /signup` each 200 + noindex.
- **Commit**: none (verification only).

### T019 · [US2] VERIFY — deploy preview parity (gate)
Push the branch; confirm the Vercel preview.
- **Depends on**: T018
- **Verify (SC-018/SC-013)**: preview URL renders the landing identically within 4px, no console errors; `https://bristle.vercel.app/og-image.png` (and the preview's OG tags) resolve to the 1200×630 raster.
- **Commit**: none (verification/deploy only).

**▸ STOP 4** — landing live locally and on the preview; slice complete.

---

## Dependencies & Execution Order

```
Batch A: (T001 ∥ T002 ∥ T003) → T004
Batch B: T005 → T006 ; T007 [P]
Batch C: T008 → T009 ; (T010 ∥ T012 ∥ T013 ∥ T015) ; T011 (needs T006) ; T014 (needs T006) ; T016
Batch D: T017 (needs T010–T016) → T018 → T019
```

- **US1** spans the data layer (T002–T004), the compact card (T005–T006), the sections (T010–T016), and the page (T017).
- **US2** = the OG asset (T007) + the perf/a11y/SEO/responsive gate (T018) + preview (T019).
- **US3** = ComingSoon + six stubs (T008–T009), independent of the landing sections.

### Parallel opportunities
- **Batch A**: T001/T002/T003 touch independent files → parallel; T004 (seed) joins them.
- **Batch B**: T007 (OG image) is independent of T005/T006.
- **Batch C**: T008→T009 (stubs) run independently of the sections; T010/T012/T013/T015 are independent section files (parallel); T011 + T014 depend on the compact/full card exports.

## Implementation strategy (4 stops)
1. **Stop 1 (Batch A)**: data layer — SITE_URL, queries, four seeded rows.
2. **Stop 2 (Batch B)**: reusable compact card + OG asset.
3. **Stop 3 (Batch C)**: six stub routes + seven section components (typecheck in isolation).
4. **Stop 4 (Batch D)**: assemble the page + metadata, then the full quality/preview gate.

## Task count
19 tasks — **15 commit-producing** (T001–T003, T005–T017), **4 verification/deploy gates** (T004, T018, T019; plus the seed-gate). Grouped into **4 batches / 4 stops**.

## Out of scope (no tasks)
Newsletter→Resend wiring (2.7); Better Stack status (2.7); real Pricing/About/Blog/Changelog pages (2.2–2.5); `/problems/[slug]` + `/library` (later Tier 2); login/signup real auth (Tier 3); next-themes/theme toggle/Editorial Dark (2.2/2.3); new icon-set/logo/image deps; modifications to ProblemCardFull or tokens; automated test files (Playwright deferred).
