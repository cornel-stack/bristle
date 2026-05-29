# Tasks: Production Authentication (Slice 013)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/ui-and-data.md](./contracts/ui-and-data.md) · **Quickstart**: [quickstart.md](./quickstart.md)

**Branch**: `013-auth` · **True baseline**: `0cd598c` (PR #11 merge commit on `main`)

**Guard**: tasks only — do NOT implement. One commit per task (CLAUDE.md §7).

---

## Task count (re-verify every claim at STOP 6 — slice-011 count-drift lesson)

**26 tasks total** — **24 commit-producing (T001–T024)** + **2 verification gates (T025–T026)**. Six batches / six STOPs.

| Batch | STOP | Tasks | Count | Theme |
|---|---|---|---|---|
| A | 1 | T001–T007 | 7 | Foundations + constitution edit |
| B | 2 | T008–T009 | 2 | Schema migration (generate + apply + verify) |
| C1 | 3 | T010–T017 | 8 | Auth core + signup + email-verify + login |
| C2 | 4 | T018–T021 | 4 | Password recovery + reset email |
| D | 5 | T022–T024 | 3 | Middleware + /account + auth-aware nav |
| E | 6 | T025–T026 | 2 | Local gate + preview parity |

**Count cross-check (asserted at STOP 6, verbatim re-run):** 5 DB tables · 4 client islands · 3 transactional emails · 5 user flows · 9 `/signup` rendered-HTML refs · 1 `/login` ref · 2 rewritten slice-005 stubs · 1 chrome edit · 1 constitution edit · ≤5 client-island budget.

**Pinned versions (T002):** `next-auth@5.0.0-beta.31` · `@auth/drizzle-adapter@1.11.2` · `@node-rs/argon2@2.0.2` (transitive `@auth/core@0.41.2`). The v5 `beta` pin is a documented stack choice (Research R1), not an open risk.

---

## ⚠️ Five discipline-change moments (reviewers: these are NOT routine)

1. **T001 — Constitution edit.** First change to `CLAUDE.md` §3 since slice 003. Single-purpose, audit-trail-isolated commit. Auth library: Supabase Auth → Auth.js v5.
2. **T002 — Dependency additions.** First `pnpm-lock.yaml` change since slice 008. 3 pinned deps + transitive `@auth/core`. Expect (non-blocking) pnpm peer warnings for unused provider peers (`@simplewebauthn/*`, `nodemailer`).
3. **T008–T009 — Schema migration.** First DB schema work since slice 003/004. 5 new tables; the Drizzle adapter dictates column shapes; rollback SQL lives in the migration file.
4. **T024 — Chrome edit.** First edit to `top-nav.tsx` since slice 005. Logged-out output must stay byte-identical (visual-regression gate at T025).
5. **The slice as a whole** — the project's first **protected route** (`/account`) and first **session-aware components**. Establishes patterns Tier 4+ inherits.

---

## Phase A — Foundations + Constitution (STOP 1) · T001–T007

- [ ] T001 Edit `CLAUDE.md` §3 — replace the "Auth — Supabase Auth" bullet with the Auth.js v5 stack (per research.md R7 exact diff: `next-auth@5` + `@auth/drizzle-adapter` over existing Supabase Postgres + `@node-rs/argon2` argon2id; OAuth deferred but `accounts` provisioned; SSO/SAML still deferred; note the slice-013 change + that Postgres/Drizzle/Resend are unchanged). **Single-purpose commit, no other files.** Discipline moment #1.
- [ ] T002 Add exact-pinned deps to `apps/web/package.json` and install: `pnpm --filter web add next-auth@5.0.0-beta.31 @auth/drizzle-adapter@1.11.2 @node-rs/argon2@2.0.2`. Confirm lockfile diff = these 3 + transitive `@auth/core@0.41.2`; document expected peer warnings. Discipline moment #2. (dep: T001)
- [ ] T003 Create `packages/db/src/auth-schema.ts` with the 5 Drizzle tables (`users`, `accounts`, `sessions`, `verificationTokens`, `password_reset_tokens`) exactly per data-model.md (FKs CASCADE, unique indexes, composite PK on verificationTokens); add `export * from "./auth-schema"` to `packages/db/src/schema.ts`; re-export tables + `$inferSelect`/`$inferInsert` types (`User`/`NewUser`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`/`NewPasswordResetToken`) from `packages/db/src/index.ts`. (dep: T002)
- [ ] T004 [P] Create `apps/web/src/lib/auth/password.ts` (`hashPassword`/`verifyPassword` thin `@node-rs/argon2` argon2id wrappers, server-only) and `apps/web/src/lib/auth/tokens.ts` (`generateToken()` → 32-byte base64url, `expiresIn(ms)` helper). (dep: T002)
- [ ] T005 [P] Create `apps/web/src/lib/rate-limit.ts` — `check({key,limit,windowMs}): {allowed, retryAfter?}` over a module-scope `Map`, lazy expiry, key `${action}:${ip}` (ip from `x-forwarded-for` first hop ?? `x-real-ip` ?? `"unknown"`). Per-instance limitation documented in the file header. (dep: T001)
- [ ] T006 [P] Create `apps/web/src/lib/email/shared.ts` — `brandHeader()`, `unsubscribeFooter()`, base inline-styled HTML shell (no images, no external CSS), voice-compliant. (dep: T001)
- [ ] T007 Create `apps/web/src/auth.ts` (`NextAuth({adapter: DrizzleAdapter(db,{...table map}), session:{strategy:"database",maxAge:2592000}, pages:{signIn:"/login",verifyRequest:"/signup/verify-email-sent"}, providers:[Credentials({authorize})], callbacks:{session}})` exporting `{handlers, signIn, signOut, auth}`; `authorize` does lookup→`verifyPassword`→user|null and does NOT enforce verified) and `apps/web/src/app/api/auth/[...nextauth]/route.ts` (`export const { GET, POST } = handlers`). (dep: T002, T003, T004)

**STOP 1 gate** — `pnpm typecheck`/`lint` clean; schema compiles; `auth.ts` resolves the adapter + tables; lockfile diff explained (3 + `@auth/core`); CLAUDE.md §3 edit visible as its own commit. No runtime DB ops yet.

---

## Phase B — Schema migration (STOP 2) · T008–T009

- [ ] T008 Run `pnpm --filter @bristle/db db:generate` to produce `packages/db/drizzle/0001_<name>.sql`; **append the inline rollback comment block** at the file tail — `DROP TABLE IF EXISTS` in reverse-FK order (`password_reset_tokens` → `sessions` → `accounts` → `verificationTokens` → `users`) plus the "git revert + remove journal entry" note (data-model.md). Verify the migration creates 5 tables + FKs + 4 unique indexes + composite PK, and the rollback block is present and correctly ordered. Discipline moment #3. (dep: T003)
- [ ] T009 Apply to the Supabase **dev** DB via `pnpm --filter @bristle/db db:migrate` (uses `DATABASE_URL_DIRECT`); confirm "migrations applied"; run the verification query and confirm all 5 names appear:
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema='public'
    AND table_name IN ('users','accounts','sessions','verificationTokens','password_reset_tokens');
  ```
  Production DB is NOT migrated this slice (Risk R2 follow-up). (dep: T008)

**STOP 2 gate (HOLDS HERE)** — all 5 tables exist in the dev DB by name; FKs (CASCADE), unique indexes, and the composite PK present (`\d+` or Drizzle Studio); the adapter resolves a user lookup without error. Do not start Phase C runtime verification until green.

---

## Phase C1 — Auth core + signup + email-verify + login (STOP 3) · T010–T017

**User stories**: US1 (register→verify→first login), US2 (login/logout). **Client islands introduced: 2 (signup-form, login-form).**

- [ ] T010 [P] [US1] Create `apps/web/src/components/auth/auth-schemas.ts` — Zod `signupSchema`/`loginSchema`/`forgotSchema`/`resetSchema` (email lowercased+trimmed, password min 12, confirm refine), voice-compliant messages. Runtime-imported by Server Actions only; forms import `import type`. (dep: T001)
- [ ] T011 [P] [US1] Create `apps/web/src/components/auth/auth-card.tsx` (centered token-styled card shell, server) and `auth-field.tsx` (labeled input with `htmlFor` + `aria-describedby` error wiring, server). (dep: T001)
- [ ] T012 [P] [US1] Create `apps/web/src/lib/email/verify-email.ts` (`renderVerifyEmailHtml`) + `welcome-email.ts` (`renderWelcomeEmailHtml`) + `apps/web/src/lib/auth-emails.ts` (`sendVerificationEmail`/`sendWelcomeEmail` reusing the slice-008 Resend client + new `EMAIL_FROM`). (dep: T006)
- [ ] T013 [US1] Create `apps/web/src/app/signup/actions.ts` — `createAccount` Server Action (order: rate-limit 3/h → Zod → hash → insert unverified user → issue 24h verify token → send verify email → `redirect("/signup/verify-email-sent")`; duplicate email → generic `transport-error`, no enumeration). **Commit body MUST include the discriminated-union state contract verbatim** (`idle|validation-error|transport-error|rate-limited`). (dep: T007, T010, T012, T005, T004, T003)
- [ ] T014 [US1] Rewrite `apps/web/src/app/signup/page.tsx` (replace ComingSoon stub; server page + `<SignupForm>`; indexable metadata title+desc) and create `apps/web/src/components/auth/signup-form.tsx` (**client island 1**; `useActionState`, raw-value-on-error for email/name, password masked, focus first invalid). (dep: T013, T011)
- [ ] T015 [US1] Create `apps/web/src/app/signup/verify-email-sent/page.tsx` (noindex; "check your inbox" + rate-limited resend affordance per C-f). (dep: T012, T011)
- [ ] T016 [US1] Create `apps/web/src/app/signup/verify-email/route.ts` — Route Handler (force-static-style Route Handler per slice-011 precedent): read `?token`, look up in `verificationTokens`, if valid mark `users.emailVerified=now()` + delete token + send welcome email + `redirect("/login?verified=1")`; if invalid/expired/used → `redirect("/signup?error=verify")`. (dep: T012, T007, T003)
- [ ] T017 [US2] Create `apps/web/src/app/login/actions.ts` — `signInWithCredentials` (order: rate-limit 5/min → Zod → if user unverified return `unverified` state → `signIn("credentials")` → `redirect(callbackUrl ?? "/account")`; bad creds → generic `validation-error`), rewrite `apps/web/src/app/login/page.tsx` (replace stub; indexable; success banner for `?verified`/`?reset`) and create `apps/web/src/components/auth/login-form.tsx` (**client island 2**). **Commit body MUST include the state contract verbatim** (`idle|validation-error|transport-error|rate-limited|unverified`). (dep: T007, T010, T011, T005)

**STOP 3 gate** — signup/verify-email-sent/login routes 200; `createAccount` writes an unverified user + 24h token + sends verify email; verify route flips `emailVerified` + sends welcome + redirects; login refuses unverified (shows resend) and accepts verified; duplicate-signup generic error (no enumeration). Client-island count = 2 so far.

---

## Phase C2 — Password recovery + reset email (STOP 4) · T018–T021

**User story**: US3 (forgot → reset). **Client islands introduced: 2 (forgot-password-form, reset-password-form) → running total 4.**

- [ ] T018 [P] [US3] Create `apps/web/src/lib/email/password-reset-email.ts` (`renderPasswordResetEmailHtml`, includes "expires in 1 hour" + "ignore if you didn't request this") and extend `apps/web/src/lib/auth-emails.ts` with `sendPasswordResetEmail`. (dep: T006)
- [ ] T019 [US3] Create `apps/web/src/app/forgot-password/actions.ts` — `requestPasswordReset` (**ALWAYS** returns `{status:"success"}` neutral view regardless of email existence; if user exists, issue 1h `password_reset_tokens` row + send reset email; rate-limit 3/h). **Per plan R6 the accepted path is response-equivalence with the timing leak documented as a v1 limitation — NO artificial argon2 buffer.** Create `apps/web/src/app/forgot-password/page.tsx` (noindex) + `forgot-password-form.tsx` (**client island 3**). **Commit body MUST include the state contract verbatim + the R6 timing-leak note.** (dep: T018, T010, T011, T005, T003)
- [ ] T020 [US3] Create `apps/web/src/app/reset-password/[token]/actions.ts` — `completePasswordReset` in a single transaction: re-check `used=false AND expires>now()` (TOCTOU) → update `users.passwordHash` → set token `used=true` → **delete all `sessions` for that `userId`** → `redirect("/login?reset=1")`. **Commit body MUST include the state contract verbatim + the TOCTOU + log-out-everywhere note.** (dep: T003, T004, T010)
- [ ] T021 [US3] Create `apps/web/src/app/reset-password/[token]/page.tsx` (ƒ dynamic; token lookup → render form if valid, else "no longer valid" view with link to `/forgot-password`; noindex) + `reset-password-form.tsx` (**client island 4**). (dep: T020, T011)

**STOP 4 gate** — forgot-password returns identical neutral view for known/unknown emails; reset email issued for real accounts; valid reset link sets new password, marks token used, invalidates all sessions; expired/used/unknown link → invalid view; reuse-after-success rejected (TOCTOU). All 3 emails render. **Client-island count = 4 (≤5 budget holds).**

---

## Phase D — Middleware + /account + auth-aware nav (STOP 5) · T022–T024

**User stories**: US4 (protected access + auth-aware nav), US5 (CTA flip — by route availability, no edits).

- [ ] T022 [US4] Create `apps/web/src/middleware.ts` — `export const config = { matcher: ["/account/:path*"] }`; redirect to `/login?callbackUrl=<pathname>` when the session cookie is absent (R5 shape 2: cookie-presence redirect; `/account`'s `auth()` is the authoritative guard). Confirm the concrete API against installed `next-auth@5.0.0-beta.31`. (dep: T007)
- [ ] T023 [US4] Create `apps/web/src/app/account/actions.ts` (`signOutAction` → `signOut({redirectTo:"/"})`) and `apps/web/src/app/account/page.tsx` (server; `await auth()`; **defensive `if(!session?.user) redirect("/login?callbackUrl=/account")`**; render h1 welcome, email in DOM text, "Member since {createdAt}", verified status, sign-out `<form action={signOutAction}>`; reuses `<TopNav/>`+`<SiteFooter/>`; metadata noindex). (dep: T007)
- [ ] T024 [US4] [US5] Edit `apps/web/src/components/landing/top-nav.tsx` — make it `async`, `await auth()`; **logged-out branch renders the current right-side markup byte-identical** (`<Link href="/login">Sign in</Link>` + `<Link href="/signup">Start free →</Link>`); logged-in branch → `<Link href="/account">{user.name ?? truncateEmail(user.email)}</Link>` + sign-out `<form action={signOutAction}>`. Left wordmark + NAV_LINKS unchanged; no mobile menu exists. Discipline moment #4 — first chrome edit since slice 005. (dep: T007, T023)

**STOP 5 gate** — middleware redirects `/account`→`/login?callbackUrl=/account` when signed out and honors callbackUrl post-login; `/account` renders correct user data when signed in; sign-out destroys session → `/`; **logged-out top-nav byte-identical to baseline `git show 0cd598c:apps/web/src/components/landing/top-nav.tsx` (allow only whitespace/attr-order diff)** across a spot-check of slice-005…012 routes.

---

## Phase E — Gates (STOP 6) · T025–T026

- [ ] T025 **Local gate** against a clean production build (`pnpm typecheck && pnpm lint && pnpm --filter web build`; `pnpm --filter web start -p 3127`). Verify:
  - typecheck/lint/build exit 0; First Load JS < 180 KB for all auth routes (form pages ~110–115 KB, server pages ~107 KB); render modes per contracts §1.
  - Route smoke: `/signup`,`/signup/verify-email-sent`,`/login`,`/forgot-password` → 200; `/reset-password/<valid>` & `<invalid>` → 200; `/account` signed-out → 302→`/login?callbackUrl=/account`; `/signup/verify-email?token=bad` → 302.
  - **Link-flip via RENDERED-HTML grep** (NOT source): `curl` `/`, `/pricing`, `/about`, `/contact`, `/blog`, a `/blog/{slug}`, a `/problems/{slug}`; grep response bodies for `href="/signup"` and `href="/login"`; confirm total **≥ 9** `/signup` and **≥ 1** `/login` across routes (the 3 `pricing/tier-data.ts` CTAs appear in `/pricing`'s HTML; the `try-bristle-card.tsx` const appears on blog routes); then `curl /signup` and `/login` → live forms, not ComingSoon.
  - **Logged-out top-nav visual regression**: capture baseline `git show 0cd598c:apps/web/src/components/landing/top-nav.tsx`; curl every slice-005…012 route; grep the right-side nav block; confirm only whitespace/attr-order differs from the rendered pre-edit affordances.
  - End-to-end happy path (signup→verify→login→/account→sign-out) + reset path; 3 emails arrive; rate limits (4th signup/forgot in 1h, 6th login in 1min → generic); forgot-password response-equivalence (R6); voice greps clean (no `!`/emoji/amazing/awesome) across all new files incl. 3 email templates; no-JS submit on all 4 forms; WCAG (labels/`aria-describedby`/`role=alert`/`type=password`/focus); schema verification (5 tables); `pnpm-lock.yaml` diff = 3 deps + transitive only.
  - **Count cross-check re-run** (header numbers): 5 tables / 4 islands / 3 emails / 9 signup-refs / 1 login-ref / 2 stub rewrites / 1 chrome edit / 1 constitution edit. (dep: T024 + all prior)
- [ ] T026 **Preview parity** — push via `git push "https://x-access-token:$(gh auth token)@github.com/cornel-stack/bristle.git" 013-auth:013-auth`; on the Vercel preview: all routes 200/redirect per table; full end-to-end + reset walks on preview; cross-slice regressions for slices 005–012 (pricing→/faq, enterprise→/contact, footer legal ×4, blog, changelog, `/changelog.atom` 13 `<entry>`); `x-robots-tag: noindex`; signed-out nav unchanged; Lighthouse ≥ 90 Perf/A11y/BP on `/login`,`/signup`,`/account`; **slice integrity vs true baseline `0cd598c`** (only the flagged exceptions changed: CLAUDE.md §3, packages/db schema, top-nav.tsx, signup/login rewrites + net-new auth files). (dep: T025)

**STOP 6 gate** — full slice-012-style sweep green locally + on preview. Hold for review before any PR/merge/tag.

---

## Dependencies (critical edges)

```text
T001 (constitution) ──► everything (it records the stack the rest depends on)
T002 (deps) ──► T003, T004, T007
T003 (schema) ──► T007, T008, T013, T016, T019, T020, T023
T007 (auth.ts) ──► T013, T016, T017, T022, T023, T024
T008 (generate) ──► T009 (migrate) ──► [Phase C runtime verification + STOP 2 gate]
T006 (email shell) ──► T012, T018
T012 (verify+welcome email) ──► T013, T016
T013 (signup action) ──► T014
T018 (reset email) ──► T019, T020
T020 (reset action) ──► T021
T023 (/account + signOut) ──► T024 (top-nav uses signOutAction)
T024 (top-nav edit) ──► T025 link-flip + visual-regression gates
T025 (local gate) ──► T026 (preview)
```

**Parallelizable [P] within a batch** (different files, no incomplete-dep): A → {T004, T005, T006}; C1 → {T010, T011, T012}; C2 → {T018} (then T019/T020 serialize via the reset-token data path). Everything else is serial on the edges above.

## Sequencing concerns (flagged)

1. **Email modules straddle the C1/C2 split.** The plan labeled C2 "recovery + emails", but signup (C1/T013) needs the *verification* email and verify (C1/T016) needs the *welcome* email — so `verify-email`/`welcome-email`/`auth-emails` are pulled into C1 (T012). Only the *password-reset* email is genuinely C2 (T018). This is an intentional refinement of plan §18; the C1/C2 user-story boundary (US1+US2 vs US3) is preserved.
2. **STOP 2 is a hard hold.** Phase C runtime checks (account creation, login) require the dev tables to exist; do not begin C1 runtime verification until T009 is green (code in C1 still *compiles* without the migration, but its STOP-3 behavior checks need it).
3. **T024 must follow T023** (top-nav references `signOutAction` from `/account/actions.ts`) and **must precede T025** (the link-flip + visual-regression gates read the edited nav). Capture the `0cd598c` baseline at gate time via `git show` — no separate task needed.
4. **Task-number divergence from the brief's estimates** (content identical; only numbering shifted): schema migration is **T008–T009** (brief said T007–T008, +1 because Phase A has 7 foundation tasks); forgot-password action is **T019** (brief said T013 — C1 carries 8 tasks); top-nav is **T024** (brief said T023); gates are **T025–T026** (matches the brief).
