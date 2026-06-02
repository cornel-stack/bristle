# Tasks: Auth Visual + Functional Fidelity (Slice 014)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/ui-and-data.md](./contracts/ui-and-data.md) · **Quickstart**: [quickstart.md](./quickstart.md)

**Branch**: `014-auth-fidelity` · **True baseline**: `52dd247` (PR #12 merge — slice-013 head)

**Guard**: tasks only — do NOT implement. One commit per task (CLAUDE.md §7).

---

## Task count (re-verify every claim at STOP 8 — slice-011/012/013 count-drift lesson)

**38 tasks total** — **36 commit-producing (T001–T036, minus the two pure gates)** + **gate/precheck tasks**. Eight batches / eight STOPs.

| Batch | STOP | Tasks | Count | Theme |
|---|---|---|---|---|
| 0 | 1 | T001–T003 | 3 | Constitution edit + schema migration 0002 |
| A1 | 2 | T004–T010 | 7 | Server-renderable layout primitives |
| A2 | 3 | T011–T013 | 3 | Stateful client leaf components + bundle baseline |
| B | 4 | T014–T018 | 5 | OAuth providers + callback page (∥-eligible with C) |
| C | 5 | T019–T026 | 8 | Code-based email verification (∥-eligible with B) |
| D | 6 | T027–T032 | 6 | Page rebuilds (5 rewrites + 1 new) |
| E | 7 | T033–T036 | 4 | Edge cases + polish + bundle recheck |
| F | 8 | T037–T038 | 2 | Local gate + preview gate |

**Anchor mapping** (founder brief used approximate IDs): constitution = **T001** ✓; schema = **T002–T003** ✓; OAuth-env precheck = **T014** (brief said "before T011" — A1's 7 + A2's 3 occupy T004–T013, so Batch B begins at T014); code-verify = **T019–T026** (brief "T014-ish"); page rewrites = **T027–T032** (brief "T020+").

---

## STOP-1 count cross-check matrix (re-asserted verbatim at STOP 8)

- **6 `users` changes** = 5 new columns (`email_verification_code`, `email_verification_code_expires`, `email_verification_attempts`, `terms_accepted_at`, `terms_version`) + 1 constraint relaxation (`passwordHash` DROP NOT NULL). → migration `0002`, **6 statements**.
- **10 new primitives** = 7 server (A1) + 3 client leaf (A2).
- **7 client islands budget (revised from ≤5; D16)** — actual **6 route-level islands**: 4 rewritten (`signup-form`, `login-form`, `forgot-password-form`, `reset-password-form`) + 2 new (`verify-email-code-form` wrapping `code-input`; `callback-progress-poller`). The 3 A2 leaf components are `"use client"` but imported into islands, not separately mounted (total `"use client"` files = 9).
- **6 routes touched** = 5 rewrites (`/signup`, `/login`, `/forgot-password`, `/reset-password/[token]`, `/signup/verify-email`) + 1 new (`/auth/callback/[provider]`).
- **2 deletions** = `app/signup/verify-email-sent/` (dir) + `app/signup/verify-email/route.ts`. Plus `lib/email/verify-email.ts` (link template).
- **8 Server Actions** (contracts §3) = createAccount(edit), verifyEmailCode, resendVerificationCode, useDifferentEmail, signInWithCredentials(edit), requestPasswordReset(unchanged), completePasswordReset(unchanged), checkSession(new, callback poll).
- **4 new env vars** = `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- **1 constitution edit** (CLAUDE.md §3 — OAuth providers). **1 new email template** (`verify-email-code.ts`) + **1 template deletion** (`verify-email.ts`).
- **0 new runtime dependencies** — Google/GitHub are `next-auth` submodules; argon2/adapter/zod/resend reused. Lockfile diff expected EMPTY.

---

## ⚠️ Five discipline-change moments (reviewers: these are NOT routine)

1. **T001 — Constitution edit.** First `CLAUDE.md` §3 change since slice 013's auth-stack swap. Adds Google + GitHub to the locked providers (was `[]`, deferred); SSO/SAML still deferred. Single-purpose, audit-isolated commit.
2. **T002–T003 — Schema migration `0002`.** First schema change since slice 013. Additive 5 columns **plus** the discovered `passwordHash` nullability fix (D15/R9 — OAuth users have no password). Rollback SQL inline; the same shared dev/prod Supabase project receives it.
3. **T015 — OAuth provider activation.** First non-empty `providers` array in the project; the first time the `accounts` table is actually written. Un-blocks the v5 `onlyCredentials`+database assertion by design (providers become non-credentials). Verify `auth()` still resolves the hand-rolled credentials session afterward.
4. **T019–T026 — Code-based verify replaces link-based.** A user-facing flow change and the project's **first deletion of shipped routes** (verify-email-sent page + link Route Handler). The STOP 8 diff must show exactly these deletions and nothing more.
5. **T027–T032 — Wholesale rewrite of 5 slice-013 pages.** Second wholesale rewrite cycle (after slice-013's stub rewrites). Expected non-additive churn; not a regression — but `/account`, middleware, and the auth-aware nav must stay untouched.

---

## Phase 0 — Constitution + Schema (STOP 1) · T001–T003

- [X] T001 Edit `CLAUDE.md` §3 — update the "Auth — Auth.js v5" bullet so the locked providers array reflects Google + GitHub shipping **this slice** (was `[]` / "OAuth deferred"); keep SSO/SAML explicitly deferred; note the `accounts` table moves from provisioned-only to actively used. **Single-purpose commit, no other files.** Discipline moment #1.
- [X] T002 Edit `packages/db/src/auth-schema.ts`: add the 5 Bristle-custom columns to `users` per data-model.md (`emailVerificationCode` text / `emailVerificationCodeExpires` timestamptz / `emailVerificationAttempts` integer NOT NULL default 0 / `termsAcceptedAt` timestamptz / `termsVersion` text — snake_case DB names) **and drop `.notNull()` on `passwordHash`** (D15). Run `pnpm --filter @bristle/db db:generate` → `packages/db/drizzle/0002_<name>.sql`; confirm it contains exactly the **6 statements** (5 ADD COLUMN + 1 ALTER COLUMN … DROP NOT NULL); **append the `-- ROLLBACK` comment block** (reverse order, with the "re-adding NOT NULL fails if OAuth-only users exist" warning per data-model.md). Discipline moment #2. (dep: T001)
- [X] T003 Apply migration `0002` to the Supabase DB via `pnpm --filter @bristle/db db:migrate` (uses `DATABASE_URL_DIRECT`); run the verification query (filter `table_schema='public'`, D9d) confirming all 6 changes landed:
  ```sql
  SELECT column_name, is_nullable FROM information_schema.columns
   WHERE table_schema='public' AND table_name='users'
     AND column_name IN ('email_verification_code','email_verification_code_expires',
       'email_verification_attempts','terms_accepted_at','terms_version','passwordHash')
   ORDER BY column_name;
  -- expect 5 new columns present + passwordHash is_nullable = 'YES'
  ```
  Optionally `DELETE FROM "verificationTokens";` (retained table, rows droppable). (dep: T002)

**STOP 1 gate (HOLDS HERE on T003 verification)** — all 5 new columns present AND `passwordHash` nullable in the DB; `email_verification_attempts` defaults 0; `pnpm typecheck` clean; migration `0002` + rollback block committed; CLAUDE.md §3 edit visible as its own commit. Re-assert the count matrix above. No runtime feature work until green.

---

## Phase A1 — Server-renderable layout primitives (STOP 2) · T004–T010

All under `apps/web/src/components/auth/`; server components; §4 tokens only (no hex, no inline `style`); no `"use client"`.

- [X] T004 [P] Create `brand-footer-stats.tsx` — mono (JetBrains Mono) ticker "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO", static for v1 (C-b). (dep: T001)
- [X] T005 Create `editorial-panel.tsx` — dark-bg panel, zero-prop renderable (FR-007): `showLogo=true`, `overlineText="TODAY ON BRISTLE"`, `headlineText="Real problems, ranked by evidence — not vibes."`, default `bodyText`, Jules Marin `testimonial`+author, `showStats=true` (renders `BrandFooterStats`). (dep: T004)
- [X] T006 Create `auth-split-layout.tsx` — props `{ editorialSide: "left"|"right"; children }`; editorial panel on `editorialSide`, form `children` opposite; <768px hides editorial / brand-strip + form full-width (R9). (dep: T005)
- [X] T007 [P] Create `auth-overline.tsx` — orange accent caps/mono; variants `simple` | `with-counter` | `multi-step` (§4). (dep: T001)
- [X] T008 [P] Create `or-email-divider.tsx` — rule + centered "OR EMAIL" mono caps. (dep: T001)
- [X] T009 [P] Create `password-field.tsx` — labeled input + show/hide eye toggle (`aria-label`); optional right-aligned label link `{href,text}` (for "Forgot?"); `htmlFor` association. (dep: T001)
- [X] T010 [P] Create `oauth-button-row.tsx` — Google + GitHub as `<a>` (hrefs wired in T018), prop `callbackPath?`; disabled SSO `<button disabled aria-disabled="true" title="Coming soon — SSO available on Enterprise">` (no navigation, FR-019). (dep: T001)

**STOP 2 gate** — each primitive renders in isolation with §4 tokens; the zero-prop `EditorialPanel` renders logo/overline/headline/subhead/testimonial/stats; `AuthSplitLayout` mirrors correctly and collapses at 768px; no `"use client"` introduced; typecheck/lint clean.

---

## Phase A2 — Stateful client leaf components + bundle baseline (STOP 3) · T011–T013

Under `apps/web/src/components/auth/`; `"use client"`; dependency-free (no zxcvbn — D7). These are leaf components imported into islands (do not count against the ≤7 island budget; do count toward bundle).

- [X] T011 [P] Create `password-strength-meter.tsx` — pure `scorePassword(pw): 0|1|2|3|4` (length tiers + char-class diversity + repeat/sequence penalty, R5/D13); 4 colored segments + qualitative label matching the design strings ("Strong — …" / "Excellent — passphrase-style passwords resist 4M× more attempts."). Prop `{ password }`. (dep: T001)
- [X] T012 [P] Create `password-requirements-list.tsx` — 4 rows (≥12 chars / contains a number / contains uppercase / "Not used elsewhere — we can't check this" ALWAYS inactive), check vs dot icon per state. Prop `{ password }`. (dep: T001)
- [X] T013 [P] Create `code-input.tsx` — 6 `<input inputmode="numeric" autocomplete="one-time-code" maxLength=1>` with `aria-label="Digit N of 6"`; roving focus (type→advance, Backspace→clear/retreat, Arrow nav), paste-spread of 6 digits on the first box, `aria-live="polite"` completion announcement, **no auto-submit** (R6/D14/FR-011). Props `{ length=6; name; onComplete? }`. (dep: T001)

**STOP 3 gate (bundle baseline #1)** — strength meter updates live with correct color/label per score; requirement pills toggle per char class; CodeInput keyboard model passes (Tab/Shift-Tab/Backspace/Arrow/paste). **Bundle measurement #1**: measure the new client components' contribution (bundle analyzer / throwaway harness — note: authoritative *per-route* First Load JS is not measurable until the pages are wired in Batch D, so this is the early-warning baseline). Report island-cost; **watch if any contribution trends toward >110 KB route impact; hard-block planning if clearly >130 KB.**

---

## Phase B — OAuth providers + callback page (STOP 4) · T014–T018 · ∥-eligible with Phase C after STOP 1 + STOP 3

**User story**: US2 (Google/GitHub sign-in). Parallel-eligible with Phase C (separate files; no shared primitive — D4).

- [ ] T014 **OAuth env precheck — FOUNDER ACTION GATE (runs before T015).** Confirm all four of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` are present in `apps/web/.env.local` AND that `turbo.json` `build.env` lists all four. If any is missing, STOP and emit: **"FOUNDER ACTION REQUIRED — create the Google Cloud OAuth client + GitHub OAuth App (quickstart §0) and set the 4 vars in `.env.local` + Vercel Production+Preview + `turbo.json build.env` before Batch B proceeds."** Without these, Batch B's preview build dies at "Collecting page data" (slice-013 AUTH_SECRET trap, R1). (dep: STOP 1)
- [ ] T015 Edit `apps/web/src/auth.ts` — `providers: [Google({clientId,clientSecret,authorization:{params:{scope:"openid email profile"}}}), GitHub({clientId,clientSecret,authorization:{params:{scope:"read:user user:email"}}})]` (import from `next-auth/providers/{google,github}`); **drop `pages.verifyRequest`** (D12/R4 — target page deleted); add module-load fail-fast throwing if any OAuth secret is missing (mirrors the AUTH_SECRET guard). Leave adapter/session/cookies/callbacks untouched. Discipline moment #3. (dep: T014)
- [ ] T016 [P] Add the 4 OAuth vars to `apps/web/.env.example` (with comments) and append all 4 names to `turbo.json` `build.env` (after the existing 10). (dep: T014)
- [ ] T017 Create `apps/web/src/app/auth/callback/[provider]/page.tsx` — server component; `await auth()`; if session → `redirect(callbackUrl ?? "/account")`; else render centered single-panel (NOT split layout) per design 2_6: Bristle+provider logo composite, serif h1 "Signing you in with {Provider}…", subhead, 4-step STATUS card (Authenticated ✓ / Verifying ID token ✓ / Creating Bristle session • / Loading workspace ◦), footer "Taking too long? Sign in with email →" → `/login`. Add a tiny `checkSession()` server action (returns whether `auth()` has a session). noindex. (dep: T015)
- [ ] T018 Create `apps/web/src/components/auth/callback-progress-poller.tsx` (**client island**; props `{provider, callbackUrl?}`; polls `checkSession()` every 500ms → `router.replace(callbackUrl ?? "/account")`; 10s fallback → `/login`, C-i) and **wire the `oauth-button-row` hrefs** to `/api/auth/signin/{provider}?callbackUrl=/auth/callback/{provider}` (T010 component). (dep: T017, T010)

**STOP 4 gate** — on preview (env confirmed both scopes), Google **and** GitHub round-trips reach `/account` with a valid session + an `accounts` row; callback page renders the 4-step progress and the poller redirects/fallbacks; SSO button disabled with tooltip; `auth()` still resolves a hand-rolled credentials session (assertion not tripped — discipline #3). Build did NOT die at page-data collection (R1 averted).

---

## Phase C — Code-based email verification (STOP 5) · T019–T026 · ∥-eligible with Phase B after STOP 1 + STOP 3

**User story**: US1 (signup → code verify). Parallel-eligible with Phase B (D4). Needs STOP 1 (columns) + STOP 3 (`code-input`).

- [X] T019 [P] Create `apps/web/src/lib/auth/email-verification-code.ts` — `generateCode()` (6 random digits), `hashCode(code)` (argon2id, **reusing the `lib/auth/password.ts` wrapper** — D11/R1, NOT SHA-256), `verifyCode(input, storedHash)`; constants `CODE_TTL_MS=600000`, `CODE_MAX_ATTEMPTS=5`, `RESEND_COOLDOWN_MS=24000`, `TERMS_VERSION`. (dep: STOP 1)
- [X] T020 [P] Create `apps/web/src/lib/email/verify-email-code.ts` (`renderVerifyEmailCodeHtml({code, expiresInMinutes, name?})` — large mono code block, reuses `lib/email/shared.ts` shell, voice-compliant) + add `sendVerificationCodeEmail()` to `apps/web/src/lib/auth-emails.ts`; **DELETE `apps/web/src/lib/email/verify-email.ts`** (link template). Subject `Your Bristle verification code: {code}` (C-d). (dep: STOP 1)
- [X] T021 [P] Add Drizzle query helpers to `packages/db/src/queries.ts` + re-export from `index.ts`: `setEmailVerificationCode({userId,codeHash,expires})` (resets attempts=0), `incrementEmailVerificationAttempts(userId)→number`, `consumeEmailVerificationCode({userId})` (atomic: `emailVerified=now()`, null code/expiry, attempts=0 — TOCTOU-safe), `deleteUnverifiedUserByEmail(email)→bool` (only `WHERE emailVerified IS NULL`, C-h). (dep: STOP 1)
- [X] T022 [US1] Edit `apps/web/src/app/signup/actions.ts` — `createAccount`: same up to user insert, then `setEmailVerificationCode(hashCode(generateCode()), now+CODE_TTL)`, set `terms_accepted_at=now()` + `terms_version=TERMS_VERSION`, `sendVerificationCodeEmail`, `redirect("/signup/verify-email?email=<email>")`. Reject unchecked Terms as a `validation-error` on the terms field (SC-008). **Commit body MUST include the state contract verbatim**: `idle | validation-error | transport-error | rate-limited`. (dep: T019, T020, T021)
- [X] T023 [US1] Create `apps/web/src/app/signup/verify-email/actions.ts` → `verifyEmailCode(prev, formData)`: rate-limit `verify-code:<ip>` → lookup by email → if `attempts>=5` → `attempts-exhausted` → if expired → `code-expired` → `verifyCode` → success: `consumeEmailVerificationCode` + `sendWelcomeEmail` + `redirect("/login?verified=true")`; failure: `incrementEmailVerificationAttempts` + `invalid-code`. **Commit body MUST include the state contract verbatim**: `idle | invalid-code | code-expired | attempts-exhausted | rate-limited`. (dep: T019, T021)
- [X] T024 [US1] Add `resendVerificationCode(formData)` to the same `verify-email/actions.ts` — rate-limit `resend-code:<email>`+`<ip>` with `RESEND_COOLDOWN_MS`; within cooldown → `resend-cooldown` with `retryAfter` (drives 24→0 countdown); else `setEmailVerificationCode(new)` + `sendVerificationCodeEmail`. **Commit body MUST include the state contract verbatim**: `resend-cooldown(retryAfter) | success | rate-limited`. (dep: T019, T021, T023)
- [X] T025 [US1] Add `useDifferentEmail(formData)` to the same file — `deleteUnverifiedUserByEmail(email)` (verified users never deleted) → `redirect("/signup?email=<email>")`. **Commit body MUST note**: deletes only `emailVerified IS NULL`; minimal state (redirect). (dep: T021, T023)
- [X] T026 [US1] **DELETE** `apps/web/src/app/signup/verify-email/route.ts` (link Route Handler) and the entire `apps/web/src/app/signup/verify-email-sent/` directory. Confirm no remaining import references either (`grep`). Discipline moment #4. (dep: T023)

**STOP 5 gate** — signup writes hashed code + 10-min expiry + Terms fields, routes to `/signup/verify-email?email=`; correct code → verified + welcome email + `/login?verified=true`; 5 wrong → `attempts-exhausted`; expired → `code-expired`; resend honors 24s cooldown with countdown; use-different-email deletes unverified + repopulates signup; link route + verify-email-sent dir gone (no dangling imports; `pages.verifyRequest` already dropped in T015).

---

## Phase D — Page rebuilds (STOP 6) · T027–T032

**User stories**: US1 (signup+verify), US2 (login), US3 (design fidelity), US4 (recovery). Each page composes A1 primitives + A2 islands; wires B (OAuth row) + C (verify/createAccount). Preserve `/account`, middleware, auth-aware nav.

- [ ] T027 [US1] Rewrite `apps/web/src/app/signup/page.tsx` (server; `AuthSplitLayout editorialSide="left"`) + rewrite `apps/web/src/components/auth/signup-form.tsx` (**island**): `AuthOverline "CREATE ACCOUNT · 1 OF 2"`, serif h1 "Start your research journal.", subhead **"Create your account · no card required"** (C-n — NOT a trial claim), `OAuthButtonRow`, `OrEmailDivider`, responsive name+email grid (stacks <640px), `PasswordField` + `PasswordStrengthMeter`, required Terms checkbox with linked legal pages, submit **"Create account →"** (C-n — no trial tail), "Have an account? Sign in" footer. (dep: T006, T010, T011, T009, T022)
- [ ] T028 [US1] Create `apps/web/src/app/signup/verify-email/page.tsx` (server; `AuthSplitLayout editorialSide="left"`; reads `?email=`, handles missing gracefully) + create `apps/web/src/components/auth/verify-email-code-form.tsx` (**island** wrapping `CodeInput` + `verifyEmailCode`/`resendVerificationCode`/`useDifferentEmail` with the 24→0 countdown): `AuthOverline "ONE MORE STEP"`, serif h1 "Verify your email.", subhead naming the email + expiry, "Verify & continue" submit, resend + "Use a different email" row, sender-contact pill ("The email comes from hello@bristle.dev…"). (dep: T006, T013, T023, T024, T025)
- [ ] T029 [US2] Edit `apps/web/src/app/login/actions.ts` — `signInWithCredentials` reads `rememberMe` → `createUserSession(user.id, rememberMe)`; **if `passwordHash` is null → generic invalid-credentials** (D15, OAuth-only account). Also edit `apps/web/src/lib/auth/session.ts`: `createUserSession(userId, rememberMe = true)` — cookie `expires` only when `rememberMe` (else session-only cookie), DB row stays 30d (R8/D2). **Commit body MUST include the state contract verbatim**: `idle | validation-error | transport-error | rate-limited | unverified` + the null-hash + rememberMe notes. (dep: STOP 1)
- [ ] T030 [US2] Rewrite `apps/web/src/app/login/page.tsx` (server; `AuthSplitLayout editorialSide="right"` — MIRRORED) + rewrite `login-form.tsx` (**island**): `AuthOverline "WELCOME BACK"`, serif h1 "Sign in to Bristle.", subhead "Sign in to your research journal." (C-c placeholder — NOT "14 new mentions"; ⌘K tip REMOVED, C-l), `OAuthButtonRow`, `OrEmailDivider`, email field, `PasswordField` with right-aligned "Forgot?" link → `/forgot-password`, "Keep me signed in" checkbox → rememberMe, "Sign in" submit, "New here? Create account" footer; handle `?verified=true`/`?reset=true` banners. (dep: T006, T010, T009, T029)
- [ ] T031 [US4] Rewrite `apps/web/src/app/forgot-password/page.tsx` (server; `AuthSplitLayout editorialSide="left"`) + rewrite `forgot-password-form.tsx` (**island**): `AuthOverline "ACCOUNT RECOVERY"`, serif h1 "Reset your password.", subhead, email field, "Send reset link" submit, green always-success pill, footer row ("← Back to sign in" / "Contact support"). Recovery logic unchanged (`requestPasswordReset` carried from 013). (dep: T006)
- [ ] T032 [US4] Rewrite `apps/web/src/app/reset-password/[token]/page.tsx` (server; `AuthSplitLayout editorialSide="right"` — MIRRORED) + rewrite `reset-password-form.tsx` (**island**): `AuthOverline "ACCOUNT RECOVERY · FINAL STEP"`, serif h1 "Choose a new password.", "Resetting password for [email]" context pill (email via read-only `isPasswordResetTokenValid`), `PasswordField` + `PasswordStrengthMeter`, confirm field with green match-check, `PasswordRequirementsList`, "Update password & sign in" submit. Token logic unchanged (`completePasswordReset` carried from 013). (dep: T006, T011, T012, T009)

**STOP 6 gate** — all 6 routes (incl. `/auth/callback/[provider]` from B) match their `design/auth-pages/` reference ≤4px at 1280px; mirrored layouts correct; `?verified=true`/`?reset=true` banners work; Terms blocks submit when unchecked; Keep-me-signed-in drives cookie lifetime; no-JS submit works on all 4 credentials forms; `/account`, middleware, and the auth-aware top-nav UNCHANGED (spot-check).

---

## Phase E — Edge cases + polish + bundle recheck (STOP 7) · T033–T036

- [ ] T033 Polish copy + states: confirm login subhead placeholder (C-c), the verify-email sender-contact pill, success/error banner styling across all forms, and voice compliance (no `!`/emoji/"amazing"/"awesome") on all new microcopy + the code email. (dep: STOP 6)
- [ ] T034 Accessibility pass: `CodeInput` full keyboard sweep (Tab/Shift-Tab/Backspace/Arrow/Cmd+V spread) + `aria-live` completion; OAuth callback `aria-live` progress region; labeled fields + associated errors on all forms; disabled-SSO `aria-disabled`; verify the "use a different email" flow end-to-end. (dep: STOP 6)
- [ ] T035 Responsive sweep at 1280 / 768 / 375: split layout → form-only with editorial collapsed/brand-strip <768px; name+email grid stacks <640px; no overflow/break at 375px. (dep: STOP 6)
- [ ] T036 **Bundle recheck #2 (authoritative)**: production build; record First Load JS for `/signup`, `/login`, `/forgot-password`, `/reset-password/[token]`, `/signup/verify-email`, `/auth/callback/[provider]`. **Report all six; surface any route >110 KB as a watch item; any route >130 KB is a HARD BLOCK** (C-k/D7) — fix before STOP 8. (dep: T033, T034, T035)

**STOP 7 gate** — a11y + responsive + voice all green; **per-route First Load JS ≤130 KB for all six auth routes** (the authoritative measurement, vs STOP 3's island-cost baseline).

---

## Phase F — Gates (STOP 8) · T037–T038

- [ ] T037 **Local gate** against a clean production build (`pnpm typecheck && pnpm lint && pnpm build`). Verify:
  - typecheck/lint/build exit 0; lockfile diff EMPTY (no new deps — count matrix).
  - **Slice-integrity diff vs `52dd247`** (D8): `git diff --stat 52dd247 -- apps/web packages/db turbo.json CLAUDE.md` shows exactly — 5 page rewrites, 2 deletions (verify-email-sent dir + verify-email/route.ts) + verify-email.ts template deletion, 4 form-island rewrites, the new components/page/email/lib/actions, and edits to `auth.ts`/`session.ts`/`rate-limit.ts`/`auth-schema.ts`/`queries.ts`/`index.ts`/`turbo.json`/`CLAUDE.md` — **nothing else**. Any unexpected file = flag.
  - **Cross-slice regression**: curl `/`, `/pricing`, `/faq`, `/about`, `/blog`, a `/blog/{slug}`, a `/problems/{slug}` signed-out → chrome byte-identical to baseline (slices 005–012); `/account` behavior unchanged (slice 013).
  - Voice/token greps clean across `components/auth/` + the rebuilt routes + the code email.
  - **Re-assert the STOP-1 count cross-check matrix verbatim.** (dep: T036 + all prior)
- [ ] T038 **Preview gate** — push to `014-auth-fidelity`; on the Vercel preview:
  - **OAuth env present in BOTH Production AND Preview scopes** (`vercel env ls | grep -E 'GOOGLE|GITHUB'` → all 4 × 2); `turbo.json build.env` has all 4; preview build did NOT die at page-data collection (R1).
  - **Migration `0002` applied** to the DB (same shared dev/prod Supabase project per slice-013 discovery; the 6 changes are live).
  - **5 end-to-end walks**: (1) email signup → code email → enter code → `/login?verified=true` → sign in → `/account`; (2) Google OAuth → `/auth/callback/google` → `/account`; (3) GitHub OAuth → `/account`; (4) forgot-password → reset email → reset form → sign in → `/account`; (5) sign out → `/`.
  - **Bundle regression**: per-route First Load JS ≤130 KB (re-confirm on the deployed build).
  - **Visual diff vs design**: capture the 6 auth routes at **1280px** on preview, compare against `design/auth-pages/{2_1…2_6}` within **4px tolerance** per acceptance criterion (SC-003).
  - `x-robots-tag: noindex` on verify/forgot/reset/callback; signed-out nav unchanged. (dep: T037)

**STOP 8 gate** — all SC-001…018 verified; the count matrix re-asserted; OAuth live on both scopes; 6 routes match design ≤4px; no route >130 KB; integrity diff matches the D8 manifest exactly.

---

## Dependencies & sequencing

**Cross-batch edges**:
- **STOP 1 (Batch 0) → everything** — schema columns block Phase C (verify actions) and Phase D (Terms capture, rememberMe via T029); the §3 edit lands first.
- **A1 (T004–T010) → D** — pages compose the primitives. Hard edge.
- **A2 (T011–T013) → D** — pages mount the leaf components (strength meter/requirements/code-input via islands). Also A2 → STOP 3 bundle baseline.
- **B (T014–T018) → D** — `/signup` + `/login` use the wired `OAuthButtonRow`.
- **C (T019–T026) → D** — `/signup` uses `createAccount` (T022); `/signup/verify-email` uses the verify actions (T023–T025).
- **B ∥ C** — parallel-eligible once STOP 1 + STOP 3 are green (separate files; the callback page shares NO primitive with the verify page — D4). They will likely *land* sequentially under one-commit-per-task session batching; reviewers must not enforce a false B→C order.
- **D → E → F** — linear.

**Intra-batch [P]**: A1 — T004/T007/T008/T009/T010 are [P]; T005 dep T004, T006 dep T005. A2 — T011/T012/T013 all [P]. B — T016 [P]; T015 dep T014, T017 dep T015, T018 dep T017+T010. C — T019/T020/T021 [P]; T022 dep T019+T020+T021; T023 dep T019+T021; T024 dep T023; T025 dep T023; T026 dep T023. D — T031 [P] (independent of B/C); others as noted.

**Sequencing concerns**:
1. **Bundle at STOP 3 is a *baseline*, not the per-route gate** — pages aren't wired until D, so STOP 3 measures island/component cost; STOP 7 (T036) is the authoritative per-route ≤130 KB gate. Don't treat a clean STOP 3 as a budget pass.
2. **T014 must hard-stop Batch B** if OAuth env is missing — the fail-fast in T015 turns a missing secret into a preview-build death (R1). The precheck is cheap insurance.
3. **T015 drops `pages.verifyRequest` in the same batch** the target page is deleted (T026) — if B and C land far apart, ensure neither leaves a window where `verifyRequest` points at a deleted route (low risk; verifyRequest is unused without the Email provider).
4. **`/account` + middleware + top-nav are PRESERVED** — Phase D rewrites must not touch them; the STOP 8 integrity diff is the backstop.

## Implementation strategy (MVP-first)

MVP = **STOP 1 → A1 → A2 → C → D(signup+verify+login)**: the email signup → 6-digit code → login loop on the rebuilt pages (US1+US2 credentials path). OAuth (Phase B) and recovery polish (forgot/reset rewrites) layer on without blocking the core loop. Phases E/F harden and gate.
