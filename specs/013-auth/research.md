# Phase 0 Research: Production Authentication (Slice 013)

All decisions below feed `plan.md`. No `NEEDS CLARIFICATION` markers remain.

---

## R1 — Auth.js v5 version pin (RESOLVED — documented stack choice)

**Decision**: Pin `next-auth@5.0.0-beta.31` (exact, no caret) and ship on it. **Settled** — this is a documented stack choice, not a per-session risk to revisit.

**Finding (npm registry, checked 2026-05-29)**:
- `next-auth` dist-tags: `latest` → **`4.24.14`** (v4), `beta` → **`5.0.0-beta.31`** (newest v5). **Auth.js v5 is NOT GA** — it is still published under the `beta` tag, as it has been since 2022.
- The entire slice architecture is v5-only: the `{ handlers, signIn, signOut, auth }` export, async-Server-Component `auth()`, and the v5 middleware signature do not exist in v4 (v4 uses `getServerSession`, a different middleware, and a different route shape). Reverting to v4 would invalidate ~all of the plan.

**Rationale for shipping on beta**: The v5 beta has been the de-facto production path for Auth.js for years and powers many production Next.js apps; the "beta" label has not moved despite stability. Waiting for `5.0.0` GA would block all of Tier 3 indefinitely (no committed GA date). Pinning the exact beta build removes drift risk.

**Alternatives considered**:
- *Auth.js v4 stable (`4.24.14`)*: rejected — legacy API, would force a different plan, and is itself end-of-life-ward as v5 is the forward line.
- *Wait for v5 GA*: rejected — indefinite block; no GA date.
- *Lucia / hand-rolled sessions*: rejected — out of the agreed stack decision; more surface to own.

**Tracked follow-up (not a re-decision)**: Swap to `next-auth@5.0.0` GA when it lands. The v5 API has been stable through ~4 years of beta, so the risk of a breaking refactor at GA is minimal — this is a version bump, not an architecture revisit.

---

## R2 — `@auth/core` alignment between next-auth and the Drizzle adapter

**Decision**: Declare only `next-auth@5.0.0-beta.31` + `@auth/drizzle-adapter@1.11.2`; let `@auth/core` resolve transitively.

**Finding**: Both `next-auth@5.0.0-beta.31` and `@auth/drizzle-adapter@1.11.2` declare `dependencies["@auth/core"] = "0.41.2"` — the **same exact version**. No peer/version conflict; a single `@auth/core@0.41.2` resolves for both.

**Rationale**: Declaring `@auth/core` directly is unnecessary and would risk pinning it out of sync with a future `next-auth` bump. Transitive resolution keeps them aligned.

**Note**: `next-auth@5.0.0-beta.31` lists optional provider peers (`@simplewebauthn/browser`, `@simplewebauthn/server`, `nodemailer`) we do not use (credentials-only). pnpm will emit peer warnings for these — **expected and non-blocking**; document at STOP 1 so the lockfile diff is fully explained.

---

## R3 — `@node-rs/argon2` serverless compatibility

**Decision**: Pin `@node-rs/argon2@2.0.2`; use Argon2id with library defaults.

