# Tasks: Walking Skeleton — Repo + CI/CD + Blank Deploy

**Input**: `specs/001-walking-skeleton/spec.md` + `specs/001-walking-skeleton/plan.md`
**Branch**: `001-walking-skeleton`
**Tests**: none this slice (CI runs typecheck + lint only; Vitest/Playwright arrive later).

## Conventions

- **One commit per task.** Each task lists a suggested commit message.
- **[P]** = parallelizable (touches independent files, no dependency on a sibling in the same phase).
- **[Story]** = the user story it serves: US1 (run locally), US2 (CI), US3 (deploy), or SETUP/FOUND (shared prerequisites).
- Every task has a **Verify** line — the objective check that it is done before committing.
- Do not start a task until its **Depends on** tasks are committed.
- **DO NOT run `/speckit.implement` or write any product code yet** — this is the task list only.

---

## Phase 1: Setup (shared toolchain root)

### T001 · [SETUP] Repo dotfiles
Create `.nvmrc` (`20`), `.editorconfig`, and `.gitignore` per plan.
- **Files**: `.nvmrc`, `.editorconfig`, `.gitignore`
- **Depends on**: —
- **Verify**: `cat .nvmrc` prints `20`; `.gitignore` contains `node_modules/`, `.next/`, `.turbo/`, `.vercel/`.
- **Commit**: `chore: add repo dotfiles (.nvmrc, .editorconfig, .gitignore)`

### T002 · [SETUP] Root package + pnpm workspace
Create root `package.json` (private, `packageManager: pnpm@9.15.9`, `engines.node >=20 <21`, root `build/dev/lint/typecheck` scripts, root devDeps: turbo, typescript, eslint, typescript-eslint, @eslint/js) and `pnpm-workspace.yaml` (globs `apps/web`, `packages/*` — pipeline excluded).
- **Files**: `package.json`, `pnpm-workspace.yaml`
- **Depends on**: T001
- **Verify**: `pnpm -v` resolves; `pnpm m ls` lists no missing-workspace errors (workspaces empty is fine at this point).
- **Commit**: `chore: add root package.json and pnpm workspace`

### T003 · [SETUP] Shared TypeScript base
Create `tsconfig.base.json` (strict, ES2022, `moduleResolution: bundler`, plus the strict flags in the plan).
- **Files**: `tsconfig.base.json`
- **Depends on**: T002
- **Verify**: file is valid JSON (`pnpm dlx tsc --showConfig -p tsconfig.base.json` parses, or JSON lints clean).
- **Commit**: `chore: add base tsconfig (strict, ES2022, bundler)`

---

## Phase 2: Foundational (workspaces that must compile before stories)

> Empty packages and the pipeline placeholder. None ship UI, but US1's typecheck/lint runs across them, so they must exist and compile first.

### T004 · [P] [FOUND] packages/shared stub
Create `packages/shared/{package.json (@bristle/shared), tsconfig.json (extends base), src/index.ts (placeholder export)}`.
- **Files**: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
- **Depends on**: T003
- **Verify**: `pnpm --filter @bristle/shared typecheck` exits 0.
- **Commit**: `chore: add @bristle/shared package stub`

### T005 · [P] [FOUND] packages/db stub
Same shape as T004 for `@bristle/db`.
- **Files**: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/src/index.ts`
- **Depends on**: T003
- **Verify**: `pnpm --filter @bristle/db typecheck` exits 0.
- **Commit**: `chore: add @bristle/db package stub`

### T006 · [P] [FOUND] packages/ui stub
Same shape as T004 for `@bristle/ui`.
- **Files**: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/src/index.ts`
- **Depends on**: T003
- **Verify**: `pnpm --filter @bristle/ui typecheck` exits 0.
- **Commit**: `chore: add @bristle/ui package stub`

### T007 · [FOUND] Root ESLint flat config
Create root `eslint.config.mjs` (`@eslint/js` + `typescript-eslint` recommended; **ignores** `apps/web/**`, `node_modules`, `.next`, `.turbo`, `dist`).
- **Files**: `eslint.config.mjs`
- **Depends on**: T004, T005, T006
- **Verify**: `pnpm dlx eslint packages` exits 0 against the three stubs.
- **Commit**: `chore: add root eslint flat config for packages`

