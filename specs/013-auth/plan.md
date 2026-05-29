# Implementation Plan: Production Authentication

**Branch**: `013-auth` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-auth/spec.md`

**Guard**: Planning only — do NOT implement. Output is plan + design artifacts; `/speckit.tasks` and implementation are separate steps.

## Summary

Ship credentials-only production authentication for Bristle: signup → email verify → login → forgot/reset password → session management → sign-out, plus an auth-aware top nav and one middleware-protected `/account` route that proves the loop end-to-end. The slice also performs a **constitution-tier change** (CLAUDE.md §3: Supabase Auth → Auth.js v5) and the project's **second-ever schema migration** (5 new tables). Approach: Auth.js v5 (`next-auth@5.0.0-beta.31`) wired to the existing Drizzle/Supabase Postgres via `@auth/drizzle-adapter`, database session strategy, Argon2id password hashing via `@node-rs/argon2`, three Resend transactional emails reusing the slice-008 `lib/resend.ts` wiring, and five Server-Action forms following the slice-008 discriminated-union-state + raw-value-on-error pattern. Every prior-slice `/signup` and `/login` CTA (9 references / 6 files) flips live by route availability alone.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict), Next.js 15.5 App Router, React 19, Node 20 (Vercel runtime).

**Primary Dependencies (new this slice — exact pins)**:
- `next-auth@5.0.0-beta.31` — Auth.js v5. **Documented stack choice** (Research R1): the `beta` tag is the de-facto production line (npm `latest` is the legacy `4.24.14`), and the entire architecture (`{ handlers, signIn, signOut, auth }`, async-component `auth()`, v5 middleware) is v5-only. The v5 API has been stable through ~4 years of beta. Pinned exactly. Tracked follow-up: bump to `5.0.0` GA when it lands (a version bump, not an architecture revisit).
- `@auth/drizzle-adapter@1.11.2` — depends on `@auth/core@0.41.2`, the **same** core version `next-auth@5.0.0-beta.31` pulls → no peer conflict.
- `@node-rs/argon2@2.0.2` — Argon2id, ships prebuilt `@node-rs/argon2-linux-x64-gnu` (Vercel) + `wasm32-wasi` fallback. (`1.0.4` is deprecated; pin `2.0.2`.)

**Existing dependencies reused**: `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `postgres@3.4.9` (packages/db), `resend` (apps/web, slice 008), `zod` (slice 008), `next-themes` n/a this slice.

**Storage**: Supabase Postgres (existing). 5 new tables via Drizzle. Migrations applied with the **existing `db:migrate` runner** (`packages/db/src/migrate.ts`, slice 004) against `DATABASE_URL_DIRECT` (port 5432, advisory-lock-capable) — not manual psql.

**Testing**: Vitest available but unwired in web (same as 005–012). Verification is the gate phase (typecheck/lint/build + bundle budgets + Lighthouse + end-to-end walks + email arrival + rate-limit + link-flip + schema verification). No new test harness this slice.

**Target Platform**: Vercel (web), Supabase (db). Edge middleware for protected-route matching.

**Project Type**: Turborepo monorepo — `apps/web` (Next.js) + `packages/db` (Drizzle) + `packages/shared` (Zod). This slice touches `apps/web` and `packages/db`; `packages/ui`/`packages/shared` untouched.

**Performance Goals**: First Load JS < 180 KB gz per route (§5). Targets: form pages (`/signup`, `/login`, `/forgot-password`, `/reset-password/[token]`) ~110–115 KB; server-only pages (`/signup/verify-email-sent`, `/account`) ~107 KB.

**Constraints**: WCAG 2.2 AA; no-JS form submission; Bristle voice (§6); tokens-only styling (§4); ≤ 5 client component files; in-memory per-instance rate limiting.

**Scale/Scope**: ~26–30 new source files; 5 DB tables; 3 emails; 5 user flows; 1 protected route; 1 chrome edit; 1 constitution edit. Estimated ~26 tasks across 5 batches.

## Constitution Check

*GATE: Must pass before Phase 0. Re-checked after Phase 1.*

