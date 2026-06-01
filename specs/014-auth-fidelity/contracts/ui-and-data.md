# Phase 1 Contracts: UI & Data (Slice 014 — Auth Fidelity)

Route table, Auth.js config delta, Server-Action contracts, OAuth + callback contract, email contract, and component prop contracts. Schema lives in `../data-model.md`; decisions in `../plan.md`.

---

## 1. Route table (delta from slice 013)

| Route | Kind | Render | Auth | Metadata | Change this slice |
|---|---|---|---|---|---|
| `/signup` | Page + Server Action | ○ Static | public | indexable | **REWRITE** — split layout (editorial left) |
| `/signup/verify-email` | **Page** + Server Actions | ƒ Dynamic | public | noindex | **REPLACES Route Handler** — code-entry page (`?email=`) |
| `/signup/verify-email-sent` | — | — | — | — | **DELETED** (entire dir) |
| `/login` | Page + Server Action | ○ Static | public | indexable | **REWRITE** — split layout MIRRORED (editorial right) |
| `/forgot-password` | Page + Server Action | ○ Static | public | noindex | **REWRITE** — split layout (editorial left) |
| `/reset-password/[token]` | Page + Server Action | ƒ Dynamic | public | noindex | **REWRITE** — split layout MIRRORED (editorial right) |
| `/auth/callback/[provider]` | **Page** + tiny Server Action | ƒ Dynamic | public | noindex | **NEW** — single centered panel, progress + poll |
| `/account` | Page + Server Action | ƒ Dynamic | protected | noindex | **UNCHANGED** (preserved) |
| `/api/auth/[...nextauth]` | Route Handler | ƒ Dynamic | — | none | **UNCHANGED** — now also serves Google/GitHub signin+callback |

Status expectations (STOP 8 gate): the four rewritten form pages → 200; `/signup/verify-email?email=<x>` → 200, missing/garbage `email` → 200 with a "back to signup" prompt; `/reset-password/<valid|invalid>` → 200; `/auth/callback/google` with a live session → 302 → `/account`; without → 200 (progress UI); `/account` signed-out → 302 → `/login?callbackUrl=/account`; `/signup/verify-email-sent` → 404 (deleted); `/signup/verify-email` GET as old route handler → no longer exists (now a page).

---

## 2. Auth.js config contract (`apps/web/src/auth.ts`) — delta only

```text
NextAuth({
  trustHost: true,                                       // UNCHANGED
  adapter: DrizzleAdapter(getDb(), { usersTable, accountsTable, sessionsTable, verificationTokensTable }),  // UNCHANGED
  session: { strategy: "database", maxAge: 60*60*24*30 },// UNCHANGED (30d; OAuth sessions use this)
  pages:   { signIn: "/login" },                         // CHANGED — drop verifyRequest (D12/R4; target page deleted)
  cookies: { sessionToken: { name: SESSION_COOKIE_NAME, options: SESSION_COOKIE_OPTIONS } },  // UNCHANGED
  providers: [                                            // CHANGED — was []
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, authorization: { params: { scope: "openid email profile" } } }),
    GitHub({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, authorization: { params: { scope: "read:user user:email" } } }),
  ],
  callbacks: { session({ session, user }) { session.user.id = user.id; session.user.emailVerified = user.emailVerified ?? null; return session } },  // UNCHANGED
}) → exports { handlers, signIn, signOut, auth }
```

- **Fail-fast at module load** (FR-014): alongside the existing `AUTH_SECRET` check, throw if any of `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` is missing. (This is the preview-build trap — D5/R1-of-ops.)
- **Scopes** = profile + email minimum (FR-016): Google `openid email profile`; GitHub `read:user user:email`.
- **No `Credentials` provider** is (re)added — providers are non-credentials only, so the v5 `onlyCredentials`+database assertion stays un-tripped (R2). Credentials login remains the manual `createUserSession` path.

---

## 3. Server-Action contracts

State shape carries the slice-013 discriminated union (extended): `{status:"idle"} | {status:"validation-error", fieldErrors, values} | {status:"transport-error", values} | {status:"rate-limited", retryAfter} | {status:"unverified"} | {status:"invalid-code"} | {status:"code-expired"} | {status:"attempts-exhausted"} | {status:"resend-cooldown", retryAfter}`. Action order is always **(1) rate-limit → (2) Zod parse → (3) transport**. All modules are `"use server"` and export only async functions (D9a). Non-password values echoed on error.

