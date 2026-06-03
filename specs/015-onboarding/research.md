# Research: Onboarding — Role + Categories (Slice 015)

Phase 0 decisions. Format: **Decision / Rationale / Alternatives considered**. No open `NEEDS CLARIFICATION` markers.

---

## R1 — `watched_categories` as a Postgres `text[]` via Drizzle

**Decision**: `watchedCategories: text("watched_categories").array()` in `auth-schema.ts` → inferred TS type `string[] | null` (nullable, no `.notNull()`). `drizzle-kit generate` emits `ALTER TABLE "users" ADD COLUMN "watched_categories" text[];`. Reads/writes go through `@bristle/db` helpers; the Server Action validates membership + count before persisting.

**Rationale**: `drizzle-orm@0.45.2` supports `.array()` on column builders for native Postgres arrays; the `postgres@3.4.9` driver round-trips `text[]` as a JS string array. A single array column matches the data (an unordered small set of slugs) better than a join table, which would be overkill for a 3–5 element list with no per-row metadata this slice (TF-009 adds metadata later, still not necessarily a join table).

**Alternatives considered**: (a) a `category_selections` join table — rejected as premature normalization for a tiny fixed-size set with no row attributes yet. (b) a JSON/`jsonb` column — rejected; `text[]` is the precise type, indexable and constraint-friendly, and Drizzle models it cleanly. (c) comma-joined `text` — rejected; loses type/query fidelity.

## R2 — Routing: edge middleware (auth) + page-level guards (completion) — the load-bearing finding

**Decision**: keep the slice-013 **cookie-presence-only edge middleware** and extend its `matcher` to include `/onboarding/:path*` (so onboarding requires a session cookie, redirecting to `/login?callbackUrl=` when absent). Put all **completion-state** routing in **server-side page guards** (the pages already read the DB user): `/account` → `/onboarding/role` when incomplete; `/onboarding/*` → `/account` when complete; `/onboarding/categories` → `/onboarding/role` when no saved role. A shared `lib/onboarding/guard.ts` centralizes the logic.

**Rationale**: the existing `middleware.ts` deliberately does NOT call `auth()` and does NOT read the DB — the `postgres` driver cannot run in the edge runtime (slice-013 R5). It only checks the session **cookie token presence**. Therefore it physically cannot read `onboardingCompletedAt` at the edge. Completion routing must live where a DB read is available — the server components — which already fetch the user for role/name/categories, so the guard is free. This matches the slice-013 split (edge = fast cookie gate, server = authoritative).

**Alternatives considered**: (a) **Node-runtime middleware** calling `auth()` (DB-capable) — rejected; slice-013 R5 chose edge cookie-only for performance, and moving the session/DB read to middleware for every matched request is a heavier change than three small page guards. (b) **Surface `onboardingCompletedAt` on the session cookie** — not possible with the database session strategy (the cookie is an opaque token; session data lives in the DB). (c) **Encode completion in a JWT** — rejected; would mean switching off the database strategy that slice-013/014 depend on for password-reset session invalidation.

## R3 — Cross-slice extensions are unnecessary (verify redirect, session callback, types)

**Decision**: do **not** change `signup/verify-email/actions.ts`, `auth.ts` (session callback), or `next-auth.d.ts`. The only existing-file edits are `middleware.ts` (matcher) and `app/account/page.tsx` (the incomplete-→-onboarding guard).

**Rationale**: (a) **verify redirect** — `verifyEmailCode` sends the verified user to `/login?verified=true`; they are not signed in yet (slice 014 intentionally does not auto-sign-in). After sign-in they land on `/account`, where the new guard routes them into onboarding. So the new-user → onboarding path is realized post-sign-in by the `/account` guard, regardless of the verify redirect — changing it is redundant. (b) **session callback + types** — their only value would be feeding `onboardingCompletedAt` to a consumer; the edge middleware can't use it (R2), and the pages read the full user via `getUserByEmail` anyway (for role/name/categories), so the field is free off that row. Adding them would touch two slice-014 files for zero benefit.

**Alternatives considered**: surfacing `onboardingCompletedAt` (+`role`) on `session.user` to save one `getUserByEmail` per page — rejected: onboarding is a one-time, low-traffic flow; the extra indexed lookup is negligible, and avoiding the auth-config touch reduces regression surface (the slice-014 auth stack stays byte-identical).

## R4 — First-name extraction for the welcome overline

**Decision**: `WELCOME TO BRISTLE, {FIRSTNAME}` where `firstName = user.name?.trim().split(/\s+/)[0]`; if `user.name` is null/empty/whitespace, render `WELCOME TO BRISTLE` (no comma, no name). Same logic for OAuth users (provider display name).

