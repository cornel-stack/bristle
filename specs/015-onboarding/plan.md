# Implementation Plan: Onboarding — Role + Categories (Steps 1–2)

**Branch**: `015-onboarding` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-onboarding/spec.md`

**Base**: `c6f8025` (slice-014 merge `976b863` + the `design/onboarding/` PNGs). **Spec committed**: `dcb5f37`.

**Guard**: Planning only — do NOT implement. Output is plan + design artifacts; `/speckit.tasks` and implementation are separate steps.

## Summary

Insert a two-step onboarding (role → 3–5 categories) between slice-014's email verification and `/account`, capturing personalization inputs for future product surfaces without yet acting on them. New routes `/onboarding/role` + `/onboarding/categories` compose a new full-width `OnboardingShell` (not the auth split-screen) over four server primitives and two client-island selectors, backed by three Server Actions (`saveRole`, `saveCategories`, `skipOnboarding`) and a migration (`0003`: four additive `users` columns, including the schema's first `text[]`). A canonical categories constant in `packages/shared` is the single source of truth for the grid and server-side slug validation. Onboarding is mandatory-but-skippable; the routing is gated by sign-in (edge middleware, cookie-only) + completion state (server-side page guards).

**No new technology** (§3 unchanged). The slice reuses slice-014's Auth.js v5 config, the auth primitives (overline, error banner), the design tokens, and the Drizzle/Supabase `db` package. Two **plan-phase findings** shrink the cross-slice footprint vs the brief — the completion-based redirects are page-level guards (the edge middleware can't read the DB), and the session-callback / `next-auth.d.ts` / `verifyEmailCode` touches are unnecessary (D2/D3). Estimated **~19 tasks across 7 STOPs**.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict), Next.js 15.5 App Router, React 19, Node 20 (Vercel). Unchanged.

**Primary Dependencies (this slice)**: **None new.** Reuses `drizzle-orm@0.45.2`, `postgres@3.4.9`, `next-auth@5.0.0-beta.31`, `lucide-react@1.16.0`, `zod`. Categories are a plain TS constant; no library.

**Storage**: Supabase Postgres (existing). **Four additive `users` columns** via Drizzle migration `0003` applied with the existing `db:migrate` runner against `DATABASE_URL_DIRECT`. First `text[]` column (`watched_categories`).

**Testing**: Vitest available but unwired in web (as 005–014). Verification is the gate phase (typecheck/lint/build + per-route bundle + e2e walks + slug/role validation). A DB-helper smoke (like slice-014's) covers the Server Actions' persistence logic; the Server Actions themselves are exercised at the preview gate (request-context limit under tsx).

**Target Platform**: Vercel (web), Supabase (db). Edge middleware unchanged in shape (cookie-only); matcher extended.

**Project Type**: Turborepo monorepo. Touches `apps/web` + `packages/db` + `packages/shared` (the categories constant).

**Performance Goals**: First Load JS **< 110 KB** per onboarding route (watch line); well under the §5 180 KB ceiling. Server-first; only the two selectors are client islands.

**Constraints**: WCAG 2.2 AA (single-choice role group + multi-choice category group, keyboard + non-visual state/counts); Bristle voice (§6); tokens-only (§4); server actions are the validation authority (safe without client JS); 2 client islands total.

**Scale/Scope**: 2 pages + 4 server primitives + 2 client islands + 1 actions module + 1 categories constant + migration `0003`. ~2 existing-file touches (middleware matcher + `/account` guard). Estimated **~19 tasks / 7 STOPs**.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.* (CLAUDE.md is the constitution; `.specify/memory/constitution.md` is an unfilled template.)

| §  | Rule | Status |
|----|------|--------|
| §3 | Locked stack | ✅ **No change.** Slice adds no technology — reuses the slice-013/014 Auth.js v5 stack, Drizzle/Supabase, lucide, tokens. §9.5 (propose-before-adding) not triggered; lockfile diff expected EMPTY. |
| §3 | Drizzle, no raw SQL in app code | ✅ Column additions via Drizzle schema + generated migration; the `text[]` uses `text(...).array()`. Server Actions read/write via `@bristle/db` helpers. |
| §4 | Tokens, type scale, radii, motion | ✅ All onboarding UI uses §4 tokens (serif headings, orange overline via the slice-014 component, Inter body, mono where needed). No new tokens. Selectable-card hover stays within tokens (border/elevation, no scale). |
| §5 | Server-first; small bundles; no localStorage; WCAG AA | ✅ 4 of 6 components server-rendered; **2 client islands** (RoleSelector, CategorySelector). No localStorage (selection is component state + server-persisted). <110 KB/route target. |
| §6 | Voice | ✅ All microcopy plain, no exclamation/hype/emoji; aspirational "instant alerts" is forward-promise (C-k), tracked. |
| §9.1 | Never modify `design/` | ✅ The onboarding PNGs are read-only references; the brief's overrides (step "of 2", "Coming soon", no sparklines, "Showing all") are intentional deviations documented as resolved clarifications, raised first (spec C-e…C-i). |
| §9.4 | Build only the slice in front of you | ✅ Steps 1+2 only; tour/settings/dashboard-customization deferred (TF-008…014). |
| §10 | Ask when design silent | The 2 in-scope PNGs cover both steps at desktop. Mobile + the "other" textarea detail are documented defaults (C-b, assumptions), not invention. |

**Result**: PASS. No constitutional violations; no stack change. The optional `CLAUDE.md` edit (D12) is a documentation note in §8, not a locked-decision change (unlike 013/014's §3 edits). No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/015-onboarding/
├── spec.md              # done (committed dcb5f37)
├── plan.md              # this file
├── research.md          # Phase 0 — text[] shape, middleware-vs-guard, cross-slice reduction, first-name, slug validation
├── data-model.md        # Phase 1 — 4 additive users columns, migration 0003, rollback
├── quickstart.md        # Phase 1 — migrate, dev walk, gate commands
├── contracts/
│   └── ui-and-data.md   # Phase 1 — route table, Server-Action contracts, gating rules, component props, categories shape
└── checklists/
    └── requirements.md  # done (committed dcb5f37)
```