### 3.1 `createAccount(prev, formData)` — `app/signup/actions.ts` (EDIT)
- Input (Zod, shared): `{ name?, email, password (≥12), terms (must be true) }`.
- Flow: rate-limit `signup:<ip>` (3/h) → parse (reject if `terms` unchecked → `validation-error` on the terms field, SC-008) → `createUser({ email, name, passwordHash })` → `setEmailVerificationCode({ userId, codeHash: hashCode(code), expires: now+CODE_TTL })` (attempts=0) → set `terms_accepted_at = now()`, `terms_version = TERMS_VERSION` → `sendVerificationCodeEmail({ to, code, name })` → `redirect("/signup/verify-email?email=<email>")`.
- Duplicate email → generic create error (no enumeration; unchanged from 013).

### 3.2 `verifyEmailCode(prev, formData)` — `app/signup/verify-email/actions.ts` (NEW)
- Input: `{ email, code (6 digits) }`.
- Flow: rate-limit `verify-code:<ip>` → look up user by email → if `attempts >= 5` → `attempts-exhausted` → if `code_expires < now` → `code-expired` → `verifyCode(input, user.email_verification_code)`:
  - success → `consumeEmailVerificationCode({ userId })` (atomic: `emailVerified=now()`, null code/expiry, attempts=0) → `sendWelcomeEmail` → `redirect("/login?verified=true")`.
  - failure → `incrementEmailVerificationAttempts(userId)` → `invalid-code`.
- TOCTOU-safe: success is a single atomic update; a second submit of a consumed code finds no outstanding code → treated as already-verified/redirect.

### 3.3 `resendVerificationCode(formData)` — same file (NEW)
- Input: `{ email }`. Flow: rate-limit `resend-code:<email>` + `resend-code:<ip>` with `RESEND_COOLDOWN_MS` (24s) → if within cooldown → `resend-cooldown` with `retryAfter` seconds (drives the client countdown 24→0) → else `setEmailVerificationCode(new hash, now+TTL, attempts=0)` → `sendVerificationCodeEmail` → success state with `retryAfter=24`.

### 3.4 `useDifferentEmail(formData)` — same file (NEW)
- Input: `{ email }`. Flow: `deleteUnverifiedUserByEmail(email)` (deletes only where `emailVerified IS NULL`, C-h) → `redirect("/signup?email=<email>")`. A verified account is never deleted (returns false → still redirect to signup, no deletion).

### 3.5 `signInWithCredentials(prev, formData)` — `app/login/actions.ts` (EDIT)
- Input: `{ email, password, rememberMe (bool) }`.
- Flow (unchanged except rememberMe): rate-limit `login:<ip>` (5/min) → parse → look up user → **if `passwordHash` is null → generic invalid-credentials** (D15; OAuth-only account) → `verifyPassword` → if unverified → `unverified` → else `createUserSession(user.id, rememberMe)` → `redirect("/account")`.

### 3.6 Password recovery actions — UNCHANGED logic
`requestPasswordReset` (always-success) and `completePasswordReset` (single-use token, session invalidation) carry forward from slice 013 unchanged; only their pages are rebuilt.

### 3.7 `signOutAction` — UNCHANGED (`lib/auth/session.ts` / account actions).

### 3.8 Callback poll action — `app/auth/callback/[provider]` (NEW, tiny)
- `checkSession(): Promise<boolean>` — `auth()` → returns whether a session exists. Called by `CallbackProgressPoller` every 500ms; the page itself also checks on render and short-circuits.

---

## 4. OAuth + callback contract

- **Buttons** (`oauth-button-row`): `<a href="/api/auth/signin/google?callbackUrl=%2Fauth%2Fcallback%2Fgoogle">` and `…/github?callbackUrl=%2Fauth%2Fcallback%2Fgithub`. Plain anchors → no client JS, works server-rendered. SSO button: `<button disabled aria-disabled="true" title="Coming soon — SSO available on Enterprise">` — no href, no navigation (FR-019, SC-010).
- **Flow**: click → Auth.js signin → provider consent (scope profile+email) → `/api/auth/callback/{provider}` (existing handler) → adapter creates `accounts` row + `sessions` row + cookie → redirect to `/auth/callback/{provider}`.
- **`/auth/callback/[provider]/page.tsx`**: server component; `await auth()`; if session → `redirect(callbackUrl ?? "/account")`; else render centered single-panel progress (NOT split layout): Bristle+provider logo composite, serif h1 "Signing you in with {Provider}…", subhead, STATUS card with 4 rows — Authenticated with {Provider} ✓, Verifying ID token signature ✓, Creating Bristle session (active dot), Loading workspace (pending) — and `<CallbackProgressPoller provider callbackUrl />`. Footer: "Taking too long? Sign in with email →" → `/login`.
- **`CallbackProgressPoller`** (client island): polls `checkSession()` every 500ms; on true → `router.replace(callbackUrl ?? "/account")`; after 10s (C-i) → `router.replace("/login")`.
- **Auto-link** (C-m): Auth.js v5 default — OAuth email matching an existing user links the provider account to that user silently. Accepted v1; TF-001 tracked.

