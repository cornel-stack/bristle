# Phase 1 Contracts: UI & Data (Slice 013 — Auth)

Route table, Server-Action state contracts, the Auth.js config contract, email contracts, and the auth-aware nav contract. Schema lives in `../data-model.md`.

---

## 1. Route table

| Route | Kind | Render | Auth | Metadata | Purpose |
|---|---|---|---|---|---|
| `/signup` | Page + Server Action | ○ Static | public | indexable, title+desc | Create account form |
| `/signup/verify-email-sent` | Page | ○ Static | public | **noindex** | "Check your inbox" + resend |
| `/signup/verify-email` | **Route Handler** (`route.ts`) | ƒ Dynamic | public | none (redirects) | Consume verify token → redirect |
| `/login` | Page + Server Action | ○ Static | public | indexable, title+desc | Sign-in form |
| `/forgot-password` | Page + Server Action | ○ Static | public | **noindex** | Request reset (always-success) |
| `/reset-password/[token]` | Page + Server Action | ƒ Dynamic | public | **noindex** | Set new password / invalid page |
| `/account` | Page + Server Action | ƒ Dynamic | **protected** | **noindex** | Minimal signed-in view + sign-out |
| `/api/auth/[...nextauth]` | Route Handler | ƒ Dynamic | — | none | Auth.js handlers (GET/POST) |

Status expectations (gate): `/signup`,`/signup/verify-email-sent`,`/login`,`/forgot-password` → 200; `/reset-password/<valid>` → 200; `/reset-password/<invalid>` → 200 (renders invalid view, not 404); `/account` signed-out → 302 → `/login?callbackUrl=/account`; `/signup/verify-email?token=<bad>` → 302 → `/signup?error=…`.

---

## 2. Auth.js config contract (`apps/web/src/auth.ts`)

```text
NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable, accountsTable, sessionsTable, verificationTokensTable,   // password_reset_tokens is NOT an adapter table
  }),
  session: { strategy: "database", maxAge: 60*60*24*30 },                 // 30 days
  pages:   { signIn: "/login", verifyRequest: "/signup/verify-email-sent" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize(creds): Promise<User | null>                               // lookup by email → verifyPassword → user|null; does NOT enforce emailVerified
  })],
  callbacks: {
    session({ session, user }) { session.user.emailVerified = user.emailVerified; return session }  // expose verified ts; no non-null assertions
  },
}) → exports { handlers, signIn, signOut, auth }
```

- Cookies: Auth.js defaults (httpOnly, secure in production, sameSite=lax) — FR-012.
- `signOut({ redirectTo: "/" })` used by the sign-out action and nav.
- `authorize` returns `null` on any failure (no distinction) — feeds FR-010 generic error.
- **Email-verified gate is enforced in the login Server Action**, not `authorize`, so the action can return the `unverified` state with a resend link (decision 8 / C-c).

---

## 3. Server-Action state contracts

Shared base (extends slice-008 `ContactFormState`):

```text
type AuthActionState =
  | { status: "idle" }
  | { status: "validation-error"; fieldErrors: Record<field,string>; values: RawValues }   // passwords never echoed
  | { status: "transport-error"; values: RawValues }                                        // DB/email/argon2 failure
  | { status: "rate-limited"; retryAfter?: number }
  // login-only:
  | { status: "unverified" }                                                                // → render verify nudge + resend
```

Execution order in **every** action: **(1) rate-limit → (2) Zod parse → (3) transport**. Success advances via `redirect()` (except forgot-password).

| Action | File | Input | Success behavior | Notable errors |
|---|---|---|---|---|
| `createAccount` | `app/signup/actions.ts` | email, password, confirm, name? | issue verify token, send email, `redirect("/signup/verify-email-sent")` | duplicate email → generic `transport-error` (no enumeration, FR-008); rate-limit 3/h |
| (verify) | `app/signup/verify-email/route.ts` | `?token` | mark `emailVerified=now()`, delete token, send welcome email, `redirect("/login?verified=1")` | bad/expired/used → `redirect("/signup?error=verify")` |
| `signInWithCredentials` | `app/login/actions.ts` | email, password | `signIn("credentials")` → `redirect(callbackUrl ?? "/account")` | bad creds → generic `validation-error`; unverified → `unverified`; rate-limit 5/min |
| `requestPasswordReset` | `app/forgot-password/actions.ts` | email | **always** return `{status:"success"}` neutral view; if user exists, issue 1h token + send reset email | rate-limit 3/h; never reveals existence (FR-015) |
| `completePasswordReset` | `app/reset-password/[token]/actions.ts` | token, password, confirm | txn: re-check token → update hash → mark used → delete user sessions → `redirect("/login?reset=1")` | invalid/expired/used → invalid view (FR-017); TOCTOU re-check (SC-007) |
| `signOutAction` | `app/account/actions.ts` | — | `signOut({ redirectTo: "/" })` | — |