### Source Code — files this slice introduces / edits

```text
packages/shared/src/
└── categories.ts                # NEW — Category type + CATEGORIES constant (~18 placeholders, founder // TODO)

packages/db/
├── src/
│   ├── auth-schema.ts           # EDIT — add 4 columns to users (role, role_custom, watched_categories text[], onboarding_completed_at)
│   ├── queries.ts               # EDIT — add saveUserRole / saveUserCategories / completeOnboarding helpers
│   └── index.ts                 # EDIT — re-export new helpers
└── drizzle/
    └── 0003_<name>.sql          # NEW — generated migration (4 ADD COLUMN incl. text[]) + inline rollback

apps/web/src/
├── app/onboarding/
│   ├── role/page.tsx            # NEW — Step 1 server page (guard + OnboardingShell + RoleSelector)
│   ├── categories/page.tsx      # NEW — Step 2 server page (guard + OnboardingShell + CategorySelector)
│   └── actions.ts               # NEW — saveRole / saveCategories / skipOnboarding ("use server")
├── app/account/page.tsx         # EDIT — add the onboarding-incomplete guard (one redirect)
├── middleware.ts                # EDIT — matcher += "/onboarding/:path*" (cookie-gate only)
├── components/onboarding/
│   ├── onboarding-shell.tsx     # NEW (server) — header (logo + ProgressDashes + "Step N of 2" + Skip) + centered content
│   ├── progress-dashes.tsx      # NEW (server) — { current, total } segment indicator
│   ├── role-card.tsx            # NEW (server) — selectable role tile (label wrapping a radio input)
│   ├── category-card.tsx        # NEW (server) — selectable category tile (checkbox)
│   ├── role-selector.tsx        # NEW (client island) — role grid + "other" textarea + preview line + saveRole
│   └── category-selector.tsx    # NEW (client island) — category grid + search + pills + counter + saveCategories
└── lib/onboarding/
    ├── role-options.ts          # NEW — the 6 role definitions (label/description/icon/preview) + ROLE_VALUES + isRole()
    └── guard.ts                 # NEW — shared onboarding-state guard helper used by the 3 pages
```