---

## 5. Email contract — `verify-email-code.ts` (NEW; replaces link template)

- `renderVerifyEmailCodeHtml({ code, expiresInMinutes, name? }): string` — reuses `lib/email/shared.ts` shell (`brandHeader`/`unsubscribeFooter`/base). Body prominently displays the **6 digits** (large, mono, letter-spaced) + "expires in {expiresInMinutes} minutes". Inline styles only, no images.
- **Subject** (C-d): `Your Bristle verification code: {code}` — code in subject for fast scanning.
- Voice (§6): no exclamation, no marketing, no emoji. e.g. body lead "Enter this code to verify your email." / footer "You're receiving this because you signed up for Bristle."
- Sender: `EMAIL_FROM` (existing slice-013 auth-mail var); displayed contact `hello@bristle.dev` per design (TF-007 caveat: Resend sandbox only delivers to the founder's address).
- **DELETE** `lib/email/verify-email.ts` (link template). `sendWelcomeEmail` / `sendPasswordResetEmail` unchanged.

---

## 6. Component prop contracts (the 10 primitives + 2 new islands)

Server-renderable unless marked **(client)**. All use §4 tokens; no inline style.

| Component | Props (intended) | Notes |
|---|---|---|
| `auth-split-layout` | `{ editorialSide: "left"\|"right"; children }` | Renders `editorial-panel` on `editorialSide`, form `children` opposite. <768px: editorial hidden/brand-strip, form full-width (R9). |
| `editorial-panel` | `{ showLogo=true; overlineText="TODAY ON BRISTLE"; headlineText=…; bodyText=…; testimonial=Jules Marin quote+author; showStats=true }` | Zero-prop renderable (FR-007). Dark bg. |
| `brand-footer-stats` | `{}` | Static "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" mono (FR-008, C-b). |
| `auth-overline` | `{ text; variant: "simple"\|"with-counter"\|"multi-step" }` | Orange accent caps/mono (§4). |
| `or-email-divider` | `{}` | Rule + "OR EMAIL" mono caps. |
| `password-field` | `{ name; label; labelLink?: {href,text}; showToggle=true; …input }` | Show/hide eye; optional right-aligned label link ("Forgot?"). |
| `oauth-button-row` | `{ callbackPath?: string }` | Google + GitHub anchors (§4) + disabled SSO. |
| `password-strength-meter` **(client)** | `{ password: string }` | `scorePassword` 0–4 → 4 segments + label (R5, D13). |
| `password-requirements-list` **(client)** | `{ password: string }` | 4 rows; "Not used elsewhere" always inactive (FR-010). |
| `code-input` **(client)** | `{ length=6; name; onComplete? }` | OTP model (R6/D14); `aria-label="Digit N of 6"`; no auto-submit. |
| `verify-email-code-form` **(client)** | `{ email }` | Wraps `code-input` + `verifyEmailCode`/`resendVerificationCode`/`useDifferentEmail`; countdown. |
| `callback-progress-poller` **(client)** | `{ provider; callbackUrl? }` | Polls `checkSession()` 500ms; 10s fallback. |

Client-island budget (D16): **6 route-level islands** — 4 rewritten forms + `verify-email-code-form` + `callback-progress-poller` — within the **revised ≤7** budget (1 slot headroom). The strength meter / requirements / code-input are `"use client"` leaf components imported *into* the form islands (not separately mounted); they count toward the 130 KB per-route budget (D7), not the island count. Total `"use client"` files = 9.

---

## 7. Constants (single source — `lib/auth/email-verification-code.ts`)

`CODE_TTL_MS = 10*60*1000` (C-e) · `CODE_MAX_ATTEMPTS = 5` (C-g) · `RESEND_COOLDOWN_MS = 24*1000` (C-f) · `TERMS_VERSION` string (C-j; e.g. `"2026-06-01"`). `SESSION_MAX_AGE_MS` (30d) carried forward in `session-cookie.ts`.