`RawValues` echoes non-password fields only (email, name) so the form repopulates (FR-023).

---

## 4. Zod schema contract (`components/auth/auth-schemas.ts`)

Runtime-imported by Server Actions only; client forms import `import type` to keep Zod out of the client bundle (slice-008 discipline). Voice-compliant messages (no `!`, no emoji).

```text
signupSchema:  { email: email(), password: min(12), confirm: string, name: max(100).optional() } + refine(password===confirm)
loginSchema:   { email: email(), password: min(1) }
forgotSchema:  { email: email() }
resetSchema:   { password: min(12), confirm: string } + refine(password===confirm)
```

---

## 5. Email contracts (`lib/email/*` + `lib/auth-emails.ts`)

Pure renderers return HTML strings; wrappers send via the slice-008 Resend client using `EMAIL_FROM`.

| Function | Subject | Body essentials | TTL note |
|---|---|---|---|
| `renderVerifyEmailHtml({verifyUrl,name?})` | `Verify your Bristle email` | brand header · greeting · verify link · "expires in 24 hours" · unsubscribe footer | 24h |
| `renderPasswordResetEmailHtml({resetUrl})` | `Reset your Bristle password` | brand header · reset link · "expires in 1 hour" · "if you didn't request this, ignore this email" · footer | 1h |
| `renderWelcomeEmailHtml({name?})` | `Welcome to Bristle` | brand header · brief welcome · "your account is verified — sign in at {SITE_URL}" · `hello@bristle.dev` · footer | — |

Shared in `lib/email/shared.ts`: `brandHeader()` ("Bristle" wordmark line), `unsubscribeFooter()` ("You're receiving this because you signed up at bristle.dev."), and a base HTML shell with inline styles only (no images, no external CSS). Voice: transactional only, no marketing, no `!`/emoji (§6). Welcome email sent **after** verify completes (in the verify Route Handler), not at signup.

---

## 6. Auth-aware top-nav contract (`components/landing/top-nav.tsx`)

```text
async function TopNav() {
  const session = await auth()
  // left wordmark + NAV_LINKS: UNCHANGED
  // right div:
  //   session?.user == null  → <Link href="/login">Sign in</Link> + <Link href="/signup">Start free →</Link>   // BYTE-IDENTICAL to pre-slice
  //   session?.user present  → <Link href="/account">{user.name ?? truncateEmail(user.email)}</Link>
  //                            + <form action={signOutAction}><button>Sign out</button></form>
}
```

- `truncateEmail`: ≤ 20 chars then `…` (C-e).
- Logged-out output **must match the current component byte-for-byte** — gate verifies via curl+grep across every slice-005…012 route (SC-010).
- No hamburger/mobile menu exists (nav is `flex-wrap`); only the right `<div>` branches.
- Sign-out is a form submit (no client JS) — C-b.

---

## 7. Rate-limit contract (`lib/rate-limit.ts`)

```text
check({ key, limit, windowMs }): { allowed: boolean; retryAfter?: number }
// module-scope Map<string,{count,resetAt}>; lazy prune; key = `${action}:${ip}`
// ip = first x-forwarded-for hop ?? x-real-ip ?? "unknown"
```
Limits: `signup` 3 / 3_600_000ms · `login` 5 / 60_000ms · `forgot` 3 / 3_600_000ms. Over limit → `{status:"rate-limited"}` generic message (FR-022). Per-instance only (documented; Redis follow-up).

---

## 8. Middleware contract (`middleware.ts`)

```text
export const config = { matcher: ["/account/:path*"] }
// default export: redirect to /login?callbackUrl=<pathname> when session cookie absent
// authoritative validation is /account's server-side auth() guard (R5 shape 2)
```

---

## 9. Environment variables

| Var | Scope | Purpose |
|---|---|---|
| `AUTH_SECRET` | preview + production + local | Auth.js session/cookie encryption (`openssl rand -base64 32`) |
| `EMAIL_FROM` | preview + production + local | From-address for the 3 auth emails (new; does not touch `CONTACT_FORM_FROM`) |
| `RESEND_API_KEY` | (existing, slice 008) | Reused for auth email send |
| `DATABASE_URL` / `DATABASE_URL_DIRECT` | (existing, slice 004) | Runtime pooled / migration direct |
| `NEXT_PUBLIC_SITE_URL` (or SITE_URL) | (existing) | Absolute URLs in verify/reset/welcome links |

Added to `.env.example` (T-A) and the Vercel project (preview + production) before preview parity (T021).