**Structure Decision**: Onboarding components live under `components/onboarding/` (a new sibling to `components/auth/`), and the role/category definitions + guard under `lib/onboarding/`. The categories constant lives in `packages/shared` (FR-003) so server-side validation and the client grid share one source. The `OnboardingShell` is deliberately separate from `AuthSplitLayout` — designs 3_1/3_2 are centered full-width, not split (so no A1 split-layout reuse). The slice-014 `auth-overline` + `auth-form-banner` are reused directly (FR-022) — imported from `components/auth/`.

## Decisions (the 10 founder items + plan-phase corrections)

### D1 — Schema migration → standalone Batch 0 (founder item 1) ✅ as proposed

Batch 0 / STOP 1: edit `auth-schema.ts` (4 columns) → `drizzle-kit generate` → commit `0003_*.sql` (4 `ADD COLUMN`) + rollback block → `db:migrate` → probe-verify. The `text[]` is `ADD COLUMN "watched_categories" text[]`. Schema TS is edited **before** generate (slice-014 STOP-1 lesson). Unlike `0002`, the four columns are **purely additive, all nullable** — no consuming-code breakage (no NOT-NULL relaxation), so no same-batch app-code forward-port is required. Detail in `data-model.md`.

### D2 — Cross-slice touches: REVISED to 2 trivial edits, NOT 3 slice-014 files (founder item 2)

**Finding:** the brief's three slice-014 extensions are **not needed**:
- **`verifyEmailCode` redirect — UNCHANGED.** It redirects to `/login?verified=true` (a new user is NOT signed in during verify — slice 014 deliberately does not auto-sign-in). After they sign in, they land on `/account` → the `/account` guard (D3) routes them to `/onboarding/role`. So onboarding routing happens post-sign-in via the guard, regardless of the verify redirect. Changing it would be redundant.
- **`auth.ts` session callback + `next-auth.d.ts` — NOT NEEDED.** Their only purpose would be to feed `onboardingCompletedAt` to a consumer that can't otherwise get it. But (a) the edge middleware can't read it (D3), and (b) the onboarding pages + `/account` already read the full user via `getUserByEmail` (for role/name/categories) — so `onboardingCompletedAt` comes from that same row for free.

**Actual existing-file touches (both minimal):** `middleware.ts` (matcher line) + `app/account/page.tsx` (one guard redirect). These are the **discipline moment** — the only edits reaching into shipped surfaces. *Rationale:* fewer touches = less regression surface; the slice-014 auth config stays untouched.

### D3 — Routing: edge middleware gates AUTH; PAGE GUARDS own completion routing (founder items 3 + 5) — KEY CORRECTION

