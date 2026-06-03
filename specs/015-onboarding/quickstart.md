# Quickstart: Onboarding — Role + Categories (Slice 015)

Migration + dev walk + gate commands. Read alongside `plan.md` (D1–D5) and `contracts/ui-and-data.md`. No new env vars, no new dependencies, no OAuth-app setup (reuses slice 014).

---

## 1. Schema migration (Batch 0 / STOP 1)

```bash
# 1. Edit packages/db/src/auth-schema.ts: +4 columns on users
#    role text · role_custom text · watched_categories text[] (.array()) · onboarding_completed_at timestamptz
pnpm --filter @bristle/db db:generate          # → packages/db/drizzle/0003_<name>.sql
# 2. Hand-append the -- ROLLBACK comment block (see data-model.md; 4 DROP COLUMN, reverse order)
pnpm --filter @bristle/db db:migrate           # applies to DATABASE_URL_DIRECT (shared dev/prod)
# 3. Verify (probe filters table_schema='public'):
#    users gains 4 columns; watched_categories data_type = 'ARRAY' (udt 'text'); all nullable.
```
Expected: `users` columns = 17 (13 from slice 014 + 4). `watched_categories` is the first `text[]`. All four nullable, no constraint change — nothing else in the app breaks (additive).

---

## 2. Local dev walk

```bash
pnpm --filter @bristle/web dev    # http://localhost:3000
```
1. **New credentials user**: `/signup` → verify code (founder Resend inbox) → `/login?verified=true` → sign in → **redirected to `/onboarding/role`** (the `/account` guard).
2. **Step 1**: welcome overline shows the first name; pick a role; the preview line updates; "Something else" reveals the textarea (required). Continue → `/onboarding/categories`.
3. **Step 2**: search filters; select 3–5 (Continue disabled <3; 6th prevented; pills removable; counter/hint update). "Finish →" → `/account` with role + categories saved.
4. **Skip**: from either step, "Skip for now" → `/account` (completed; role/categories null).
5. **Re-entry**: a completed user visiting `/onboarding/role` or `/onboarding/categories` → redirected to `/account`. A user who saved only their role and returns → resumes at `/onboarding/categories`.
6. **OAuth**: sign in with a brand-new Google/GitHub account → first landing is `/onboarding/role` (provider name in the welcome).
7. **Signed-out**: `/onboarding/role` while logged out → `/login?callbackUrl=/onboarding/role`.

---

## 3. Persistence smoke (DB helpers, like slice 014)

A `tsx` scratch script (run from `packages/db`, `DATABASE_URL` = the direct value) exercising the load-bearing persistence without a request context: `saveUserRole` (role + roleCustom only, completed_at stays null), `saveUserCategories` (sets 3–5 slugs + completed_at), `completeOnboarding` (sets completed_at only), and the slug/role validation (reject unknown slug, reject <3 / >5, reject role="other" with empty custom). Server Actions themselves are covered at the preview gate. Clean up test users by email prefix.

---

## 4. Gate commands (STOP 7)

```bash
# T-local
pnpm typecheck && pnpm lint && pnpm build
# Bundle: /onboarding/role + /onboarding/categories < 110 KB First Load JS (watch); none > 130 (block)
# Voice/token greps across components/onboarding + app/onboarding + packages/shared/categories.ts
# Slice-integrity diff vs base:
git diff --stat c6f8025 -- apps/web packages CLAUDE.md
#   expect: NEW components/onboarding/*, app/onboarding/*, lib/onboarding/*, packages/shared/categories.ts,
#   drizzle/0003 + meta; EDIT db schema/queries/index, middleware.ts (matcher), account/page.tsx (guard),
#   CLAUDE.md (§8 note, optional). NOTHING in auth.ts / next-auth.d.ts / verify-email/actions.ts.
# Cross-slice: curl signed-out / /pricing /faq etc. → unchanged (005-014).
# Category list: confirm CATEGORIES no longer carries // TODO placeholders (founder replaced — C-a).

# T-preview (reuses slice-014 OAuth env — no new setup)
#   Push → Vercel preview → migration 0003 applied → 5 e2e walks:
#   (1) signup → onboarding → /account; (2) skip step 1; (3) skip step 2;
#   (4) OAuth user goes through onboarding; (5) completed user re-visits /onboarding/* → /account.
```

---

## 5. Process oddities carried from slices 013/014 (D9)

- **Schema TS edited before `db:generate`** — additive this slice (no NOT-NULL relaxation → no app-code ripple, unlike 0002).
- **`noUncheckedIndexedAccess`** — iterate `watched_categories` with `for…of`, not index access.
- **`"use server"`** files export only async functions (`onboarding/actions.ts`).
- **Server-Action smoke** is limited under tsx (no request context) → DB-helper smoke + preview gate.
- **`vercel env` / Resend sandbox / dev==prod DB** — unchanged from slice 014 (no new env this slice).

---

## 6. Done-when

All SC-001…013 verified at STOP 7: complete-flow + skip both reach `/account` with correct persistence; all four gating rules hold for credentials + OAuth; step-2 enforces 3–5 + search; "Coming soon"/no-sparkline/"Showing all"/"of 2" present; role "other" requires custom text; resume works; server rejects bad slugs/counts; bundle < 110 KB/route; slices 005–014 unaffected (diff matches D8, no auth-config touch); category placeholders replaced.
