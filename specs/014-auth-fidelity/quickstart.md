# Quickstart: Auth Visual + Functional Fidelity (Slice 014)

Setup + env + migration + dev walk + gate commands. Read alongside `plan.md` (Decisions D5/D9) and `contracts/ui-and-data.md`. **This is the operationally riskiest slice since 013 — the OAuth env section is the part that bites.**

---

## 0. Founder pre-actions (do BEFORE Batch B)

OAuth provider apps are created by the founder, not by Claude Code. Two apps, four secrets.

### Google Cloud Console
1. APIs & Services → Credentials → **Create OAuth client ID** → type **Web application**.
2. Authorized redirect URIs — add one per origin you sign in from:
   - Production: `https://<prod-domain>/api/auth/callback/google`
   - Preview (per branch URL you test from): `https://<preview-host>/api/auth/callback/google`
   - Local: `http://localhost:3000/api/auth/callback/google`
3. Copy **Client ID** → `GOOGLE_CLIENT_ID`, **Client secret** → `GOOGLE_CLIENT_SECRET`.
4. OAuth consent screen: scopes `email`, `profile`, `openid` only (FR-016).

### GitHub Developer Settings
1. Settings → Developer settings → **OAuth Apps** → **New OAuth App**.
2. Authorization callback URL: `https://<prod-domain>/api/auth/callback/github` (GitHub allows one per app — create a second app for preview/local, or use the same app and swap the callback while testing).
   - Local: `http://localhost:3000/api/auth/callback/github`
3. Copy **Client ID** → `GITHUB_CLIENT_ID`; generate a **client secret** → `GITHUB_CLIENT_SECRET`.
4. Scopes are requested at signin (`read:user user:email`), not configured on the app.

> Auth.js v5 derives the callback origin from the request (`trustHost: true` is already set), so no `SITE_URL`/`AUTH_URL` env is required for the app — but the **redirect URIs above must exactly match each origin** or the provider rejects the round-trip.

---

## 1. Environment variables (the preview-build trap — D5/R1)

Four new vars. Add to **all three** places or the build/flows break:

### a. `apps/web/.env.example` (commit — documents the contract)
```dotenv
# OAuth — Google (Google Cloud Console → Credentials → OAuth client ID, Web app)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# OAuth — GitHub (Settings → Developer settings → OAuth Apps)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### b. `apps/web/.env.local` (local dev — never committed)
Paste the real four values. (Do NOT paste secrets into chats — D9e.)

### c. Vercel — Production **and** Preview scopes
`auth.ts` throws at module load if any is missing, so a preview build with a gap **dies at "Collecting page data"** — the exact slice-013 `AUTH_SECRET` failure ([vercel-auth-build-env] memory).
```bash
# Per var, per scope — branch-scoped, force to avoid silent no-op (D9b):
vercel env add GOOGLE_CLIENT_ID production --git-branch 014-auth-fidelity --force
vercel env add GOOGLE_CLIENT_ID preview    --git-branch 014-auth-fidelity --force
# …repeat for GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

### d. `turbo.json` — add the four names to `build.env` (REQUIRED — Turborepo/Vercel passes through only declared vars)
Current `build.env` has 10 entries (AUTH_SECRET, EMAIL_FROM, RESEND_API_KEY, CONTACT_FORM_*, DATABASE_URL*, SUPABASE_*). Append:
```json
"GOOGLE_CLIENT_ID",
"GOOGLE_CLIENT_SECRET",
"GITHUB_CLIENT_ID",
"GITHUB_CLIENT_SECRET"
```
> Without this, the values exist in Vercel but never reach the build → the module-load throw fires anyway. This `build.env` line is the specific fix that made AUTH_SECRET work in slice 013.

**Preflight before any Batch B preview deploy**: `vercel env ls | grep -E 'GOOGLE|GITHUB'` shows all four in both Production + Preview, and `turbo.json` lists all four.

---

## 2. Schema migration (Batch 0 / STOP 1)

