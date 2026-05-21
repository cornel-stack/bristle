# Tasks: Design Tokens + Canonical Problem Card

**Input**: `spec.md` + `plan.md` + `research.md` + `data-model.md` + `contracts/` in `specs/003-design-tokens-and-problem-card/`
**Branch**: `003-design-tokens-and-problem-card`
**Tests**: none this slice — the spec requests no Vitest/Playwright; verification is typecheck + lint + build + grep checks + token diff + Lighthouse + visual diff (Vitest/Playwright arrive in a later slice).

## Conventions

- **One commit per task.** Each task lists a suggested commit message.
- **[P]** = parallelizable (independent files, no dependency on an incomplete sibling).
- **[Story]** = US1 (token layer + fonts), US2 (canonical Problem Card), US3 (showcase homepage), or SETUP/FOUND.
- Every task has a **Verify** line — the objective check before committing.
- Do not start a task until its **Depends on** tasks are committed.
- Color/token source of truth: **CLAUDE.md §4.1, §4.1a, §4.2–§4.4**. Mechanism details: **plan.md §1–§5**.

---

## Phase 1: Setup (dependency + config wiring)

### T001 · [SETUP] apps/web → @bristle/ui wiring
Add `@bristle/ui` as a `workspace:*` dependency in `apps/web/package.json`, and add `transpilePackages: ["@bristle/ui"]` to `apps/web/next.config.ts` (so Next compiles the package's `.tsx` source — plan R4/D5).
- **Files**: `apps/web/package.json`, `apps/web/next.config.ts`
- **Depends on**: —
- **Verify**: `package.json` lists `@bristle/ui`; `next.config.ts` contains `transpilePackages: ["@bristle/ui"]`; both parse.
- **Commit**: `chore(web): depend on @bristle/ui and transpile it`

### T002 · [SETUP] packages/ui manifest (deps + exports)
Update `packages/ui/package.json`: add `react`/`react-dom` as `peerDependencies`, `lucide-react` as a dependency (momentum arrows only), `@types/react` as a devDependency, and subpath `exports` for `./problem-card-full`, `./sparkline`, `./source-icons` (keep the `.` barrel).
- **Files**: `packages/ui/package.json`
- **Depends on**: —
- **Verify**: JSON valid; `exports` has the three subpaths + `.`; `lucide-react`, `react` peer, `@types/react` present.
- **Commit**: `chore(ui): add react/lucide deps and subpath exports`

### T003 · [SETUP] packages/ui tsconfig for JSX + DOM
Update `packages/ui/tsconfig.json` to add `jsx: "react-jsx"` and DOM libs (`["DOM", "DOM.Iterable", "ES2022"]`), with an adjacent comment justifying the override of the base config (plan R3, §5 relaxation policy).
- **Files**: `packages/ui/tsconfig.json`
- **Depends on**: —
- **Verify**: JSON valid; `jsx` and `lib` present; comment explains the override.
- **Commit**: `chore(ui): enable react-jsx and DOM libs in tsconfig`

---

## Phase 2: Foundational (install — blocks all component work)

### T004 · [FOUND] Install dependencies + lockfile
Run `pnpm install`; commit the updated `pnpm-lock.yaml`.
- **Files**: `pnpm-lock.yaml`
- **Depends on**: T001, T002, T003
- **Verify**: install exits 0 (peer-dep warnings acceptable); `lucide-react` and `react`/`react-dom` resolve for `@bristle/ui`; `pnpm typecheck` still green across existing workspaces.
- **Commit**: `chore: install ui deps (react, lucide-react) and lock`

**Checkpoint**: workspaces resolve; `apps/web` can import `@bristle/ui`. Token/font work (US1) is independent and may proceed in parallel with this phase.

---

## Phase 3: User Story 1 — Token layer + fonts (Priority: P1) 🎯 MVP

**Goal**: the full Bristle token layer (CLAUDE.md §4) is codified in Tailwind v4 for both Editorial Light and Editorial Dark, and the three brand fonts load.
**Independent test**: SC-001 (token diff vs §4 zero discrepancies), SC-002 (three fonts referenced as tokens). Page still renders; tokens/fonts now available to any component.

### T005 · [US1] Full token layer in globals.css
Replace `apps/web/src/app/globals.css` with the token layer per plan §1: `@theme inline` (13 core color tokens + 16 category tokens as `var()` indirections + 3 font families), plain `@theme` (10 type-scale tokens with line-height/tracking; **semantic spacing tokens** `--spacing-tight` 8, `--spacing-snug` 12, `--spacing-grid` 16, `--spacing-card` 24, `--spacing-loose` 40, `--spacing-section` 64 — additive over Tailwind's **intact** default numeric scale, no px-named shadowing; 4 radius tokens), `:root` (Editorial Light raw hex), `[data-theme="dark"]` (Editorial Dark raw hex). Include a reduced-motion-aware ≤180ms color transition base.
- **Files**: `apps/web/src/app/globals.css`
- **Depends on**: —
- **Verify (SC-001)**: `pnpm --filter web build` compiles CSS without error; every §4.1 + §4.1a token appears in **both** `:root` and `[data-theme="dark"]`; a hex-by-hex diff against CLAUDE.md §4.1/§4.1a reports **zero** discrepancies; type-scale/spacing/radius match §4.2–§4.4.
- **Commit**: `feat(web): codify Bristle design tokens (light + dark) in globals.css`

### T006 · [US1] Load brand fonts in layout.tsx
In `apps/web/src/app/layout.tsx` load `Inter`, `Source_Serif_4`, `JetBrains_Mono` from `next/font/google` (subset `latin`, weights 400/500/600/700, `display:"swap"`, `variable` each), and attach all three `.variable` classNames to `<html>`.
- **Files**: `apps/web/src/app/layout.tsx`
- **Depends on**: T005
- **Verify (SC-002)**: build ok; `<html>` carries `--font-inter`/`--font-source-serif`/`--font-jetbrains`; `font-sans`/`font-serif`/`font-mono` resolve to the loaded faces (no system fallback).
- **Commit**: `feat(web): load Inter, Source Serif 4, JetBrains Mono via next/font`

**Checkpoint (US1 done)**: tokens + fonts are live and diff-clean against §4 — the design substrate MVP.

---

## Phase 4: User Story 2 — Canonical Problem Card (Priority: P2)

**Goal**: the reference `ProblemCardFull` server component (+ `Sparkline`, `SourceIcon`) built to `Core_app.pdf` p.1.
**Independent test**: SC-003 (no `"use client"` in card), SC-004 (zero hex literals in card/sparkline), SC-010 (4px match), plus `pnpm typecheck`.

### T007a · [P] [US2] Source-icon brand marks
Create the six monochrome SVG brand-mark components in `packages/ui/src/source-icons/` (`github.tsx`, `hacker-news.tsx`, `stack-overflow.tsx`, `product-hunt.tsx`, `app-store.tsx`, `google-play.tsx`), each a simple original glyph using `fill="currentColor"` so the parent badge controls color.
- **Files**: `packages/ui/src/source-icons/{github,hacker-news,stack-overflow,product-hunt,app-store,google-play}.tsx`
- **Depends on**: T004
- **Verify**: `pnpm --filter @bristle/ui typecheck` exits 0; each file uses `currentColor` (no hex fills); no `"use client"`.
- **Commit**: `feat(ui): add six inline source-icon brand marks`

### T007b · [US2] SourceIcon dispatch + barrel
Create `packages/ui/src/source-icons/index.ts(x)` exporting `<SourceIcon source: SourceKey />` that dispatches to the right mark (with a neutral fallback) and re-exports the six marks.
- **Files**: `packages/ui/src/source-icons/index.tsx`
- **Depends on**: T007a
- **Verify**: typecheck exits 0; `SourceIcon` maps all six `SourceKey`s + fallback; no `"use client"`.
- **Commit**: `feat(ui): add SourceIcon dispatch and source-icons barrel`

### T008 · [P] [US2] Sparkline (pure generator + component)
Create `packages/ui/src/sparkline.tsx`: pure `buildSparklinePath(values, width, height): string` (normalizes series; flat/single-value → mid-line, no divide-by-zero) and a server `<Sparkline>` rendering inline `<svg aria-hidden><path stroke="currentColor" .../></svg>`.
- **Files**: `packages/ui/src/sparkline.tsx`
- **Depends on**: T004 (independent of T007a/T007b — parallelizable)
- **Verify**: typecheck exits 0; `buildSparklinePath` handles a flat 14-pt series without NaN; stroke is `currentColor` (no hex); `aria-hidden` set; no charting import; no `"use client"`.
- **Commit**: `feat(ui): add pure sparkline path generator and Sparkline svg`

### T009 · [US2] ProblemCardFull component
Create `packages/ui/src/problem-card-full.tsx`: export `CategoryColor`, `SourceKey`, `ProblemCardFullProps`; a static `Record<CategoryColor,string>` of full token utility class strings (+ neutral fallback); `formatRelative(iso)` helper; the card layout per plan §4 / contracts (category pill, `<Sparkline>` header, serif `text-h3` title, `surface/raised` quote box with leading `SourceIcon` avatar, footer with one `SourceIcon` badge per `sources` + momentum arrow (lucide `ArrowUp` `accent/validated` / `ArrowDown` `status/error`) + relative time).
- **Files**: `packages/ui/src/problem-card-full.tsx`
- **Depends on**: T007b, T008
- **Verify (SC-003, SC-004)**: typecheck exits 0; `grep "use client"` → no match; `grep -E "#[0-9A-Fa-f]{3,8}"` → no match; category map strings are static (no runtime interpolation).
- **Commit**: `feat(ui): add canonical ProblemCardFull server component`

### T010 · [US2] Barrel exports
Update `packages/ui/src/index.ts` to re-export `ProblemCardFull`, `Sparkline`, `buildSparklinePath`, `SourceIcon`, and the `CategoryColor`/`SourceKey`/`ProblemCardFullProps` types.
- **Files**: `packages/ui/src/index.ts`
- **Depends on**: T009
- **Verify**: `pnpm --filter @bristle/ui typecheck` exits 0; named imports resolve from both the barrel and the subpaths.
- **Commit**: `feat(ui): export ProblemCardFull, Sparkline, SourceIcon from barrel`

**Checkpoint (US2 done)**: the canonical card compiles, is server-only, and is hex-free — independently verifiable even before any page renders it.

---

## Phase 5: User Story 3 — Showcase homepage (Priority: P3)

**Goal**: homepage shows two cards in Editorial Light with a toggle that flips the whole page to Editorial Dark.
**Independent test**: SC-005 (two cards + toggle), SC-006 (toggle flips `[data-theme="dark"]` on `<html>`, cards switch).

### T011 · [US3] Client theme-toggle wrapper
Create `apps/web/src/app/theme-showcase.tsx` (`"use client"`): props `{ children: ReactNode }`; `useState` theme; on toggle set `document.documentElement.dataset.theme = dark ? "dark" : ""`. Render a labeled, keyboard-reachable toggle `<button aria-pressed>` with a visible focus ring and a responsive grid (`grid gap-grid md:grid-cols-2`) wrapping `{children}`. No storage writes.
- **Files**: `apps/web/src/app/theme-showcase.tsx`
- **Depends on**: T004
- **Verify**: typecheck exits 0; file has `"use client"`; sets `document.documentElement.dataset.theme`; no `localStorage`/`sessionStorage`; button has accessible label + `aria-pressed`.
- **Commit**: `feat(web): add client ThemeShowcase toggle wrapper`

### T012 · [US3] Showcase homepage
Replace `apps/web/src/app/page.tsx` (Server Component) with two inline fixture datasets and a render of `<ThemeShowcase>` wrapping two `<ProblemCardFull {...fixture} />` (e.g. a Payments + an AI/ML card mirroring the PDF). Cards passed as `children` so they stay server-rendered.
- **Files**: `apps/web/src/app/page.tsx`
- **Depends on**: T010, T011
- **Verify (SC-005)**: typecheck exits 0; `page.tsx` has **no** `"use client"`; renders exactly two `ProblemCardFull` + one toggle; does not import `ProblemCardFull` into the client file.
- **Commit**: `feat(web): showcase two ProblemCardFull cards with theme toggle`

**Checkpoint (US3 done)**: the showcase runs end to end; toggling proves the token system in both themes.

---

## Phase 6: Polish & verification gate

### T013 · Local quality gate
No new files — run the full local loop and grep audits.
- **Depends on**: T012
- **Verify**:
  - SC-007 `pnpm typecheck`, `pnpm lint`, `pnpm --filter web build` each exit 0.
  - SC-003 `grep "use client" packages/ui/src/problem-card-full.tsx` → none.
  - SC-004 `grep -E "#[0-9A-Fa-f]{3,8}" packages/ui/src/problem-card-full.tsx packages/ui/src/sparkline.tsx` → none.
  - SC-001 token diff vs CLAUDE.md §4.1/§4.1a → zero discrepancies.
  - SC-006 manual: toggle flips `<html data-theme>`, both cards switch palette.
- **Commit**: none (verification only) — any fix is its own commit referencing the failing SC.

### T014 · Lighthouse on local production build
Run `pnpm --filter web build && pnpm --filter web start`; Lighthouse the showcase.
- **Depends on**: T013
- **Verify (SC-008)**: Performance ≥ 90 **and** Accessibility ≥ 90 on the production-served page.
- **Commit**: none (verification only).

### T015 · Visual fidelity + reduced-motion check
Compare the rendered card against `design/Core_app.pdf` p.1 at 1:1; confirm reduced-motion behavior.
- **Depends on**: T013
- **Verify (SC-010, FR-020)**: pill / sparkline / title / quote box / footer within 4px of the PDF; `prefers-reduced-motion` makes the theme transition instant/opacity-only.
- **Commit**: none (verification only) — token/spacing fixes, if any, are their own commits.

### T016 · Deploy preview parity
Push the branch; confirm the Vercel preview.
- **Depends on**: T013, T014, T015
- **Verify (SC-009)**: preview URL renders the showcase identically to local (two cards, layout, light/dark toggle) within 4px.
- **Commit**: none (verification/deploy only).

---

## Dependencies & Execution Order

### Phase dependencies

```
Setup (T001,T002,T003)  →  Foundational (T004)  →  US2 ((T007a → T007b) ∥ T008 → T009 → T010)  →  US3 (T011, T012)  →  Polish (T013 → T014,T015 → T016)
US1 (T005 → T006)  is independent of Setup/Foundational and of US2; it only feeds US3's visual correctness.
```

- **US1 (P1, MVP)**: T005 → T006. No dependency on the packages/ui plumbing — can run first/in parallel.
- **US2 (P2)**: needs T004. (T007a → T007b) ∥ T008 → T009 → T010.
- **US3 (P3)**: needs US2 (T010) and the toggle (T011); best with US1 done so cards look right.
- **Polish**: after US3.

### Parallel opportunities

- **T001, T002, T003** (Setup) touch different files → all `[P]` together.
- **T007a (brand marks) and T008 (sparkline)** are independent → run together; T007b follows T007a.
- **US1 (T005–T006)** can proceed in parallel with Setup+Foundational+US2 plumbing, since it only touches `apps/web` token/font files.

## Implementation strategy

- **MVP = US1**: codify tokens + fonts (T001-adjacent not required; T005–T006). Diff-clean against §4 is demonstrable value on its own.
- **Increment 2 = US2**: the canonical card (compiles, server-only, hex-free).
- **Increment 3 = US3**: the showcase that renders + toggles — the visible proof.
- Gate (T013–T016) closes SC-001…SC-010, ending in a deployed preview.

## Task count

17 tasks — 13 commit-producing (T001–T006, T007a, T007b, T008–T012), 4 verification/deploy gates (T013–T016, no commit unless a fix is needed).

## Out of scope (no tasks)

next-themes, database/Drizzle, any component beyond ProblemCardFull/Sparkline/SourceIcon, Recharts/charting, auth/dashboard/library, automated tests (Vitest/Playwright).