**Finding:** the current `middleware.ts` is **cookie-presence-only by design** (slice-013 R5 — the postgres driver can't run at the edge; it does not call `auth()`). So it **cannot** read `onboardingCompletedAt` at the edge. The brief's "middleware reads the session via `auth()`" (item 5) and "middleware owns all redirect logic" (item 3) are **incompatible** with this architecture.

**Decision:**
- **Edge middleware (cookie-only):** `matcher` gains `"/onboarding/:path*"`. Both `/account/:path*` and `/onboarding/:path*` require a session cookie → absent → `/login?callbackUrl=<pathname>`. This is the only middleware change.
- **Page-level guards (server components, DB-aware — they already read the user):**
  - `/account` page: `if (!user.onboardingCompletedAt) redirect("/onboarding/role")`.
  - `/onboarding/role` + `/onboarding/categories` pages: `if (user.onboardingCompletedAt) redirect("/account")`.
  - `/onboarding/categories` page additionally: `if (!user.role) redirect("/onboarding/role")` (resume guard, FR-023).
- A small shared helper (`lib/onboarding/guard.ts`) centralizes the read + redirect so the three pages don't drift.

*Rationale:* matches slice-013's established split (edge middleware = fast cookie gate; server `auth()`/DB = authoritative). Keeps DB reads off the edge. The redirects live in one helper, so "page guards" doesn't mean scattered logic.

### D4 — Batch shape: 7 STOPs (founder item 4) ✅ confirmed, ordering pinned

- **Batch 0 / STOP 1** — Constitution (optional §8 note, D12) + migration `0003` (generate + apply + verify).
- **Batch A / STOP 2** — Categories constant + role-options + 4 server primitives (ProgressDashes, RoleCard, CategoryCard, OnboardingShell).
- **Batch A2 / STOP 3** — 2 client islands (RoleSelector, CategorySelector) + bundle baseline.
- **Batch B / STOP 4** — `actions.ts` (saveRole/saveCategories/skipOnboarding) + 2 pages (role, categories) wiring the islands + the onboarding page guards (D3).
- **Batch C / STOP 5** — `middleware.ts` matcher + `/account` guard (the 2 existing-file touches, D2/D3). Lands AFTER Batch B so the redirect targets exist.
- **Batch D / STOP 6** — Edge cases + polish (partial-resume, "other" textarea, search/min-max, error states) + bundle recheck.
- **Batch E / STOP 7** — Gates (local + preview; 5 e2e walks).

~19 tasks. *Rationale:* mirrors slice-014's proven shape at smaller scale; Batch C after B preserves green-per-commit (the `/account` guard redirects to `/onboarding/role`, which must exist first).

### D5 — `onboardingCompletedAt` access (founder item 5) — REVISED

Read from the **DB user** (`getUserByEmail`) in the page guards, **not** from the session and **not** in the middleware. The onboarding pages already need a DB read (saved role to resume, name for the welcome), so `onboardingCompletedAt` is free off that row. No session-callback augmentation, no `next-auth.d.ts` change (see D2). *Alternative considered & rejected:* surfacing it on `session.user` via the callback — its only consumer would be the edge middleware, which can't use it; the pages read the DB anyway, so it adds two slice-014 touches for zero benefit.

### D6 — Client islands: 2 new, 0 rewrites (founder item 6) ✅

`role-selector` (single-select + "other" textarea + preview line) and `category-selector` (multi-select + search + pills + counter + min/max). Both `"use client"` (selection state). The 4 cards/shell/dashes are server. No existing islands rewritten. Total slice-015 `"use client"` files = **2**.

### D7 — Bundle (founder item 7) ✅

Target **< 110 KB** First Load JS for `/onboarding/role` + `/onboarding/categories`. RoleSelector is light (radio state + a textarea); CategorySelector is heavier (search filter + multi-select + pills) but dependency-free (no fuzzy-search lib — plain substring). Measured at STOP 3 (island baseline) and STOP 7 (authoritative per-route).

### D8 — Slice-integrity manifest (founder item 8)

- **NEW:** `packages/shared/src/categories.ts`; `components/onboarding/` (6 files); `lib/onboarding/{role-options,guard}.ts`; `app/onboarding/{role,categories}/page.tsx` + `app/onboarding/actions.ts`; `drizzle/0003_*.sql` + meta.
- **EDIT (existing):** `packages/db/src/{auth-schema,queries,index}.ts`; `apps/web/src/middleware.ts` (matcher); `apps/web/src/app/account/page.tsx` (guard); `CLAUDE.md` (§8 note, optional, D12).
- **NOT touched (corrects the brief):** `auth.ts`, `next-auth.d.ts`, `signup/verify-email/actions.ts` — unchanged.
- **Migration:** `0003`, 4 ADD COLUMN. **New env vars:** 0. **New deps:** 0.

### D9 — Process-oddity carry-forwards (founder item 9)

(a) schema TS edited before `drizzle-kit generate`; (b) `noUncheckedIndexedAccess` — relevant for the category slug array (`watchedCategories` is `string[] | null`; the guard read + the validation loop use safe access); (c) `"use server"` modules export only async functions (the actions file); (d) Server-Action smoke is limited under tsx (no request context) → the DB-helper smoke covers persistence; full action coverage at the preview gate; (e) §9.1 spec authority (the design overrides are documented); (f) multi-stage bundle gate (STOP 3 baseline / STOP 7 authoritative).

### D10 — Risks / follow-ups (founder item 10) → Risk Register below; TF-008…014 + carry-forwards in spec.

### D11 — `watched_categories` `TEXT[]` Drizzle shape (pinned)

`watchedCategories: text("watched_categories").array()` → inferred TS type `string[] | null`. Migration SQL: `ADD COLUMN "watched_categories" text[]`. Reads/writes go through `@bristle/db` helpers; the Server Action validates the array is a 3–5-element subset of `CATEGORIES` slugs before persisting. Confirmed against `drizzle-orm@0.45.2` in Research R1.

### D12 — Constitution edit: minimal §8 note, flagged optional

The slice changes **no locked decision** (§3 stack is untouched), unlike 013/014. FR-001 asks for a §8 product-surface note recording the `/onboarding/*` routes. Plan: a one-line §8 addition (the onboarding surface under `apps/web`) as Batch 0 T001, single-purpose commit — but characterized as **documentation, not a locked-decision change**. *Flagged:* this edit is optional; if the founder prefers, Batch 0 can skip it and start at the migration. Recommend the light note for audit continuity.

## Discipline Moments (reviewers note)

1. **Migration `0003`** — third schema migration; first `text[]` column; all-additive-nullable (no constraint relaxation, so no consumer breakage).
2. **The 2 existing-file touches** — `middleware.ts` matcher + `/account` guard. The *only* edits into shipped surfaces; the slice-014 auth config + verify action are deliberately left alone (D2). Reviewers: confirm the diff shows no `auth.ts`/`next-auth.d.ts`/`verifyEmailCode` change.
3. **First `packages/shared` constant consumed by both client + server** — the categories list; the founder replaces the placeholders before STOP 2.

## Risk Register

| # | Risk | Level | Mitigation / Follow-up |
|---|------|-------|------------------------|
| R1 | Edge middleware can't read completion state | RESOLVED (D3) | Completion routing is page-level guards; middleware stays cookie-only. |
| R2 | Placeholder category list ships to users | MEDIUM | Founder replaces `CATEGORIES` before STOP 2 (`// TODO`); gate checks the list is non-placeholder before merge (C-a). |
| R3 | Aspirational copy ("instant alerts", per-role preview) over-promises | LOW | Kept as forward-promise (C-k, FR-010); TF-010/TF-013 track making them real / polishing. |
| R4 | `text[]` round-trip / slug tampering | LOW | Drizzle `.array()` (R1); Server Action validates 3–5 known slugs server-side (FR-014, SC-009). |
| R5 | Deep-link to step 2 before step 1 | LOW | `/onboarding/categories` resume guard redirects to `/onboarding/role` when `role` is null (FR-023). |
| — | Carry-forwards | — | TF-001…007 (slice 014) + slice-013 items (Upstash, HIBP, production migration runbook) remain open. |

## Phase 0 → research.md; Phase 1 → data-model.md, contracts/ui-and-data.md, quickstart.md

All NEEDS CLARIFICATION resolved in `research.md` (no open markers). The 13 spec clarifications (C-a…C-m) are confirmed; C-a (category list) + C-j (button label "Finish →") are founder-resolved. No Complexity Tracking entries.
