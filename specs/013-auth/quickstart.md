# Quickstart: Production Authentication (Slice 013)

Operational steps to build, migrate, and verify the auth slice. Implementation order follows the 6-STOP batching in `plan.md`. **Do not run these until implementation begins** — this is the runbook, not a green light.

---

## Prerequisites / environment

Generate and set the new secret + from-address (local `.env.local`, and Vercel preview + production):

```bash
# AUTH_SECRET — session/cookie encryption
openssl rand -base64 32
# → set AUTH_SECRET=<output> in .env.local and `vercel env add AUTH_SECRET` (preview + production)

# EMAIL_FROM — auth transactional sender (e.g. "Bristle <noreply@bristle.dev>")
# reuses the existing RESEND_API_KEY from slice 008
```

Existing (already set, slice 004/008): `DATABASE_URL`, `DATABASE_URL_DIRECT`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`.

Add all new vars to `.env.example` (documented, no secrets).

---

## Install dependencies (Batch A / T002) — exact pins

```bash
pnpm --filter web add next-auth@5.0.0-beta.31 @auth/drizzle-adapter@1.11.2 @node-rs/argon2@2.0.2
```

Expect pnpm peer warnings for `@simplewebauthn/*` and `nodemailer` (optional Auth.js provider peers we don't use — non-blocking, document at STOP 1). Confirm the lockfile diff is only these 3 + transitive `@auth/core@0.41.2`.

---

## Schema migration (Batch B / T008–T009)

```bash
# 1. generate the forward migration from src/auth-schema.ts (re-exported via schema.ts)
pnpm --filter @bristle/db db:generate          # → packages/db/drizzle/0001_<name>.sql

# 2. append the inline rollback comment block (see data-model.md), commit the SQL

# 3. apply to the Supabase DEV db (uses DATABASE_URL_DIRECT, port 5432)
pnpm --filter @bristle/db db:migrate           # → "migrations applied"

# 4. verify 5 tables + FKs + indexes
pnpm --filter @bristle/db db:studio            # or psql \d+ checks
```

Production DB is NOT migrated by this slice (Risk R2 — runbook follow-up).

---

## Local dev run

```bash
pnpm --filter web dev        # http://localhost:3000
```

### End-to-end happy path (SC-001)
1. `/signup` → submit email + password (≥12) + confirm → lands on `/signup/verify-email-sent`.
2. Open the verification email (real inbox or Resend dashboard) → click link → `/signup/verify-email?token=…` → redirects to `/login?verified=1` with success banner; welcome email arrives.
3. `/login` → submit credentials → redirects to `/account` → shows name/email, "Member since …", verified status, Sign out.
4. Click **Sign out** → redirected to `/`; top nav reverts to "Sign in" / "Start free".

### Password reset path (SC-002)
1. `/forgot-password` → submit email → neutral "if an account exists…" view (same for any email).
2. Open reset email → `/reset-password/<token>` → set new password → `/login?reset=1`.
3. Sign in with new password → `/account`. Old password rejected; prior sessions invalidated (SC-006).

### Negative checks
- Unverified login → "please verify your email" + resend (SC-005).
- Duplicate signup email → generic "could not create account" (SC-004).
- Reused/expired reset link → "no longer valid" page (SC-007).
- Signed-out `/account` → redirect to `/login?callbackUrl=/account`; sign in → back to `/account` (SC-009).
- 4th signup / 4th forgot in an hour, 6th login in a minute → "too many requests" (SC-008).

---

## Production build & local gate (Batch E / T020)

```bash
pnpm typecheck && pnpm lint && pnpm --filter web build
pnpm --filter web start -p 3127         # serve prod build for curl checks
```

Gate checklist:
- `typecheck` / `lint` / `build` exit 0 (SC-015).
- First Load JS < 180 KB for every auth route; form pages ~110–115 KB, server pages ~107 KB (SC-015).
- Render modes per the route table (contracts §1).
- **Link-flip across 9 references / 6 files** (SC-011) — grep **rendered HTML** (catches data-driven CTAs in `tier-data.ts` ×3 and the `try-bristle-card.tsx` module const that a source `href=` grep misses):
  ```bash
  for r in / /pricing /blog /problems/stripe-webhooks-vercel-cold-starts; do
    curl -s localhost:3127$r | grep -oE 'href="/(signup|login)"' | sort | uniq -c
  done
  # then curl /signup and /login → expect 200 live forms (not ComingSoon)
  ```
- **Logged-out top-nav visual regression** (SC-010): curl every slice-005…012 route, grep the right-side nav markup, confirm byte-identical to pre-slice baseline.
- Voice greps (no `!`/emoji/amazing/awesome) across all new files incl. the 3 email templates (§6).
- WCAG: labels `htmlFor`, errors `aria-describedby`+`role="alert"`, `type="password"`, focus management (SC-014).
- No-JS: disable JS, submit each of the 4 forms, confirm server-rendered error/success (SC-012).
- 3 emails received during the walks (SC-013).
- Schema verification: 5 tables present (SC-017).
- forgot-password response equivalence (R6).
- `pnpm-lock.yaml` diff = 3 deps + transitive only.

---

## Preview parity (Batch E / T021)

```bash
TOKEN=$(gh auth token)
git push "https://x-access-token:${TOKEN}@github.com/cornel-stack/bristle.git" 013-auth:013-auth
```

Then on the Vercel preview URL: all routes 200/redirect per the table; full end-to-end happy path + reset path on preview; cross-slice nav regressions (pricing→/faq, enterprise→/contact, footer legal, blog, changelog, changelog.atom 13 entries) clean; `x-robots-tag: noindex` on preview; signed-out nav unchanged. Lighthouse ≥ 90 Perf/A11y/BP on `/login`, `/signup`, `/account` (SC-016).

---

## Notes
- `auth.ts` lives at `apps/web/src/auth.ts` (importable `@/auth`); handlers at `app/api/auth/[...nextauth]/route.ts`.
- Password hashing is server-only (`lib/auth/password.ts`); never import it from a client island.
- The `/account` page has its own authoritative `auth()` guard in addition to middleware (R5).
- ⚠️ `next-auth@5.0.0-beta.31` is a **beta** pin — confirm the R1 sign-off before `/speckit.tasks`.