**Rationale**: the design (3_1) shows "WELCOME TO BRISTLE, MARLON" — the first whitespace token. A pure server-side derivation on the page (no client logic) keeps it simple. Guarding the empty/whitespace case avoids "WELCOME TO BRISTLE, " with a trailing comma.

**Alternatives considered**: showing the full name — rejected (design shows first name only); a fancier name parser — rejected (overkill; first token is the design's intent).

## R5 — Server-side validation of role + category slugs (the authority)

**Decision**: validate in the Server Actions with shared Zod schemas (in `packages/shared` or colocated, client imports `import type` only — slice-008/014 discipline): role ∈ the fixed `ROLE_VALUES` set; `role_custom` required (non-empty, ≤200) iff role = `other`; `watched_categories` a 3–5-element array whose every element is a known `CATEGORIES` slug (deduped). The client islands enforce min/max + the textarea for UX, but the actions re-validate and are the authority (safe without client JS, FR-025).

**Rationale**: the client grid can be bypassed (no-JS, tampering); the server must reject unknown/duplicate slugs and out-of-range counts (SC-009). `noUncheckedIndexedAccess` applies to the slug loop — use safe iteration (`for (const slug of slugs)`), not index access.

**Alternatives considered**: DB-level CHECK constraints / enum — rejected; the spec wants app-layer validation for forward-flexibility (the role set + category list evolve without a migration).

## R6 — Categories constant in `packages/shared`, consumed by client + server

**Decision**: `packages/shared/src/categories.ts` exports `interface Category { slug; label; description?; iconName? }` and `CATEGORIES: ReadonlyArray<Category>` (~18 design placeholders, each `// TODO`-marked for founder replacement). Both the client `CategorySelector` (grid + search) and the server action (slug validation) import it. No counts/sparkline fields (deferred, FR-016).

**Rationale**: one source of truth prevents client/server slug drift (a tampered slug is rejected against the same list the grid renders). A plain constant (no DB, no library) is the lightest correct option and is tree-shake-friendly for the client bundle. The icon is a lucide name string resolved at render.

**Alternatives considered**: a DB `categories` table — rejected this slice (no per-category data to store; founder edits a constant faster than a seed). Inlining the list in the component — rejected; the server action needs the same list.

## R7 — No new dependencies; gate is verification

**Decision**: zero package additions. Search is a plain case-insensitive `String.includes`; no fuzzy-search library. Selection state is React `useState`. Verification stays at the gate phase (typecheck/lint/build + bundle + e2e walks + a DB-helper persistence smoke), as in 005–014.

**Rationale**: keeps the clean §9.5 story (empty lockfile diff) and the established cadence. A fuzzy-search lib would add bundle weight for ~18 items where substring is sufficient.

**Alternatives considered**: `fuse.js`/`cmdk` for search — rejected (over-engineered for 18 substring matches; bundle cost).

## R8 — `OnboardingShell` is centered full-width, not the auth split-screen

**Decision**: a new server `OnboardingShell` with a top header (Bristle logo left; `ProgressDashes` + "Step N of 2" + "Skip for now" right) over a centered content column (`max-w-5xl`) on `surface-canvas`. It does NOT reuse `AuthSplitLayout`.

**Rationale**: designs 3_1/3_2 are centered, full-width, header-over-content — structurally different from the auth split-screen. Reusing the split layout would fight the design. The slice-014 `auth-overline` + `auth-form-banner` ARE reused (they're layout-agnostic).

**Alternatives considered**: forcing the split layout — rejected (wrong structure). A brand-new overline/banner — rejected (the slice-014 ones fit; FR-022 mandates reuse).

## R9 — Selectable cards as label-wrapped native inputs (form-friendly + a11y)

**Decision**: `RoleCard` renders a `<label>` wrapping a visually-hidden `<input type="radio" name="role">`; `CategoryCard` wraps a `<input type="checkbox">`. The client selectors drive the visual selected state from React state, but the inputs carry the values so the form serializes natively (and degrades without JS). The role group is a single-choice radio group (`name="role"`); the category group is a set of checkboxes whose names/values feed the action (e.g., repeated `name="categories"` values, or a hidden joined field). `aria` reflects single- vs multi-choice and the selected/count state non-visually (FR-025).

**Rationale**: native radio/checkbox give keyboard operability + screen-reader semantics for free and serialize into the Server Action FormData. The selected-state styling (orange border + filled box) is CSS driven off the input's checked state and/or React state.

**Alternatives considered**: `div role="radio/checkbox"` with manual key handling — rejected (re-implements native a11y, error-prone); a single hidden input populated by JS only — rejected (breaks no-JS submit + native semantics).

---

**Open clarifications**: none. The 13 spec clarifications (C-a…C-m) are confirmed; C-a (placeholder list, founder replaces) + C-j ("Finish →") are founder-resolved.