| §  | Rule | Status |
|----|------|--------|
| §3 | Locked stack — **Auth library** | ⚠️ **CHANGED BY THIS SLICE.** §3 currently says "Supabase Auth". FR-001 edits §3 to Auth.js v5 + Drizzle adapter + Argon2. Per §9.5, a stack change must be *proposed first* — it was (this session, recorded in memory `tier2-pivot-and-auth-stack`), and the edit is the slice's first commit with rationale. Supabase Postgres, Drizzle, Resend unchanged. **Gate passes via the documented §3 amendment, not a violation.** |
| §3 | Drizzle ORM, no raw SQL in app code | ✅ All DB access via Drizzle + the adapter. Raw SQL only inside the generated migration file (allowed). |
| §3 | Supabase Postgres + Resend | ✅ Retained. |
| §4 | Tokens, type scale, radii, motion | ✅ Forms/nav/account use tokens only; no hex, no inline style. |
| §5 | Server Components first; ≤ small client bundles; Zod shared; no localStorage; perf budgets; WCAG AA | ✅ Server-first; ≤ 5 client islands (the 4 forms; nav stays server); Zod schemas in `packages/shared` or colocated `*-schema.ts` with `import type`-only client use (slice-008 pattern keeps Zod out of client bundles); **no localStorage** (sessions are server cookies via Auth.js — compliant); budgets enforced at gate. |
| §6 | Voice: plain, no `!`, no emoji, no hype | ✅ All microcopy + 3 emails follow voice; enforced by gate greps. |
| §9.5 | No new library without proposing first | ✅ 3 deps proposed + agreed this session; pinned exactly (FR-003). |
| §9.6 | No localStorage/sessionStorage | ✅ Auth.js uses httpOnly cookies, not web storage. |
| §10 | Ask when design PDFs silent | `design/Authentication.pdf` covers signup/login/forgot/reset/verify/OAuth-callback. The verify-email-sent confirmation and `/account` minimal page should be checked against it; any uncovered state → ask, don't invent (carried into tasks). |

**Result**: PASS. The only constitutional tension is the §3 auth-library swap, which is an authorized, documented amendment executed as the slice's first commit — not an unjustified violation. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/013-auth/
├── spec.md              # done (committed c386ee5)
├── plan.md              # this file
├── research.md          # Phase 0 — decisions incl. the beta-pin finding + version matrix
├── data-model.md        # Phase 1 — 5-table schema, FK graph, indexes, rollback SQL
├── quickstart.md        # Phase 1 — env setup, install, migrate, end-to-end dev walk, gate commands
├── contracts/
│   └── ui-and-data.md   # Phase 1 — route table, Server-Action state contracts, email contracts, nav contract
└── checklists/
    └── requirements.md  # done (committed c386ee5)
```

`data-model.md` **is** produced (the 5-table schema with a FK graph, index decisions, and inline rollback SQL warrants its own artifact — unlike slice 011 which had no schema).

### Source Code (repository root) — files this slice introduces/edits

```text
packages/db/
├── src/
│   ├── auth-schema.ts            # NEW — 5 table defs (users, accounts, sessions, verificationTokens, password_reset_tokens) + inferred types
│   ├── schema.ts                 # EDIT — add `export * from "./auth-schema"` so drizzle-kit (schema:"./src/schema.ts") + the adapter see the tables
│   └── index.ts                  # EDIT — re-export auth tables + types for apps/web consumption
└── drizzle/
    └── 0001_<name>.sql           # NEW — generated migration (5 tables + FKs + indexes) + inline rollback SQL comment block

