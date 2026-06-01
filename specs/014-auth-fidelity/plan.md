# Implementation Plan: Auth Visual + Functional Fidelity (OAuth + Code Verify + Design Refinement)

**Branch**: `014-auth-fidelity` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-auth-fidelity/spec.md`

**Base**: `52dd247` (merged slice-013 head). **Spec committed**: `7ad609b`.

**Guard**: Planning only — do NOT implement. Output is plan + design artifacts; `/speckit.tasks` and implementation are separate steps.

## Summary

Raise the slice-013 auth surface to the `design/auth-pages/` visual contract and add the two day-one expectations: **Google + GitHub OAuth** and a **6-digit code email verification** flow. The defining constraint is **non-destructive extension** — the slice-013 foundation (schema, `apps/web/src/auth.ts` core config, `lib/auth/{password,session,session-cookie,tokens}.ts`, `lib/rate-limit.ts`, `lib/email/shared.ts`, `middleware.ts`, `/account`, the auth-aware top-nav edit) carries forward; only the providers array, five additive `users` columns, the rate-limiter keys, and the email shell are *extended*. What is *replaced* is the presentation-and-flow layer: the five auth pages rebuild against the design, link-based verification retires in favor of code-based verification, and one new surface (`/auth/callback/[provider]`) is added.

Approach: ten shared layout primitives (seven server-renderable, three stateful client islands) compose the editorial split-screen; the providers array goes `[] → [Google, GitHub]` (which also un-blocks the v5 `onlyCredentials`-with-database-strategy assertion, because OAuth providers are non-credentials); OAuth sessions are created by Auth.js + the DrizzleAdapter automatically (credentials sessions stay hand-rolled via `createUserSession`); a new argon2-hashed code path drives signup verification through three new Server Actions; and the five pages + one callback page rebuild on the primitives. Work is sequenced across **8 STOP gates** (Batch 0 schema/constitution → A1 server primitives → A2 client islands → B OAuth → C code-verify → D page rebuilds → E polish → F gates), ~38 tasks.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict), Next.js 15.5 App Router, React 19, Node 20 (Vercel runtime). Unchanged from slice 013.

**Primary Dependencies (this slice)**: **No new runtime dependencies.** Google + GitHub providers ship *inside* the already-installed `next-auth@5.0.0-beta.31` (`next-auth/providers/google`, `next-auth/providers/github`) — no package addition, so §9.5 (propose-before-adding) is not triggered. Carried forward: `@auth/drizzle-adapter@1.11.2`, `@node-rs/argon2@2.0.2` (reused for code hashing), `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `postgres@3.4.9`, `resend`, `zod`. **No zxcvbn** — password strength is hand-rolled (C-spec FR-009).

**Storage**: Supabase Postgres (existing). **Five additive columns on `users` + one constraint relaxation** (`passwordHash` → nullable; see Decision D15 — OAuth users have no password) via Drizzle migration `0002_*`, applied with the existing `db:migrate` runner against `DATABASE_URL_DIRECT`. The `verificationTokens` table is retained (Auth.js Email-provider future) but its rows may be dropped; `accounts` becomes actively written by OAuth (no shape change — slice 013 already provisioned all 11 columns).

**Testing**: Vitest available but unwired in web (same as 005–013). Verification is the gate phase (typecheck/lint/build + per-route bundle budgets + end-to-end walks + email arrival + OAuth round-trips + a11y + slice-integrity diff). No new test harness.

**Target Platform**: Vercel (web), Supabase (db). Edge/Node middleware unchanged (matcher `["/account/:path*"]`).

**Project Type**: Turborepo monorepo. This slice touches `apps/web` and `packages/db`; `packages/ui` / `packages/shared` untouched.

