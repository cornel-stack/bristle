# Feature Specification: Walking Skeleton — Repo + CI/CD + Blank Deploy

**Feature Branch**: `001-walking-skeleton`

**Created**: 2026-05-20

**Status**: Draft

**Slice**: Tier 1 · Slice 1.1 (`docs/Bristle-Build-Plan.pdf`)

**Input**: Convert the repo into a Turborepo monorepo (`apps/web`, `apps/pipeline` placeholder, `packages/ui|db|shared`), wire pnpm + Turborepo pipelines, stand up a Next.js 15 App Router app rendering one line of plain text, add GitHub Actions CI (install/typecheck/lint) and a Vercel deploy of `apps/web` on push to `main`.

---

## Overview

This is the first slice of Bristle and the foundation of the whole build. Its only job is to prove the **full delivery path works end-to-end before any product feature exists**: a developer can clone, install, typecheck, lint, and run; a push to `main` turns CI green and ships a live URL within 90 seconds. No design tokens, no database, no auth, no product UI — just the skeleton that every later slice hangs off. The build plan exists because most projects collapse at week six when deployment was bolted on late; this slice de-risks that on day one.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer can run the monorepo locally (Priority: P1)

A developer clones the repository fresh and, with a single install, can typecheck, lint, and run the web app, which serves one plain-text page. This is the inner-loop foundation every subsequent slice depends on.

**Why this priority**: Nothing else can be built or verified until the monorepo installs and runs cleanly. This is the irreducible MVP of the slice.

**Independent Test**: Clone to a clean directory, run `pnpm install`, `pnpm typecheck`, `pnpm lint`, and `pnpm --filter web dev`; confirm `http://localhost:3000` renders `Bristle — walking skeleton`.

**Acceptance Scenarios**:

1. **Given** a fresh clone and a compatible Node/pnpm toolchain, **When** the developer runs `pnpm install`, **Then** installation completes successfully with no errors (only expected peer-dependency warnings, if any).
2. **Given** a completed install, **When** the developer runs `pnpm typecheck`, **Then** it exits zero across the whole monorepo.
3. **Given** a completed install, **When** the developer runs `pnpm lint`, **Then** it exits zero across the whole monorepo.
4. **Given** a completed install, **When** the developer runs `pnpm --filter web dev`, **Then** the Next.js dev server starts and `http://localhost:3000` renders the text `Bristle — walking skeleton` and nothing else.

---

### User Story 2 - Continuous integration gates every change (Priority: P2)

Every push to `main` and every pull request runs an automated workflow that installs dependencies, typechecks, and lints. A red workflow blocks merging; a green one confirms the change is sound.

**Why this priority**: CI is the automated enforcement of Story 1's guarantees and the gate referenced by the SDD workflow. It must exist before product code, but it depends on Story 1 being runnable.

**Independent Test**: Open a PR (or push to `main`) and observe the GitHub Actions workflow run `install → typecheck → lint` and report a green status.

**Acceptance Scenarios**:

1. **Given** the CI workflow is committed, **When** a commit is pushed to `main`, **Then** the workflow triggers and completes green.
2. **Given** the CI workflow is committed, **When** a pull request is opened against `main`, **Then** the workflow triggers and completes green.
3. **Given** a change that breaks types or lint, **When** CI runs, **Then** the workflow fails (non-zero) and surfaces the failing step.

---

### User Story 3 - The branch → preview → production deploy loop ships a live URL (Priority: P3)

Work happens on a per-slice branch. Pushing the branch runs CI and produces a Vercel **preview** deployment for the PR; once the preview is verified and the PR merges to `main`, `main` redeploys to **production**. Both the preview and production URLs render the same plain-text page, and production does so within 90 seconds of the merge.

**Why this priority**: Proving the deploy leg closes the end-to-end loop (DB → server → UI → deploy) that the tier is named for. It depends on a runnable app (Story 1) and is independently demonstrable.

**Independent Test**: Push the `001-walking-skeleton` branch, open a PR, and load the Vercel preview URL — confirm it renders `Bristle — walking skeleton`. Merge to `main`; within 90 seconds load the production URL and confirm the same.

**Acceptance Scenarios**:

1. **Given** Vercel is connected to the repo and configured for the monorepo, **When** the branch is pushed and a PR is opened, **Then** Vercel builds only `apps/web` and publishes a **preview** deployment for the PR.
2. **Given** the preview deployment succeeds, **When** the preview URL is loaded, **Then** it renders `Bristle — walking skeleton`.
3. **Given** the PR is merged, **When** the commit lands on `main`, **Then** `main` redeploys `apps/web` to **production** and the production URL renders `Bristle — walking skeleton` within 90 seconds of the merge.

---

### Edge Cases

- **Wrong Node version locally**: production targets Node 20 LTS while the developer machine runs Node 25. The repo pins the intended version via `.nvmrc`; the build must succeed on Node 20 in CI and on Vercel regardless of the local version.
- **Generated directories committed by accident**: `node_modules`, `.next`, `.turbo`, and build output must be gitignored so they never enter version control.
- **Empty workspace packages**: `packages/ui|db|shared` contain only `package.json` + an index entry point; typecheck and lint must pass over them without requiring real exports yet.
- **Pipeline app has no code**: `apps/pipeline` is a README-only placeholder and must be excluded from the JS/TS toolchain (pnpm workspace, Turborepo tasks, typecheck, lint) so it neither breaks nor blocks any pipeline.
- **PR from a fork / first-time contributor**: CI should still run install/typecheck/lint; Vercel preview behavior for fork PRs follows the provider's defaults and is not a gate for this slice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be a Turborepo monorepo with the structure defined in `CLAUDE.md` §8: `apps/web`, `apps/pipeline`, `packages/ui`, `packages/db`, `packages/shared`.
- **FR-002**: `apps/web` MUST be a Next.js 15 project using the App Router, TypeScript in strict mode, and Tailwind v4 configured and active — but with **no Bristle design tokens, fonts, or theme switching** (those arrive in Slice 1.3).
- **FR-003**: The web app root route MUST render exactly the plain text `Bristle — walking skeleton` and nothing else (no styling beyond defaults, no chrome, no components).
- **FR-004**: `apps/pipeline` MUST contain only a `README.md` placeholder (no Python code) and MUST be excluded from the JS/TS workspace and toolchain.
- **FR-005**: Each of `packages/ui`, `packages/db`, `packages/shared` MUST contain a `package.json` and a single index entry file, and be otherwise empty.
- **FR-006**: The project MUST use **pnpm** as its package manager and define workspaces via `pnpm-workspace.yaml`.
- **FR-007**: Turborepo MUST be configured via `turbo.json` with pipelines for `build`, `dev`, `lint`, and `typecheck`.
- **FR-008**: Root scripts MUST expose `pnpm typecheck` and `pnpm lint` that run across the whole monorepo, and `pnpm --filter web dev` MUST start the web dev server.
- **FR-009**: The Node version MUST be pinned to Node 20 LTS via `.nvmrc`; CI and Vercel MUST build against Node 20.
- **FR-010**: A GitHub Actions workflow at `.github/workflows/ci.yml` MUST run on every push to `main`, every push to a slice branch, and every pull request, executing `pnpm install`, `pnpm typecheck`, and `pnpm lint`. No tests run in this slice.
- **FR-011**: Claude Code MUST produce a repo-root `vercel.json` configured for monorepo deployment of `apps/web`: `framework: "nextjs"`, the root/project directory targeting `apps/web` (or equivalent), and an `ignoreCommand` that skips builds when `apps/web` is unchanged. **Deliberate technical debt for this slice**: the ignore check is scoped to `apps/web` only because it is the sole workspace with real code. When `packages/ui|db|shared` carry code that `apps/web` imports (Slice 1.3+), the check MUST become dependency-aware — that extension is owned by the Slice 1.3 spec, not 1.1. The Vercel **dashboard** connection — linking the GitHub repo, creating/configuring the project, and setting the build command — is performed manually by the user before the branch is pushed (see Assumptions). Vercel MUST build **only** `apps/web`, publish a **preview** deployment for each PR, and redeploy **production** on merge to `main`.
- **FR-012**: `pnpm install` from a fresh clone MUST succeed with no errors (only expected peer-dependency warnings permitted).
- **FR-013**: `git ls-files` MUST return nothing matching `node_modules`, `.next`, or `.turbo` — these MUST be gitignored.
- **FR-014**: `pnpm typecheck` and `pnpm lint` MUST each exit zero across the whole monorepo.

### Technical Constraints — Pinned Versions & Tooling

These majors are locked for this slice; the plan resolves exact minors/patches to latest stable within each major.