```bash
# 1. Edit packages/db/src/auth-schema.ts: +5 columns on users, drop .notNull() on passwordHash (D15)
pnpm --filter @bristle/db db:generate          # → packages/db/drizzle/0002_<name>.sql
# 2. Hand-append the -- ROLLBACK comment block (see data-model.md)
pnpm --filter @bristle/db db:migrate           # applies to DATABASE_URL_DIRECT
# 3. Verify (probe filters table_schema='public' — D9d):
pnpm --filter @bristle/db db:probe             # (extend probe or psql) confirm 5 columns + passwordHash nullable
```
Expected: `users` gains `email_verification_code`, `email_verification_code_expires`, `email_verification_attempts` (NOT NULL default 0), `terms_accepted_at`, `terms_version`; `passwordHash` is now nullable. Optionally `DELETE FROM "verificationTokens";`.

---

## 3. Local dev walk (after Batch D/E)

```bash
pnpm --filter @bristle/web dev    # http://localhost:3000
```
1. **Email signup**: `/signup` → name/email/password (watch strength meter) → check Terms → submit → `/signup/verify-email?email=…`.
2. **Code**: read the code from the founder's Resend inbox (sandbox — D9c) → enter 6 digits → "Verify & continue" → `/login?verified=true`.
3. **Wrong code ×5** → "request a new code"; **resend** → 24s countdown; **use a different email** → user deleted, back to `/signup` prepopulated.
4. **Login**: email + password, toggle "Keep me signed in" (checked → 30d cookie; unchecked → session cookie) → `/account`.
5. **Google / GitHub**: click button → consent → `/auth/callback/{provider}` (progress flash) → `/account`; confirm an `accounts` row.
6. **Forgot/reset**: `/forgot-password` → green pill → reset link → `/reset-password/[token]` (strength meter + requirements + confirm-match) → update → signed in.
7. **Sign out** → `/`; `/account` while signed out → `/login?callbackUrl=/account`.

---

## 4. Gate commands (STOP 8)

```bash
# T-local
pnpm typecheck && pnpm lint && pnpm build
# Bundle budget ≤130 KB per auth route (D7): read .next build output First Load JS for
#   /signup /login /forgot-password /reset-password/[token] /signup/verify-email /auth/callback/[provider]
# Voice/token greps (no '!', no emoji, no 'amazing/awesome'; tokens not hex) across apps/web/src/components/auth + app/(auth routes)
# Slice-integrity diff vs base (D8):
git diff --stat 52dd247 -- apps/web packages/db turbo.json CLAUDE.md
#   expect: 5 page rewrites, 2 deletions (verify-email-sent dir, verify-email/route.ts), 4 form rewrites,
#   new components/page/email/lib/actions, edits to auth.ts/session.ts/rate-limit.ts/auth-schema.ts/turbo.json/CLAUDE.md — nothing else.
# Cross-slice regression: curl signed-out / /pricing /faq etc. → unchanged chrome (slices 005–012).

# T-preview (after env preflight §1)
#   Push → Vercel preview → all auth routes 200 → run the §3 walk on preview, incl. live Google + GitHub round-trips.
```

---

## 5. Process oddities carried from slice 013 (D9)

- **`"use server"` files export only async functions** — the 3 new verify actions + edited createAccount/login actions. A non-async export is a build error.
- **`vercel env add` needs `--git-branch` + `--force`** — branch scope is not implied; add can silently no-op.
- **Resend sandbox** delivers only to the founder's verified address — multi-user email testing needs domain verification (TF-007).
- **Supabase `auth.*` overlap** — introspection/probe filters `table_schema='public'`.
- **Never paste DB passwords / OAuth secrets into chats** — Vercel + `.env.local` only.

---

## 6. Done-when

All SC-001…018 verified at STOP 8: email signup+code, Google OAuth, GitHub OAuth, forgot/reset, sign-out, protected-route redirect, live callback render; 6 routes match design ≤4px @1280px and degrade cleanly to 375px; no route >130 KB; WCAG 2.2 AA (CodeInput keyboard + callback `aria-live`); diff vs `52dd247` matches the D8 manifest exactly.