**Finding**: `2.0.2` ships platform binaries via `optionalDependencies`, including `@node-rs/argon2-linux-x64-gnu` (Vercel's Node runtime) and `@node-rs/argon2-wasm32-wasi` (universal fallback). `engines.node >= 10`. Version `1.0.4` is deprecated — avoid. No `cpu`/`os` restriction on the meta package (the optional deps carry the per-platform constraints).

**Rationale**: Prebuilt native binary on Vercel = no compile step, fast hashing; the wasm fallback covers any platform the prebuilt set misses. Argon2id is the OWASP-recommended variant for password storage.

**Alternatives**: `bcrypt`/`bcryptjs` (rejected — argon2id is the modern recommendation per the stack decision); `@node-rs/bcrypt` (rejected — same reason).

**Hashing must run server-side only** — `lib/auth/password.ts` is imported by Server Actions / `auth.ts` only (never a client island).

---

## R4 — Migration generation & application

**Decision**: `drizzle-kit generate` (forward-only) → commit SQL → apply via the existing `pnpm --filter @bristle/db db:migrate` runner. **Not** `push`, **not** manual psql.

**Finding**: `packages/db` already has `db:generate` (`drizzle-kit generate`) and `db:migrate` (`tsx src/migrate.ts`) from slice 004. `src/migrate.ts` runs `drizzle-orm/postgres-js/migrator` against `DATABASE_URL_DIRECT` (port 5432 — advisory locks + prepared statements the pooler lacks), with connection-string redaction on error. `drizzle.config.ts` globs `schema: "./src/schema.ts"`, `out: "./drizzle"`, `strict: true`.

**Rationale**: The brief proposed manual psql, but the migrate runner already exists and is the established, safer path (transactional, locked, redacted). Re-export auth tables through `schema.ts` so drizzle-kit sees them without changing `drizzle.config.ts`.

**Rollback**: Append a commented `-- ROLLBACK` block to the generated `0001_*.sql` with `DROP TABLE` in reverse-FK order (`password_reset_tokens`, `sessions`, `accounts`, `verificationTokens`, `users`). On mid-slice failure: run the rollback SQL manually, `git revert` the migration file, drop the journal entry.

**Production**: This slice migrates **dev only**. Production application is a tracked follow-up (runbook at deploy/tag).

---

## R5 — Middleware with the database session strategy at the edge

**Decision**: Implement middleware as a wrapped `auth((req)=>…)` that redirects on missing session, with `config.matcher = ["/account/:path*"]`. If the adapter's session read is not edge-safe, set middleware to the Node runtime; otherwise the page-level `auth()` guard in `/account` is the authoritative check and middleware is the fast redirect.

**Finding/Reasoning**: Auth.js v5 middleware via `auth()` reads the session. With `strategy:"database"`, resolving the session may require a DB round-trip; Vercel Edge cannot run the postgres driver. Two safe shapes:
1. **Node-runtime middleware** (Next 15 allows `export const runtime = "nodejs"` for middleware) — full session resolution.
2. **Cookie-presence middleware** — middleware only checks for the session cookie's presence and redirects if absent; `/account`'s server-side `auth()` (which runs in the Node server component) does the authoritative validation + the defensive redirect. This keeps middleware edge-light and never hits the DB at the edge.

**Chosen default for tasks**: Start with shape (2) — cookie-presence redirect in middleware + authoritative `auth()` guard on the page (defense in depth, FR-018 + decision 12's belt-and-suspenders). Revisit to shape (1) only if a cookie-presence check proves insufficient. Confirm the concrete API against the installed `next-auth@5.0.0-beta.31` at T017.

**Rationale**: Avoids edge/DB incompatibility entirely; the page guard is the security boundary, middleware is UX (fast redirect, preserves `callbackUrl`).

---

## R6 — Email-enumeration timing on `/forgot-password`

**Decision**: Always return the identical success view regardless of account existence (FR-015). Do **not** add artificial timing equalization this slice; document the residual timing difference as an accepted, low-severity leak.

**Rationale**: The response *body/redirect* is identical either way (the primary enumeration vector is closed). A timing side-channel (real email send vs no-op) is low-value for an attacker against an indie product and adding a fake-delay path adds complexity and its own timing tells. Gate verifies response-equivalence; timing equalization is a tracked follow-up if a security review flags it.

**Alternatives**: Always-send-to-a-sink, fixed sleep — rejected as over-engineering for v1.

---

## R7 — CLAUDE.md §3 exact edit (constitution change)

**Decision**: Replace the `Auth — Supabase Auth` bullet in §3 with the Auth.js stack; leave Supabase Postgres, Drizzle, Resend bullets untouched.

**Exact line change** (T001):
- **Before**: `**Auth — Supabase Auth.** Email/password, Google OAuth, GitHub OAuth. **No SSO/SAML in v1.0** (UI shows an SSO button behind a feature flag; deferred to v1.1).`
- **After**: `**Auth — Auth.js v5 (next-auth@5).** Credentials (email/password) in v1.0 via `@auth/drizzle-adapter` over the existing Supabase Postgres; passwords hashed with `@node-rs/argon2` (argon2id). Google/GitHub OAuth deferred to a later micro-slice (the `accounts` table is provisioned so it is non-breaking). **No SSO/SAML in v1.0.** (Changed from Supabase Auth in slice 013 — maturity decision; Supabase Postgres, Drizzle, and Resend are unchanged.)`

**Rationale**: Minimal, surgical diff confined to the one bullet; preserves the SSO/SAML deferral note; records the slice + reason inline for future readers. Reviewers can diff exactly one paragraph.

---

## R8 — Reuse of slice-008 Server-Action + Resend patterns

**Decision**: Mirror `app/contact/actions.ts` exactly for state shape; reuse `lib/resend.ts`'s per-call client construction + structured-result pattern; add a new `EMAIL_FROM` env var rather than editing slice-008 code.

**Finding**: `app/contact/actions.ts` returns a discriminated union (`idle | success | validation-error{fieldErrors,values} | transport-error{values}`); raw values captured pre-parse and echoed on error; `contact-schema.ts` is imported runtime-side by the action only, with the client importing `import type` to keep Zod out of the client bundle. `lib/resend.ts` reads env per-call (not memoized), constructs `new Resend(apiKey)` per call, returns `{ok}|{ok:false,reason}` instead of throwing, and is guarded by `import "server-only"`.

**Rationale**: Proven, on-voice, perf-conscious. Auth extends the union with `rate-limited` and (login-only) `unverified`; uses `redirect()` on the flows that advance the user. A new `EMAIL_FROM` avoids touching `CONTACT_FORM_FROM` (slice-integrity FR-027).

---

## R9 — Discriminated-union narrowing at `/account` (slice-012 precedent)

**Decision**: Light use — narrow on `session?.user` presence, not a full tagged union.

**Finding/Reasoning**: Auth.js types `auth()` as returning `Session | null`. The only narrowing needed is `if (!session?.user) redirect(...)`, after which `session.user` is non-null. There is no full/stub-style discriminated union as in slice 012 (`SampleProblemFull | SampleProblemStub`); a single nullable check suffices. **No custom discriminated union warranted** — flagged per the brief: the slice-012 pattern is *not* needed here. Keep `auth.ts`'s `session` callback typed so `session.user.emailVerified` is available without assertions (matches the slice-012 zero-non-null-assertion discipline).

---

## Version matrix (pinned)

| Package | Version | Tag | Notes |
|---|---|---|---|
| `next-auth` | `5.0.0-beta.31` | beta ⚠️ | v5 architecture; needs sign-off (R1) |
| `@auth/drizzle-adapter` | `1.11.2` | latest | shares `@auth/core@0.41.2` with next-auth |
| `@node-rs/argon2` | `2.0.2` | latest | prebuilt linux-x64-gnu + wasm fallback |
| `@auth/core` | `0.41.2` | (transitive) | not declared directly |

Existing (unchanged): `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `postgres@3.4.9`, `resend`, `zod`, `next@15.5.18`, `react@19`.