- **TC-001**: Next.js **15.x** (latest stable).
- **TC-002**: Tailwind CSS **4.x** (latest stable).
- **TC-003**: TypeScript **5.x** (latest stable).
- **TC-004**: Turborepo **2.x** (latest stable).
- **TC-005**: pnpm **9.x** (latest stable major), declared via `packageManager` in the root `package.json`.
- **TC-006**: Node **20 LTS**, pinned via `.nvmrc`; CI and Vercel build against Node 20.
- **TC-007 (ESLint)**: `apps/web` lints via Next's built-in `next lint` (flat config). Non-Next packages lint via a standalone ESLint setup at the repo root using `@typescript-eslint`, sharing rules with `eslint-config-next` where applicable.
- **TC-008 (tsconfig)**: A base `tsconfig.json` at the repo root sets `strict` mode, `target: ES2022`, and `moduleResolution: bundler`. Each app/package extends the base and applies workspace-specific overrides only.

### Out of Scope (do not build in this slice)

- Any design-system tokens, fonts, or theme switching (Slice 1.3).
- Any Supabase, pgvector, or Drizzle wiring (Slice 1.4).
- Any authentication, product UI, or pipeline code (later tiers).
- Any unit or E2E tests (test infrastructure arrives in later slices).
- Spec Kit command wiring / `.claude/commands/` population (Slice 1.2).

### Key Entities

Not applicable — this slice introduces no data model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm install` from a fresh clone exits with code 0; peer-dependency warnings are acceptable; any other warning category requires a written justification appended to this spec.
- **SC-002**: `pnpm typecheck` exits zero across the whole monorepo.
- **SC-003**: `pnpm lint` exits zero across the whole monorepo.
- **SC-004**: `pnpm --filter web dev` starts the dev server and `http://localhost:3000` renders `Bristle — walking skeleton`.
- **SC-005**: Pushing the slice branch and opening a PR triggers the GitHub Actions workflow and it completes green.
- **SC-006a**: The Vercel **preview** deployment for the PR renders `Bristle — walking skeleton` at its preview URL.
- **SC-006b**: After the PR merges to `main`, the Vercel **production** URL renders `Bristle — walking skeleton` within 90 seconds of the merge. Verified **manually at the slice gate** (load the URL and observe) — this is a deliberate choice; no automated timer asserts the SLA.
- **SC-007**: `git ls-files | grep -E "(node_modules|\.next|\.turbo)"` returns nothing.

## Assumptions

- **Toolchain**: Developers can run pnpm 9.x and a Node toolchain locally; Node 20 LTS is the canonical build target (per `.nvmrc`), while local machines may run Node 25.
- **Branch-per-slice model**: Every slice — including 1.1 — is built on its own branch (`001-walking-skeleton`). The deploy flow is: branch → CI on the branch → Vercel **preview** deployment for the PR → verify preview URL → merge PR to `main` → `main` redeploys to **production** → verify production URL. The 90-second SLA applies to the production deployment specifically.
- **Vercel division of labor**: Claude Code produces only the repo-root `vercel.json` (monorepo config for `apps/web`). The user manually performs the Vercel **dashboard** setup — linking the GitHub repo, creating/configuring the project, and setting the build command — **before** the branch is pushed. The spec treats "connected and deploying `apps/web` to preview + production" as the verifiable outcome.
- **Spec Kit ordering (Slice 1.2)**: Authoring `CLAUDE.md` and running `specify init` were completed as prerequisites to using Spec Kit, so Slice 1.2 is retroactively partial-complete and needs no separate spec; a housekeeping note will be committed after Slice 1.1 merges. No action in this spec.
- **Install warnings**: Per SC-001, peer-dependency warnings are acceptable on `pnpm install`; any other warning category must be justified in writing here before the slice passes its gate.
- **Plain text exactly**: The homepage string is literally `Bristle — walking skeleton` (em dash, matching the build plan's wording), rendered with framework defaults and no Bristle styling.
- **Empty packages compile**: The shared packages export a trivial placeholder (e.g. a single named export or empty module) sufficient for typecheck/lint to pass without real implementation.
- **Tailwind v4 is wired but invisible**: Tailwind is installed and processing styles so later slices can add tokens, but it introduces no visible styling on the skeleton page.
- **CI scope**: CI runs install/typecheck/lint only; deploy verification is Vercel's responsibility, observed via the preview and production URLs rather than asserted inside the GitHub Actions workflow.