### T008 · [P] [FOUND] Pipeline placeholder
Create `apps/pipeline/README.md` only (no code, no package.json — stays outside the JS/TS toolchain).
- **Files**: `apps/pipeline/README.md`
- **Depends on**: T002 (workspace globs already exclude it)
- **Verify**: `apps/pipeline` has no `package.json`; `pnpm m ls` does not list it.
- **Commit**: `chore: add apps/pipeline placeholder readme`

**Checkpoint**: workspaces resolve and typecheck/lint in isolation; ready for the web app.

---

## Phase 3: User Story 1 — Developer can run the monorepo locally (P1) 🎯 MVP

**Goal**: `pnpm install` → `typecheck`/`lint` green → `pnpm --filter web dev` renders `Bristle — walking skeleton`.
**Independent test**: SC-001, SC-002, SC-003, SC-004, SC-007.

### T009 · [US1] apps/web package + tsconfig
Create `apps/web/package.json` (name `web`, deps next/react/react-dom, devDeps types/tailwind/eslint-config-next; scripts `dev/build/start/lint/typecheck`) and `apps/web/tsconfig.json` (extends base, Next plugin, DOM libs, `@/*` path).
- **Files**: `apps/web/package.json`, `apps/web/tsconfig.json`
- **Depends on**: T003
- **Verify**: JSON valid; `web` filter resolves (`pnpm --filter web exec true`).
- **Commit**: `feat(web): add apps/web package.json and tsconfig`

### T010 · [US1] Tailwind v4 + PostCSS + Next config wiring
Create `apps/web/next.config.ts`, `apps/web/postcss.config.mjs` (`@tailwindcss/postcss`), and `apps/web/src/app/globals.css` (`@import "tailwindcss";`, no tokens).
- **Files**: `apps/web/next.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css`
- **Depends on**: T009
- **Verify**: after T014 install, `pnpm --filter web build` compiles CSS without Tailwind errors (deferred check; structurally valid now).
- **Commit**: `feat(web): wire tailwind v4 via postcss and next config`

### T011 · [US1] Root layout + skeleton page
Create `apps/web/src/app/layout.tsx` (Server Component, `lang="en"`, imports `globals.css`) and `apps/web/src/app/page.tsx` rendering exactly `Bristle — walking skeleton`.
- **Files**: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
- **Depends on**: T010
- **Verify**: `page.tsx` contains the exact em-dash string; no `"use client"`.
- **Commit**: `feat(web): add root layout and walking-skeleton page`

### T012 · [US1] apps/web ESLint (next lint flat config)
Create `apps/web/eslint.config.mjs` using `FlatCompat` extending `next/core-web-vitals` + `next/typescript`.
- **Files**: `apps/web/eslint.config.mjs`
- **Depends on**: T011
- **Verify**: after install, `pnpm --filter web lint` exits 0.
- **Commit**: `chore(web): add next lint flat config`

### T013 · [US1] Turborepo orchestration
Create `turbo.json` with `tasks` for `build` (outputs `.next/**` excl. cache, `dist/**`), `dev` (`cache:false`, `persistent:true`), `lint`, `typecheck` (each `dependsOn ^task`).
- **Files**: `turbo.json`
- **Depends on**: T009 (web scripts), T004–T006 (package scripts)
- **Verify**: `pnpm dlx turbo run typecheck --dry-run` lists web + 3 packages.
- **Commit**: `chore: add turbo.json task pipelines`

### T014 · [US1] Install dependencies + commit lockfile
Run `pnpm install`; commit generated `pnpm-lock.yaml`.
- **Files**: `pnpm-lock.yaml`
- **Depends on**: T013
- **Verify (SC-001)**: install exits 0; only peer-dependency warnings (any other warning category → append written justification to `spec.md`).
- **Commit**: `chore: install dependencies and lock versions`

### T015 · [US1] Local verification gate
No new files — run the full local loop and the gitignore audit.
- **Depends on**: T014
- **Verify**:
  - SC-002 `pnpm typecheck` exits 0 monorepo-wide.
  - SC-003 `pnpm lint` exits 0 monorepo-wide.
  - SC-004 `pnpm --filter web dev` → `http://localhost:3000` renders `Bristle — walking skeleton` and nothing else.
  - SC-007 `git ls-files | grep -E "(node_modules|\.next|\.turbo)"` returns nothing.