apps/web/src/
├── auth.ts                       # NEW — NextAuth() config; exports { handlers, signIn, signOut, auth }
├── middleware.ts                 # NEW — protected-path matcher → /login?callbackUrl=…
├── lib/
│   ├── rate-limit.ts             # NEW — in-memory Map limiter; check({key,limit,windowMs})
│   ├── auth-emails.ts            # NEW — send wrappers (sendVerificationEmail/sendPasswordResetEmail/sendWelcomeEmail) reusing lib/resend.ts client
│   └── email/
│       ├── shared.ts             # NEW — brandHeader() + unsubscribeFooter() + base HTML shell
│       ├── verify-email.ts       # NEW — renderVerifyEmailHtml({verifyUrl,name?})
│       ├── password-reset-email.ts # NEW — renderPasswordResetEmailHtml({resetUrl})
│       └── welcome-email.ts      # NEW — renderWelcomeEmailHtml({name?})
├── lib/auth/
│   ├── password.ts               # NEW — hashPassword()/verifyPassword() thin argon2 wrappers
│   └── tokens.ts                 # NEW — generateToken() (32-byte base64url) + expiry helpers
├── components/auth/
│   ├── auth-schemas.ts           # NEW — Zod schemas (signup/login/forgot/reset); client imports `import type` only
│   ├── signup-form.tsx           # NEW (client island 1)
│   ├── login-form.tsx            # NEW (client island 2)
│   ├── forgot-password-form.tsx  # NEW (client island 3)
│   ├── reset-password-form.tsx   # NEW (client island 4)
│   ├── auth-field.tsx            # NEW (server) — shared labeled input + aria-describedby error wiring
│   └── auth-card.tsx             # NEW (server) — shared centered card shell (token styling)
├── components/landing/
│   └── top-nav.tsx               # EDIT — becomes async; branches on auth(); logged-out byte-identical
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NEW — Auth.js handlers (GET/POST)
│   ├── signup/
│   │   ├── page.tsx              # REWRITE (was ComingSoon stub) — server page + <SignupForm>
│   │   ├── actions.ts            # NEW — createAccount Server Action
│   │   ├── verify-email-sent/page.tsx   # NEW — confirmation + resend affordance
│   │   └── verify-email/route.ts        # NEW — Route Handler callback (token → verify → redirect)
│   ├── login/
│   │   ├── page.tsx              # REWRITE (was ComingSoon stub) — server page + <LoginForm>
│   │   └── actions.ts            # NEW — signInWithCredentials Server Action
│   ├── forgot-password/
│   │   ├── page.tsx              # NEW
│   │   └── actions.ts            # NEW — requestPasswordReset Server Action
│   ├── reset-password/[token]/
│   │   ├── page.tsx              # NEW — token lookup + form OR invalid page
│   │   └── actions.ts            # NEW — completePasswordReset Server Action
│   └── account/
│       ├── page.tsx              # NEW — protected; reads auth(); welcome + sign-out form
│       └── actions.ts            # NEW — signOutAction (calls signOut)
└── (CLAUDE.md §3 edit at repo root — T001)
```

**Structure Decision**: Auth.js v5 convention places config at `apps/web/src/auth.ts` (importable as `@/auth`) with the catch-all handler at `app/api/auth/[...nextauth]/route.ts`. Schema lives in `packages/db` per the monorepo boundary (§8). Forms are colocated under `components/auth/`; per-route Server Actions live in each route's `actions.ts` (slice-008 precedent: `app/contact/actions.ts`). Email rendering is split into pure `render*Html` functions (`lib/email/`) from the send wrappers (`lib/auth-emails.ts`) so templates are unit-inspectable and the Resend client stays in one place.

**File count**: ~30 new + 4 edits (schema.ts, index.ts, top-nav.tsx, CLAUDE.md) + 2 rewrites (signup/login page.tsx). Within the ~25–30 estimate (decision 1 ✓).

## Decisions (brief points 1–19)

**1 — Composition / decomposition.** As above. `auth.ts` is the single NextAuth config; 5 routes are Server Component pages each with a colocated `actions.ts`; verify-email is a Route Handler (returns redirect Response); `/account` is a server page reading `auth()`; `middleware.ts` enforces protection. *Rationale*: mirrors Auth.js v5 idioms and the slice-008 page+actions colocation; keeps each flow independently testable.

**2 — §3 edit sequencing.** **T001 = CLAUDE.md §3 edit, single-purpose commit** (no code). *Rationale*: a constitution change deserves its own audit-trail entry; bundling it with deps muddies `git blame`. Everything downstream (deps, `auth.ts`) depends on the decision being recorded first.

**3 — Server/Client boundary (≤5 islands).** Exactly **4 client islands**: `signup-form`, `login-form`, `forgot-password-form`, `reset-password-form` (each needs `useActionState` + raw-value-on-error). `auth-field`/`auth-card` are server. `top-nav` stays server (async, awaits `auth()`). Sign-out is a `<form action={signOutAction}>` submit (no client). Middleware is server/edge. **Budget holds at 4/5** (decision 3 ✓), leaving headroom.

**4 — Dependency versions (pinned).** `next-auth@5.0.0-beta.31`, `@auth/drizzle-adapter@1.11.2`, `@node-rs/argon2@2.0.2`. The v5 `beta` pin is a **settled, documented stack choice** (Research R1) — not a per-session risk. `@auth/core` is transitive (0.41.2, shared) — not declared directly. Expect pnpm peer warnings for `@simplewebauthn/*` + `nodemailer` (optional provider peers we don't use) — documented, non-blocking.

**5 — Migration strategy.** `drizzle-kit generate` (NOT push) → commit `packages/db/drizzle/0001_*.sql`. Apply to dev DB via the **existing `pnpm --filter @bristle/db db:migrate`** runner (slice 004) against `DATABASE_URL_DIRECT` — *not* manual psql (the brief's psql suggestion is superseded; the runner already exists). **Rollback**: inline `-- ROLLBACK` comment block at the migration file's tail with `DROP TABLE` statements in reverse-FK order; on mid-slice failure, run it manually + `git revert` the migration file. Forward-only. (decision 5 ✓, improved)

**6 — Schema (plan-pinned).** Confirmed as the brief specifies, with one note: Auth.js's Drizzle adapter expects specific column names/types — the schema in `data-model.md` matches the adapter's expected shape (camelCase columns, `timestamp mode:"date"`, text `id` defaulted via `gen_random_uuid()`). All 5 tables + FKs (CASCADE on user delete) + indexes (`users.email` unique, `sessions.sessionToken` unique, `accounts(provider,providerAccountId)` unique, `password_reset_tokens.token` unique, plus `verificationTokens` composite PK). Full DDL in `data-model.md`.

**7 — `auth.ts` shape.** `NextAuth({ adapter: DrizzleAdapter(db, {...table map}), session: { strategy: "database", maxAge: 2592000 }, pages: { signIn: "/login", verifyRequest: "/signup/verify-email-sent" }, providers: [Credentials({ authorize })], callbacks: { session } })` exporting `{ handlers, signIn, signOut, auth }`. `authorize()` looks up user by email, `verifyPassword()` via argon2, returns user or null; **does not** itself enforce email-verified (the login action does, so it can show the verify-nudge — see decision 8). `session` callback copies `emailVerified` onto `session.user`. Cookie defaults (httpOnly/secure-in-prod/sameSite=lax) accepted. Full contract in `contracts/ui-and-data.md`.

**8 — Server Action state shape.** Slice-008 discriminated union, extended: `{status:"idle"} | {status:"validation-error", fieldErrors, values} | {status:"transport-error", values} | {status:"rate-limited", retryAfter} | {status:"unverified"}` (login only). Order in each action: **(1) rate-limit check → (2) Zod parse → (3) transport (DB/email/argon2)**. Success uses `redirect()` from `next/navigation` (throws NEXT_REDIRECT; works with `useActionState`) — not a returned success state — for signup/login/reset/verify; `forgot-password` returns a success state (always-success, no redirect) so it can show the neutral "if an account exists…" view. Raw non-password values echoed on every error. *Rationale*: matches `app/contact/actions.ts` precedent; redirect-on-success is cleaner than client-side navigation for the flows that move the user on.

**9 — Email templates.** Pure `render*Html(input): string` in `lib/email/{verify-email,password-reset-email,welcome-email}.ts`; shared `brandHeader()`/`unsubscribeFooter()`/shell in `lib/email/shared.ts`; send wrappers in `lib/auth-emails.ts` call the slice-008 Resend client. Inline styles only, no images, HTML-only (no separate plaintext part this slice — acceptable for transactional; tracked follow-up if deliverability needs it). **New env `EMAIL_FROM`** for auth mail (does NOT touch slice-008 `CONTACT_FORM_FROM` — avoids editing slice-008 code per FR-027). (decision 9 ✓)

**10 — Rate limiting.** `lib/rate-limit.ts` exports `check({key,limit,windowMs}): {allowed, retryAfter?}` over a module-scope `Map<string,{count,resetAt}>`; lazy expiry (prune on read). Key = `${action}:${ip}` where ip = first `x-forwarded-for` hop ?? `x-real-ip` ?? `"unknown"`. Limits: signup 3/h, login 5/min, forgot 3/h. **Per-instance limitation documented**; Upstash Redis is a tracked follow-up. (decision 10 ✓)

**11 — Auth-aware top nav (chrome edit).** `top-nav.tsx` becomes `async`, awaits `auth()`. The right-side `<div>` branches: **logged-out renders the exact current markup** (`<Link href="/login">Sign in</Link>` + `<Link href="/signup">Start free →</Link>`) — byte-identical, verified at gate by curl+grep across slices 005–012; **logged-in** replaces it with `<Link href="/account">{user.name ?? truncateEmail(user.email)}</Link>` + a `<form action={signOutAction}>` sign-out button. **No hamburger menu exists** (the nav uses `flex-wrap`), so only this one div changes — simpler than the brief assumed. Left wordmark + NAV_LINKS unchanged. (decision 11 ✓)

**12 — `/account` minimal protected route.** Server Component; awaits `auth()`; **defensive `if (!session?.user) redirect("/login?callbackUrl=/account")`** even though middleware also guards (belt-and-suspenders against any matcher gap / TOCTOU). Renders `h1` welcome, email (in DOM text, not SR-only), "Member since {createdAt}", verification status, and a sign-out form. Reuses `<TopNav/>` (auth-aware) + `<SiteFooter/>`. No client components. `metadata`: title "Account — Bristle", `robots: noindex`. (decision 12 ✓)

**13 — `middleware.ts` (Auth.js v5 shape).** `export { auth as middleware } from "@/auth"` is the simplest v5 form, but to set `callbackUrl` we wrap: `export default auth((req) => { if (!req.auth) return NextResponse.redirect(new URL(\`/login?callbackUrl=\${req.nextUrl.pathname}\`, req.nextUrl)) })` with `export const config = { matcher: ["/account/:path*"] }`. *Note*: v5 middleware with the **database** session strategy reads the session cookie at the edge; confirm the adapter doesn't require Node APIs unavailable on edge — if it does, set the middleware to the Node runtime (Next 15 supports `runtime: "nodejs"` for middleware) OR rely on the page-level `auth()` guard as the authoritative check and keep middleware as a lightweight cookie-presence redirect. **Resolved in Research R5.** (decision 13 ✓)

**14 — Per-page metadata.** `/signup` + `/login`: indexable, title + ~155-char description (**flips them from the stubs' current `noindex` to indexable** — deliberate, they're public pages). `/signup/verify-email-sent`, `/forgot-password`, `/reset-password/[token]`, `/account`: `noindex`. `/signup/verify-email`: Route Handler, no metadata. (decision 14 ✓)

**15 — ARIA posture.** `<label htmlFor>` on every field (no placeholder-as-label); errors in `<p id role="alert">` linked via `aria-describedby`; `type="password"` (show/hide toggle deferred); autofocus first field on load and first invalid field on error; success banners `aria-live="polite"`; sign-out button has a clear text label; `/account` has an `h1` and visible email. (decision 15 ✓)

**16 — Performance/bundle.** Form pages target ~110–115 KB First Load JS (form island + RHF-free, plain `useActionState`); server-only pages ~107 KB. Zod stays server-side (client imports `import type` only — slice-008 discipline). Middleware adds a small edge bundle. Render modes: `/signup`,`/login`,`/forgot-password` ○ Static; `/reset-password/[token]` ƒ Dynamic (token param + DB lookup); `/account` ƒ Dynamic (session); `/signup/verify-email-sent` ○ Static; `/signup/verify-email` ƒ Dynamic (Route Handler). Documented at gate. (decision 16 ✓)

**17 — Risks / follow-ups.** See Research + the Risk Register below. Elevated: production migration runbook, in-memory rate-limit, HIBP, forgot-password timing leak, edge-runtime session read (R5). The `next-auth` v5 beta pin is **resolved** (R1) — a documented stack choice, not an open risk.

**18 — Batching.** **5 batches / 5 STOPs**, with **Batch C split into C1 + C2** (the brief's flag): C had 11 tasks (too dense). Final shape below. (decision 18 ✓ — split adopted)

**19 — Discipline moments.** Four first-of-kind moments are called out explicitly so reviewers don't treat them as routine — see "Discipline Moments" below. (decision 19 ✓)

## Implementation Batching (proposed — for `/speckit.tasks`)

> **6 STOP gates** after adopting the C-split. Estimated **~26 tasks**.

- **Batch A / STOP 1 — Foundations + Constitution.** T001 CLAUDE.md §3 edit (single-purpose) · T002 add 3 pinned deps + `pnpm install` · T003 `packages/db/src/auth-schema.ts` + schema.ts/index.ts re-export · T004 `apps/web/src/auth.ts` (config; adapter wired) + `app/api/auth/[...nextauth]/route.ts` · T005 `lib/auth/password.ts` + `lib/auth/tokens.ts` · T006 `lib/rate-limit.ts` · T007 `lib/email/shared.ts`. **STOP 1**: typecheck clean, schema compiles, deps resolve, lockfile diff explainable (3 + transitive), §3 edit visible.
- **Batch B / STOP 2 — Migration + Adapter.** T008 `drizzle-kit generate` → commit `0001_*.sql` + append rollback SQL · T009 `db:migrate` to Supabase dev DB + verify 5 tables/FKs/indexes exist. **STOP 2**: 5 tables present in dev DB; adapter resolves a user lookup without error.
- **Batch C1 / STOP 3 — Auth core + signup/login.** T010 `components/auth/auth-schemas.ts` + `auth-field.tsx` + `auth-card.tsx` · T011 signup page + `actions.ts` (createAccount) + `signup-form.tsx` · T012 verify-email-sent page + verify-email Route Handler · T013 login page + `actions.ts` + `login-form.tsx`. **STOP 3**: signup→verify→login routes 200; createAccount writes unverified user + token; login refuses unverified.
- **Batch C2 / STOP 4 — Password recovery + emails.** T014 `lib/email/verify-email.ts` + `password-reset-email.ts` + `welcome-email.ts` + `lib/auth-emails.ts` wrappers · T015 forgot-password page + `actions.ts` + `forgot-password-form.tsx` · T016 reset-password/[token] page + `actions.ts` + `reset-password-form.tsx`. **STOP 4**: forgot always-success; reset validates+consumes token, invalidates sessions; 3 emails render.
- **Batch D / STOP 5 — Middleware + /account + auth-aware nav.** T017 `middleware.ts` · T018 `/account` page + signOut action · T019 `top-nav.tsx` auth-aware edit. **STOP 5**: middleware redirects `/account`→`/login?callbackUrl=/account`; `/account` renders for a signed-in user; **logged-out top-nav byte-identical** across slices 005–012.
- **Batch E / STOP 6 — Gates.** T020 local gate (typecheck/lint/build + bundle budgets + Lighthouse + end-to-end happy-path + reset walk + email arrival + rate-limit + **link-flip across 9 refs/6 files** + logged-out-nav visual regression + schema verification + forgot-password timing check) · T021 preview parity (push via `x-access-token`, Vercel preview, all routes 200, end-to-end on preview, cross-slice regressions).

## Discipline Moments (first-of-kind — reviewers note)

1. **Constitution edit** — first since slice 003. §3 auth library changes. T001 is its own commit; Research R7 records the exact line diff.
2. **Schema migration** — second-ever (after 004). 5 tables; the adapter dictates column shapes; rollback SQL inline.
3. **Dependency additions** — first lockfile change since slice 008. 3 pinned deps + transitive `@auth/core`; the `next-auth` pin is a documented beta-tag stack choice (R1).
4. **Chrome edit** — first edit to `top-nav.tsx` since slice 005. Logged-out output must be byte-identical; gate proves it.

## Risk Register

| # | Risk | Level | Mitigation / Follow-up |
|---|------|-------|------------------------|
| R1 | `next-auth` v5 is on the `beta` tag | RESOLVED | **Settled stack choice** (Research R1): pin exact `5.0.0-beta.31`; the `beta` tag is the de-facto production line and the API has been stable ~4 years. Tracked follow-up: bump to `5.0.0` GA when released (version bump, not an architecture revisit). |
| R2 | Production migration not applied by this slice | ELEVATED | Slice applies to **dev** DB only. Follow-up: production migration runbook at the deploy/tag step. |
| R3 | In-memory rate limit is per-instance | ELEVATED | Documented; Upstash Redis follow-up before scale. |
| R4 | No HIBP breached-password check | ELEVATED | 12-char min only this slice; HIBP follow-up. |
| R5 | DB session read at edge in middleware | MEDIUM | Research R5: prefer Node-runtime middleware OR cookie-presence redirect + authoritative page-level `auth()` guard. |
| R6 | forgot-password timing leak (enumeration) | MEDIUM | Either timing-equivalent path or accept + document; gate checks response equivalence. |
| R7 | argon2 native binary on Vercel | LOW | `@node-rs/argon2` ships `linux-x64-gnu` prebuilt + wasm fallback; verified in Research R3. |
| — | Carry-forwards | — | All slice-012 follow-ups + deferred 014 (Tier 2.7 wire-up) + SectionScrollSpyRail refactor remain open. |

## Phase 0 → research.md; Phase 1 → data-model.md, contracts/ui-and-data.md, quickstart.md

All NEEDS CLARIFICATION resolved in `research.md` (no open markers). The 7 spec clarifications (C-a…C-g) are confirmed. No Complexity Tracking entries (Constitution Check passes).