**Performance Goals**: First Load JS **≤ 130 KB** gz per auth route (C-k; up from slice-013's ~107 KB to absorb the new primitives, still well under the §5 180 KB ceiling). Measured at STOP 3 (after the client islands land) and STOP 7 (final polish).

**Constraints**: WCAG 2.2 AA (incl. CodeInput keyboard model + OAuth-callback `aria-live`); credentials forms work without JS (code input / strength meter / requirement pills are progressive enhancements); Bristle voice (§6); tokens-only styling (§4); **6 route-level client islands, budget revised to ≤7** (see D16); in-memory per-instance rate limiting (extended keys).

**Scale/Scope**: ~10 new components + 1 new page + 2 new client islands + 1 new email template + 3 new Server Actions + 1 code lib + 5 page rewrites + 4 form-island rewrites + 5 schema columns + 2 deletions + ~4 edits (auth.ts, session.ts, rate-limit.ts, turbo.json, CLAUDE.md §3). Estimated **~38 tasks across 8 STOPs**.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.* (CLAUDE.md is the project constitution; `.specify/memory/constitution.md` is an unfilled template.)

| §  | Rule | Status |
|----|------|--------|
| §3 | Locked stack — **Auth library / providers** | ✅ **Within the lock.** §3 already names Auth.js v5 (slice-013 amendment) and explicitly says "Google/GitHub OAuth deferred to a later micro-slice (the `accounts` table is provisioned so it is non-breaking)." This *is* that micro-slice: providers `[] → [Google, GitHub]`. FR-001 edits §3 to record OAuth as shipped; SSO/SAML stays deferred. Not a stack change — the planned evolution of an already-locked decision. |
| §3 | No new library without proposing | ✅ **No new dependency.** Google/GitHub providers are submodules of the installed `next-auth`. argon2/adapter/drizzle/resend/zod all reused. §9.5 not triggered. |
| §3 | Drizzle ORM, no raw SQL in app code | ✅ Column additions via Drizzle schema + generated migration; raw SQL only inside the migration file. New query helpers (code consume, unverified-user delete) go through Drizzle in `packages/db`. |
| §3 | Supabase Postgres + Resend | ✅ Retained; code email reuses the slice-013 Resend wiring + `EMAIL_FROM`. |
| §4 | Tokens, type scale, radii, motion | ✅ All primitives use §4 tokens (editorial light/dark, Source Serif Pro headings, Inter UI, JetBrains Mono for the stats ticker + code, orange accent overlines, 6/8/12/999px radii, 180ms motion). No hex literals, no inline `style`, no box-shadow in light mode except overlays. Verified at gate by token/voice greps. |
| §5 | Server-first; small client bundles; Zod shared; no localStorage; perf budgets; WCAG AA | ✅ 7 of 10 primitives server-rendered; **6 route-level client islands** (4 rewritten forms + `verify-email-code-form` + `callback-progress-poller`), budget revised to ≤7 (D16); the 3 leaf interactive components (StrengthMeter/RequirementsList/CodeInput) are imported *into* those islands, not separately mounted. Zod stays server-side (client `import type` only — slice-008/013 discipline). **No localStorage** (sessions are httpOnly cookies; code state is component state + server). The governing constraint is per-route First Load JS ≤130 KB, enforced at STOP 3/7. |
| §6 | Voice: plain, no `!`, no emoji, no hype | ✅ All new microcopy + the code email follow voice; gate greps enforce. The signup trial overstatement is corrected (C-n). |
| §9.1 | Never modify `design/` | ✅ The 6 `design/auth-pages/` PNGs are read-only references; committed as the contract, never edited. |
| §9.4 | Build only the slice in front of you | ✅ OAuth, code-verify, fidelity — nothing beyond. SSO disabled-only; personalization/⌘K removed (tracked follow-ups). |
| §9.6 | No localStorage/sessionStorage | ✅ CodeInput / strength meter / requirement pills are pure React state; no web storage. |
| §10 | Ask when design silent | The 6 PNGs cover all six routes at desktop. Mobile (<768px) and the OAuth-collision UX are not drawn → resolved by documented defaults (spec C-a, edge cases), not invention. Any newly-discovered uncovered state → ask, carried into tasks. |

**Result**: PASS. No constitutional violations; the §3 OAuth enablement is the explicitly-anticipated continuation of the slice-013 lock, not a new stack decision. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/014-auth-fidelity/
├── spec.md              # done (committed 7ad609b)
├── plan.md              # this file
├── research.md          # Phase 0 — code-hash choice, OAuth/session interplay, rememberMe semantics, strength algo, callback routing
├── data-model.md        # Phase 1 — 5 additive users columns, migration 0002, rollback SQL
├── quickstart.md        # Phase 1 — OAuth provider setup, env + turbo.json, migrate, dev walk, gate commands
├── contracts/
│   └── ui-and-data.md   # Phase 1 — route table, Server-Action contracts, email contract, OAuth/callback contract, component prop contracts
└── checklists/
    └── requirements.md  # done (committed 7ad609b)
```

### Source Code (repository root) — files this slice introduces / edits / deletes

```text
packages/db/
├── src/
│   ├── auth-schema.ts            # EDIT — add 5 columns to `users` (snake_case) + drop NOT NULL on passwordHash (D15)
│   ├── queries.ts                # EDIT — add consumeEmailVerificationCode(), deleteUnverifiedUserByEmail(), code setters
│   └── index.ts                  # EDIT — re-export new query helpers + any new inferred types
└── drizzle/
    └── 0002_<name>.sql           # NEW — generated migration (5 ALTER TABLE ADD COLUMN) + inline rollback SQL

apps/web/src/
├── auth.ts                       # EDIT — providers [] → [Google(), GitHub()]; drop pages.verifyRequest (target page deleted); env fail-fast for OAuth secrets
├── lib/
│   ├── rate-limit.ts             # EDIT — new keys: verify-code, resend-code (same check({key,limit,windowMs}) shape)
│   ├── auth-emails.ts            # EDIT — add sendVerificationCodeEmail() wrapper; (keep sendWelcomeEmail/sendPasswordResetEmail)
│   ├── email/
│   │   ├── shared.ts             # EDIT (if needed) — same emailShell pattern; add a code-display block helper
│   │   ├── verify-email-code.ts  # NEW — renderVerifyEmailCodeHtml({code, expiresInMinutes, name?})
│   │   └── verify-email.ts       # DELETE — slice-013 link-based template retired
│   └── auth/
│       ├── session.ts            # EDIT — createUserSession(userId, rememberMe = true): conditional cookie expiry
│       ├── email-verification-code.ts  # NEW — generateCode()/hashCode()/verifyCode() + CODE_TTL_MS/MAX_ATTEMPTS/RESEND_COOLDOWN_MS
│       ├── password.ts           # CARRY-FORWARD (reused by email-verification-code.ts for argon2)
│       ├── session-cookie.ts     # CARRY-FORWARD (cookie name/options/maxAge — unchanged)
│       └── tokens.ts             # CARRY-FORWARD
├── components/auth/
│   ├── auth-split-layout.tsx     # NEW (server) — editorialSide "left"|"right"; mobile collapse
│   ├── editorial-panel.tsx       # NEW (server) — zero-prop-renderable; logo/overline/headline/subhead/testimonial/stats
│   ├── brand-footer-stats.tsx    # NEW (server) — mono stats ticker (static v1)
│   ├── auth-overline.tsx         # NEW (server) — simple | with-counter | multi-step variants
│   ├── or-email-divider.tsx      # NEW (server)
│   ├── password-field.tsx        # NEW (server) — show/hide toggle + optional right-aligned label link
│   ├── oauth-button-row.tsx      # NEW (server) — Google + GitHub <a> to signin URLs + disabled SSO
│   ├── password-strength-meter.tsx     # NEW (client island — state-driven)
│   ├── password-requirements-list.tsx  # NEW (client island — state-driven)
│   ├── code-input.tsx            # NEW (client island — 6-box, keyboard model)
│   ├── callback-progress-poller.tsx    # NEW (client island — polls session, redirects)
│   ├── signup-form.tsx           # REWRITE (client island — + OAuth, strength meter, Terms, name+email grid)
│   ├── login-form.tsx            # REWRITE (client island — + OAuth, Forgot link, Keep-me-signed-in)
│   ├── forgot-password-form.tsx  # REWRITE (client island — new layout, same logic)
│   ├── reset-password-form.tsx   # REWRITE (client island — + strength meter, requirements, confirm-match)
│   ├── verify-email-code-form.tsx      # NEW (client island wrapping CodeInput) — wraps CodeInput + resend + use-different-email
│   ├── auth-schemas.ts           # EDIT — add signup Terms field, verify-code schema; client import-type only
│   ├── auth-card.tsx             # LIKELY RETIRED on rebuilt pages (split layout replaces the centered card) — keep if any flow still uses it
│   └── auth-field.tsx            # CARRY-FORWARD / reused inside new fields where applicable
├── app/
│   ├── signup/
│   │   ├── page.tsx              # REWRITE — split layout, editorial left
│   │   ├── actions.ts            # EDIT — createAccount: code gen+hash+store, Terms capture, route to verify page
│   │   ├── verify-email/
│   │   │   ├── page.tsx          # NEW (replaces route.ts) — code-entry page
│   │   │   ├── route.ts          # DELETE — slice-013 link-based Route Handler retired
│   │   │   └── actions.ts        # NEW — verifyEmailCode, resendVerificationCode, useDifferentEmail
│   │   └── verify-email-sent/    # DELETE (entire dir) — no longer in the flow
│   ├── login/
│   │   ├── page.tsx              # REWRITE — split layout MIRRORED (editorial right)
│   │   └── actions.ts            # EDIT — signInWithCredentials reads rememberMe → createUserSession(userId, rememberMe)
│   ├── forgot-password/page.tsx  # REWRITE — split layout, editorial left
│   ├── reset-password/[token]/page.tsx  # REWRITE — split layout MIRRORED (editorial right)
│   └── auth/callback/[provider]/page.tsx # NEW — single-panel progress; auth() check → redirect or poller
└── (turbo.json — EDIT: add 4 OAuth vars to build.env; CLAUDE.md §3 — EDIT: T-Batch0)
```

**Structure Decision**: Primitives live under `components/auth/` (slice-013 precedent). The OAuth callback page sits at `app/auth/callback/[provider]/` — a deliberately *separate* route group from `app/signup|login` because the design shows it as a single centered panel, **not** the split layout (so it does not import `auth-split-layout`/`editorial-panel`). Per-route Server Actions stay colocated (`actions.ts`). The auth core stays at `apps/web/src/auth.ts` (importable as `@/auth`) — **note: the brief calls this `lib/auth.ts`; the real path is `apps/web/src/auth.ts`** (slice-013 Auth.js v5 convention). Code-hash logic is its own module (`lib/auth/email-verification-code.ts`) reusing the argon2 wrapper, mirroring how slice 013 split `password.ts` / `tokens.ts`.

---

## Decisions (the 10 founder-specified items + supporting calls)

### D1 — Schema migration sequencing → **standalone Batch 0** (founder item 1)

**Decision**: A dedicated **Batch 0 / STOP 1** carrying (a) the CLAUDE.md §3 OAuth edit as a single-purpose commit and (b) the schema migration: `drizzle-kit generate` → commit `0002_*.sql` (5 `ADD COLUMN`s) → `db:migrate` to the DB → probe-verify the columns exist.

**Rationale**: The five `users` columns are a hard prerequisite for Batch C's verify/resend actions (they read/write `email_verification_code*` / `email_verification_attempts`) and Batch D's signup Terms capture (`terms_accepted_at` / `terms_version`). Folding them into A1 would entangle a load-bearing, hard-to-roll-back DB change with pure component scaffolding. This mirrors slice-013's Batch A→B (foundation→migration) sequencing, pulled earlier. The constitution edit rides here because everything downstream assumes OAuth is recorded as in-scope (same logic as slice-013's T001).

### D2 — `createUserSession` rememberMe extension (founder item 2)

**Decision**: Extend the slice-013 signature `createUserSession(userId)` → `createUserSession(userId, rememberMe = true)`. When `rememberMe` is true (default), behavior is byte-identical to today (30-day cookie `expires`). When false, the **cookie** is set session-only (omit `expires`/`maxAge` so it drops at browser close); the DB `sessions.expires` row stays 30 days (harmless; lazily cleaned). `login/actions.ts` (`signInWithCredentials`) reads the "Keep me signed in" checkbox from `LoginForm` and passes it through. **rememberMe is credentials-only** — OAuth sessions are created by Auth.js + the adapter (Decision D6b), always 30-day, with no checkbox in the OAuth button flow.

**Rationale**: Additive parameter with a backward-compatible default = not a wholesale rewrite of a "preserved" module; the only caller is the login action. Making the cookie (not the DB row) session-only is the minimal correct mechanism for SC-009 and matches the founder's `maxAge: rememberMe ? 30d : undefined` directive. Recorded in Assumptions so reviewers don't read "session.ts unchanged" too literally.

### D3 — Batch shape with A1/A2 split → **8 STOPs confirmed** (founder item 3)

**Decision**: Adopt the founder's 8-STOP shape (Batch 0, A1, A2, B, C, D, E, F) exactly. Keep Batch 0 standalone (not folded into A1) per the founder's own preference and D1's rationale.

**Rationale**: Slice 013 ran 6 STOPs for ~26 tasks; slice 014 is larger (~38 tasks) and the A1/A2 split isolates the bundle-budget-sensitive client islands (A2) behind their own STOP so the 130 KB measurement happens the moment they land (Decision D7). 8 STOPs ≈ 4–5 tasks each — reviewable. The load-bearing nature of schema work justifies its own gate over saving one STOP. **Confirmed, not revised.**

### D4 — Batch B and Batch C are **parallel-eligible** (founder item 4)

**Decision**: Mark B (OAuth) and C (code-verify) as parallel-eligible after their shared prerequisites land. B touches `auth.ts` + the OAuth callback page + env/turbo; C touches `lib/auth/email-verification-code.ts` + the new email template + the verify Server Actions + the `users` columns. **C's prerequisites are Batch 0 (schema) and A2 (CodeInput) — not B.** B's only prerequisite is Batch 0 (and A1's `oauth-button-row` for the buttons, though the buttons can be stubbed). They will likely *land* sequentially due to one-commit-per-task session batching, but reviewers must not enforce a false B→C ordering.

**Rationale (with a correction to the spec's earlier note)**: The spec §Sequencing originally echoed the brief's worry that the callback page "may reference the same primitives as the verify page." Ground-truth check: the OAuth callback page is a **single centered panel** (design 2_6) and does **not** use `auth-split-layout`/`editorial-panel`; its pieces (logo composite, 4-step checklist, `CallbackProgressPoller`) are callback-specific. So there is **no shared-primitive coupling** between B and C. The real confluence is Batch **D**'s `/signup/verify-email` page, which needs `code-input` (A2) **and** `verifyEmailCode` (C). Sequence on that, not on B→C.

### D5 — OAuth env-var preview-build trap (founder item 5)

**Decision**: Plan-pin in `quickstart.md` and as Batch B acceptance: (1) four new env vars `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, added to `.env.example` with comments; (2) all four set in Vercel **Production + Preview** scopes **before** Batch B's preview deploy; (3) the four names added to `turbo.json` `build.env` so Turborepo/Vercel pass them through to the build; (4) founder pre-action — create the Google Cloud OAuth Client + GitHub OAuth App with redirect URIs `SITE_URL + /api/auth/callback/{google,github}` (production + any preview URL they test from); (5) use `vercel env add NAME preview --git-branch <branch> --force` (the slice-013 CLI footgun: branch scope is not implied, and add can silently no-op without `--force`).

**Rationale**: `auth.ts` fails fast at module load if an OAuth secret is missing (FR-014). That is exactly the slice-013 `AUTH_SECRET is not set` preview-build death at "Collecting page data" (memory: [vercel-auth-build-env]). The `turbo.json build.env` declaration is the specific fix that made AUTH_SECRET work; the same is mandatory for the four OAuth vars or the preview build dies even with the values present in Vercel. This is the single highest-risk operational step of the slice.

### D6 — OAuth callback page sequencing + redirect target (founder item 6)

**Decision (D6a — redirect target)**: OAuth buttons link to Auth.js's signin URL with `callbackUrl=/auth/callback/{provider}` (e.g. `/api/auth/signin/google?callbackUrl=%2Fauth%2Fcallback%2Fgoogle`). Auth.js handles consent → `/api/auth/callback/google` (existing `[...nextauth]` handler) → creates the session via the adapter → redirects to `/auth/callback/google`. That page calls `auth()`: session now exists → `redirect(callbackUrl ?? "/account")`. If the session is not yet readable (rare race), it renders the 4-step progress UI and `CallbackProgressPoller` polls a lightweight server action every 500ms, redirecting on success or, after **10 s** (C-i), falling back to `/login`.

**Decision (D6b — who creates the session)**: For OAuth, Auth.js + DrizzleAdapter create the `sessions` row and set the cookie automatically (using the pinned `SESSION_COOKIE_NAME`/options from `session-cookie.ts`). The hand-rolled `createUserSession` is **not** called for OAuth — it remains the credentials-only path. Both write the same table/cookie, so `auth()` reads either uniformly.

**Rationale**: Routing through `/auth/callback/[provider]` (rather than straight to `/account`) is what gives the designed progress UI a place to render; in the common fast path it flashes, which is acceptable and matches the design's "this usually takes under a second" copy. Pinning the redirect target removes the Batch B ambiguity the founder flagged. Keeping OAuth on the adapter's session creation avoids re-implementing what Auth.js already does correctly for the OAuth flow and sidesteps the `onlyCredentials` assertion entirely (providers is now non-empty with non-credentials providers).

### D7 — Bundle budget gates at STOP 3 + STOP 7 (founder item 7)

**Decision**: Per-route First Load JS measured and recorded at **STOP 3** (immediately after the A2 client islands land — the first point bundle can regress) and again at **STOP 7** (final polish). Cap **130 KB** per auth route (C-k). Zod stays server-side (client `import type` only); the strength meter / requirements / code input are deliberately dependency-free (no zxcvbn) to protect the budget.

**Rationale**: Slice 013 was ~107 KB with 4 islands; slice 014 adds 2 islands and richer forms. Measuring at STOP 3 catches creep before it compounds through Batch D's page composition; re-measuring at STOP 7 catches polish regressions. Two checkpoints, not one, because the islands and the page composition are the two independent sources of growth.

### D8 — Slice-integrity expected diff vs `52dd247` (founder item 8)

**Decision**: Plan-pin the expected diff so the STOP 8 integrity check has an explicit oracle:

- **WHOLESALE REWRITES (5 pages)**: `signup/page.tsx`, `login/page.tsx`, `forgot-password/page.tsx`, `reset-password/[token]/page.tsx`, and `signup/verify-email/` (was `route.ts` Route Handler → becomes `page.tsx`).
- **DELETIONS (2)**: `app/signup/verify-email-sent/` (entire dir), `app/signup/verify-email/route.ts` (replaced by `page.tsx`). Plus `lib/email/verify-email.ts` (link-based template).
- **REWRITES (4 form islands)**: `signup-form`, `login-form`, `forgot-password-form`, `reset-password-form` (extended for new fields + OAuth + Keep-me-signed-in).
- **NEW**: 1 page (`auth/callback/[provider]`), 10 components (7 server primitives + 3 client islands), 2 client islands (`verify-email-code-form` wrapping CodeInput; `callback-progress-poller`), 1 email template (`verify-email-code.ts`), 1 code lib (`email-verification-code.ts`), 3 Server Actions (`verify-email/actions.ts`).
- **EXTENDED**: `auth.ts` (providers + drop verifyRequest), `lib/auth/session.ts` (rememberMe), `lib/rate-limit.ts` (keys), `lib/auth-emails.ts` (+code wrapper), `lib/email/shared.ts` (maybe), `packages/db/src/{auth-schema,queries,index}.ts` (columns + helpers), `turbo.json` (build.env), `CLAUDE.md` (§3).
- **PRESERVED (must not change)**: `middleware.ts`, `/account`, `lib/auth/{password,session-cookie,tokens}.ts`, the auth-aware top-nav, and every slices 005–012 route/component.

**Rationale**: A fidelity slice touches a lot; an explicit expected-diff manifest converts "did we regress anything?" into a mechanical `git diff --stat 52dd247` review at the gate, and makes any *unexpected* file in the diff a flag.

### D9 — Slice-013 process-oddity carry-forwards (founder item 9)

**Decision**: Carry these into tasks/quickstart as standing constraints: (a) `"use server"` modules export **only async functions** — applies to the three new verify actions and the edited createAccount/login actions; (b) `vercel env add` requires explicit `--git-branch` for branch scope and `--force` to avoid silent no-op; (c) Resend sandbox delivers only to the founder's verified address — real multi-user email testing needs domain verification (TF-007); (d) Supabase `auth.*` schema overlap — any introspection/probe filters `table_schema='public'` (the slice-013 probe already does); (e) never paste DB passwords/secrets into chats; OAuth secrets go to Vercel + `.env.local` only.

**Rationale**: Each of these cost time in slice 013. (a) is a correctness trap (a non-async export in a `"use server"` file is a build error). (b) directly enables D5. (c) bounds what the STOP 8 preview email walk can actually verify (founder's inbox only).

### D10 — Risks / unknowns / tracked follow-ups (founder item 10)

See the **Risk Register** below. Elevated follow-ups (TF-001…007 in spec): OAuth account-link hardening, pricing reconciliation, real login personalization, dynamic editorial stats, ⌘K palette, SSO/SAML, custom-domain email. Slice-013 carry-forwards (Upstash distributed rate-limit, HIBP, production migration runbook) remain open.

### Supporting decisions

- **D11 — Code hashing = argon2id (reuse `lib/auth/password.ts`'s argon2), not SHA-256.** A 6-digit code is only 10⁶ values; a leaked SHA-256 hash is brute-forced offline in microseconds, giving no protection. argon2's deliberate slowness is fine at this volume (one verify per attempt, 5-attempt cap, rate-limited) and protects a leaked DB. Resolved in Research R1.
- **D12 — `pages.verifyRequest` removal.** `auth.ts` currently sets `pages: { signIn: "/login", verifyRequest: "/signup/verify-email-sent" }`; this slice deletes that page. `verifyRequest` is only used by the Auth.js Email provider (not used here), so it is dropped to avoid a dangling target. This is a required `auth.ts` edit beyond the providers array — the brief's "everything else stays" is slightly inaccurate here. Resolved in Research R4.
- **D13 — Password strength algorithm.** Score 0–4 from: length tiers (≥8/≥12/≥16), character-class count (lower/upper/digit/symbol), and a repeat/sequence penalty — pure functions, no dependency. Maps to the design's weak/fair/strong/excellent labels. Spec'd in `contracts/ui-and-data.md`. Resolved in Research R5.
- **D14 — CodeInput a11y model.** Six `<input inputmode="numeric" maxlength="1">` with `aria-label="Digit N of 6"`, roving focus, Backspace-retreat, arrow nav, paste-spread on the first box, and an `aria-live="polite"` "all six digits entered" announcement — no auto-submit (FR-011). Resolved in Research R6.
- **D16 — Client-island budget revised to ≤7 (founder-approved); counting convention pinned.** Slice 013's "≤5 client component files" heuristic is superseded by the new functional requirements (code verify needs CodeInput; OAuth callback needs a poller). An **island** = a route-level interactive boundary a page mounts; **leaf** client components imported into an island are part of that island's bundle, not separate islands. Slice 014 has **6 islands** — `signup-form`, `login-form`, `forgot-password-form`, `reset-password-form`, `verify-email-code-form`, `callback-progress-poller` — within the revised ≤7 budget (1 slot headroom). The 3 leaf interactive components (`password-strength-meter`, `password-requirements-list`, `code-input`) are `"use client"` but imported into the forms above; they count toward bundle size, not the island budget. Total `"use client"` files = 9. The real ceiling is per-route First Load JS ≤130 KB (D7), not the file count. CLAUDE.md §5 states no hard numeric file cap (the ≤5 was a slice-013 spec FR), so no constitution edit is needed.
- **D15 — `users.passwordHash` must become nullable (discovered, not in the brief).** Slice 013 set `passwordHash NOT NULL` (credentials-only). Auth.js's DrizzleAdapter creates an OAuth user with no `passwordHash`, so the first Google/GitHub signup would hit a NOT NULL violation. Migration `0002` therefore also `ALTER COLUMN passwordHash DROP NOT NULL`, and `signInWithCredentials` must treat a null hash as "no password set" → the same generic invalid-credentials error (never crash, never enumerate). Full detail in `data-model.md`. **Flagged for founder awareness — this is a necessary change beyond the brief's five columns.**

## Implementation Batching (proposed — for `/speckit.tasks`)

> **8 STOP gates.** Estimated **~38 tasks**. B and C are parallel-eligible (D4).

- **Batch 0 / STOP 1 — Constitution + Schema.** §3 OAuth edit (single-purpose commit) · `auth-schema.ts` +5 columns **+ drop NOT NULL on `passwordHash` (D15)** · `drizzle-kit generate` → commit `0002_*.sql` + rollback SQL · `db:migrate` + probe-verify columns. **STOP**: 5 columns present + `passwordHash` nullable in DB; typecheck clean; §3 edit visible.
- **Batch A1 / STOP 2 — Server primitives (7).** `auth-split-layout`, `editorial-panel`, `brand-footer-stats`, `auth-overline`, `or-email-divider`, `password-field`, `oauth-button-row`. **STOP**: each renders in isolation with §4 tokens; zero-prop editorial panel renders; no client JS added.
- **Batch A2 / STOP 3 — Client islands (3) + bundle baseline.** `password-strength-meter`, `password-requirements-list`, `code-input`. **STOP**: live updates correct; CodeInput keyboard model passes; **per-route bundle measured** and ≤130 KB headroom confirmed (D7).
- **Batch B / STOP 4 — OAuth.** `auth.ts` providers + drop verifyRequest + OAuth-secret fail-fast · `.env.example` + `turbo.json build.env` · `/auth/callback/[provider]` page + `callback-progress-poller` · wire `oauth-button-row` hrefs (callbackUrl). **STOP**: Google + GitHub round-trip on preview → `/account`; callback progress renders; SSO disabled. *(Parallel-eligible with C after Batch 0.)*
- **Batch C / STOP 5 — Code-based verify.** `email-verification-code.ts` (argon2) · `verify-email-code.ts` email + `auth-emails.ts` wrapper · `verify-email/actions.ts` (verifyEmailCode/resendVerificationCode/useDifferentEmail) · `createAccount` edit (code gen+store, Terms capture, route to verify) · `packages/db` helpers (consume/delete) · DELETE link template + Route Handler + verify-email-sent dir. **STOP**: signup→code email→correct code→`/login?verified=true`; 5 wrong → new-code; 24s resend cooldown; use-different-email deletes + repopulates. *(Parallel-eligible with B after Batch 0 + A2.)*
- **Batch D / STOP 6 — Page rebuilds.** Rewrite `/signup`, `/login` (mirrored), `/forgot-password`, `/reset-password/[token]` (mirrored); new `/signup/verify-email` page; rewrite the 4 form islands + new `verify-email-code-form`; wire Terms checkbox, Keep-me-signed-in→rememberMe, OAuth rows. Preserve auth-aware nav (verify untouched). **STOP**: 6 routes match design ≤4px at 1280px; verified=true/reset=true banners work; no-JS submit works.
- **Batch E / STOP 7 — Edge cases + polish + bundle recheck.** Login subhead placeholder, email-contacts pill, use-different-email UX, CodeInput a11y pass, error-state polish, responsive sweep 1280/768/375, **bundle recheck ≤130 KB** (D7). **STOP**: a11y + responsive + budget all green.
- **Batch F / STOP 8 — Gates.** T-local (typecheck/lint/build + voice/token greps + **slice-integrity diff vs `52dd247`** per D8 + cross-slice 005–012 regression) · T-preview (OAuth env preflight per D5; integration walks: email signup+code, Google, GitHub, forgot+reset, sign out, `/account` redirect, live callback render). **STOP**: all SC-001…018 verified.

## Discipline Moments (reviewers note)

1. **OAuth enablement** — first non-empty providers array; un-blocks the slice-013 `onlyCredentials` assertion by design. Verify `auth()` still resolves manual credentials sessions after the change.
2. **Second migration on `users`** — additive columns only; rollback SQL inline; the retained-but-emptied `verificationTokens` table is intentional.
3. **First deletions of shipped routes** — link-based verify Route Handler + verify-email-sent page; the STOP 8 diff must show exactly these and nothing more.
4. **Cookie-lifetime branching** — `createUserSession` gains conditional expiry; the "preserved" session module genuinely changes shape (D2).

## Risk Register

| # | Risk | Level | Mitigation / Follow-up |
|---|------|-------|------------------------|
| R1 | OAuth env vars missing/mis-scoped → preview build dies at "Collecting page data" (module-load throw) | **ELEVATED** | D5: set all 4 in Vercel Production+Preview *and* add to `turbo.json build.env` before Batch B deploy; `vercel env add --git-branch --force`. Same trap as slice-013 AUTH_SECRET. |
| R2 | OAuth auto-link to existing same-email account (takeover vector) | ELEVATED | Accepted for v1 (C-m); TF-001 verify-before-link hardening tracked. |
| R3 | Resend sandbox delivers only to founder's address | MEDIUM | STOP 8 email walk uses founder inbox; real multi-user delivery needs domain verification (TF-007). |
| R4 | Bundle creep past 130 KB from new islands | MEDIUM | D7: measure at STOP 3 + STOP 7; no zxcvbn; Zod server-only. |
| R5 | `onlyCredentials` assertion regression if providers logic is mis-edited | MEDIUM | Providers becomes `[Google, GitHub]` (non-credentials) → assertion cannot trip; STOP 4 smoke confirms `auth()` resolves both OAuth and manual credentials sessions. |
| R6 | Deleting verify-email-sent while `pages.verifyRequest` still points at it | LOW | D12: drop `verifyRequest` from `auth.ts` in the same batch as the deletion. |
| R7 | Production migration not applied by this slice | ELEVATED (carry-fwd) | Slice applies to the shared dev/prod Supabase project per the existing runner; production runbook remains a tracked follow-up from slice 013. |
| R8 | OAuth callback race (session not yet readable on page render) | LOW | D6: `CallbackProgressPoller` 500ms poll, 10s fallback to `/login`. |
| R9 | `users.passwordHash NOT NULL` blocks OAuth user creation (first Google/GitHub signup → constraint violation) | **ELEVATED** | D15 / data-model: migration `0002` drops the NOT NULL; `signInWithCredentials` handles null hash as generic invalid-credentials. Discovered in planning, not in the brief. |
| — | Carry-forwards | — | Upstash distributed rate-limit, HIBP, dynamic editorial stats, real personalization, ⌘K, SSO/SAML (TF-001…006). |

## Phase 0 → research.md; Phase 1 → data-model.md, contracts/ui-and-data.md, quickstart.md

All NEEDS CLARIFICATION resolved in `research.md` (no open markers). The 15 spec clarifications (C-a…C-o) are confirmed; C-c/C-m/C-n founder-confirmed. No Complexity Tracking entries (Constitution Check passes).