- **Commit**: none (verification only) — if a fix is needed, the fix is its own commit referencing the failing SC.

**Checkpoint (US1 done)**: monorepo runs locally end-to-end. This alone is a demonstrable MVP of the slice.

---

## Phase 4: User Story 2 — CI gates every change (P2)

**Goal**: every branch push and PR runs install → typecheck → lint, green.
**Independent test**: SC-005.

### T016 · [US2] GitHub Actions CI workflow
Create `.github/workflows/ci.yml`: triggers `push: ["**"]` + `pull_request`; `concurrency` cancel-in-progress; job `verify` (checkout → pnpm/action-setup@v4 `9.15.9` → setup-node@v4 `node-version-file: .nvmrc`, `cache: pnpm` → `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint`).
- **Files**: `.github/workflows/ci.yml`
- **Depends on**: T015 (scripts proven green locally)
- **Verify**: YAML lints; steps match plan.
- **Commit**: `ci: add install/typecheck/lint workflow`

### T017 · [US2] CI verification gate
Push the branch, open the PR.
- **Depends on**: T016
- **Verify (SC-005)**: GitHub Actions run triggers on the branch push and PR and completes green.
- **Commit**: none (verification only).

**Checkpoint (US2 done)**: red CI blocks merge; green confirms soundness.

---

## Phase 5: User Story 3 — Branch → preview → production deploy (P3)

**Goal**: PR yields a Vercel preview; merge to `main` redeploys production within 90s.
**Independent test**: SC-006a, SC-006b.

### T018 · [US3] vercel.json (monorepo deploy of apps/web)
Create repo-root `vercel.json`: `framework: nextjs`, `installCommand: pnpm install --frozen-lockfile`, `buildCommand: pnpm turbo run build --filter=web`, `outputDirectory: apps/web/.next`, `ignoreCommand: npx turbo-ignore web`.
> **Note**: `vercel.json` is strict JSON and cannot carry the turbo-ignore rationale comment from the plan. Capture that rationale in the **commit message body** (and it already lives in `plan.md`), not in the file.
- **Files**: `vercel.json`
- **Depends on**: T015 (build proven locally)
- **Verify**: valid JSON; `pnpm turbo run build --filter=web` succeeds locally, emitting `apps/web/.next`.
- **Commit**: `chore: add vercel.json for monorepo deploy of apps/web` (body explains turbo-ignore vs git-diff)

### T019 · [US3] Vercel dashboard connection (USER-OWNED — prerequisite already completed)
**Not a Claude task / no commit. Now a verification step, not a setup step.** The user has already linked the GitHub repo in the Vercel dashboard with **Root Directory = repository root** and runtime Node 20. This step only confirms the existing project picks up our pushed branch.
- **Depends on**: T018 committed and pushed
- **Verify**: existing Vercel project picks up the pushed branch and produces a preview deploy.

### T020 · [US3] Deploy verification gate
- **Depends on**: T017 (CI green), T018, T019
- **Verify**:
  - SC-006a Vercel **preview** URL for the PR renders `Bristle — walking skeleton`.
  - SC-006b after merge to `main`, **production** URL renders the same within 90s (manual observation — deliberate; no automated timer).
- **Commit**: none (verification only).

**Checkpoint (US3 done)**: full delivery path proven branch → preview → production.

---

## Dependency graph (summary)

```
T001 → T002 → T003 ┬→ T004 ┐
                   ├→ T005 ┼→ T007 ──┐
                   └→ T006 ┘         │
T002 → T008 ─────────────────────────┤  (parallel, independent)
T003 → T009 → T010 → T011 → T012     │
T009,T004-6 → T013 ──────────────────┴→ T014 → T015 → T016 → T017 → T018 → T019 → T020
```

- **Parallelizable**: {T004, T005, T006} together; T008 anytime after T002.
- **Critical path**: T001→T002→T003→T009→T010→T011→T013→T014→T015→T016→T017→T018→T020.

## Task count

20 tasks total — 17 commit-producing (T001–T014, T016, T018; plus any fix commits), 3 verification/manual gates (T015, T017, T019, T020 produce no commit).

## Out of scope (do not add tasks for)

Design tokens/fonts/themes (1.3), Supabase/Drizzle (1.4), auth, product UI, pipeline code, tests, `.claude/commands/` wiring (1.2).
