# Feature Specification: Production Authentication

**Feature Branch**: `013-auth`

**Created**: 2026-05-29

**Status**: Draft

**Slice**: Tier 3.1 — Slice 3.1 (repo numbering 013) per `docs/Bristle-Build-Plan.pdf`

**Input**: User description: "Slice 013 (Tier 3.1) — Production authentication for Bristle. Sign-up + email verify + login + forgot-password + reset-password + session management + sign-out + auth-aware top nav + a minimal protected route (/account) to prove the loop end-to-end. CONSTITUTION EDIT: CLAUDE.md §3 swaps Supabase Auth for Auth.js v5 + @auth/drizzle-adapter + @node-rs/argon2 (Supabase Postgres + Drizzle + Resend all stay). 5 new Drizzle tables, 3 transactional emails, middleware-protected /account, auth-aware top nav, in-memory per-instance rate limiting, credentials-only."

---

## Overview

Bristle's marketing surface (slices 005–012) shipped with every `/signup` and `/login` call-to-action pointing at placeholder "coming soon" stubs. This slice makes authentication real: a skeptical technical builder can create an account, verify their email, sign in, recover a forgotten password, and reach a protected area — and every account CTA across the existing public pages flips from stub to live in a single merge. It is the first slice in Tier 3 (Auth & Onboarding) and the first since slice 005 to touch shared chrome.

This slice also carries a **constitution-tier change**: the locked authentication library in `CLAUDE.md` §3 changes from Supabase Auth to Auth.js v5. Supabase Postgres, Drizzle, and Resend are unchanged — only the auth layer swaps. The constitution edit is part of this slice's audit trail and lands as one of its first commits.

Scope is deliberately bounded to a credentials-only (email + password) flow that proves the end-to-end loop. OAuth providers, MFA, magic links, and account-management screens are explicitly deferred (see Out of Scope), though the data model is shaped to accept OAuth later without migration.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New user registers, verifies email, and signs in for the first time (Priority: P1)

A first-time visitor decides to try Bristle. They go to `/signup`, enter email + password (+ optional name), submit, and are told to check their inbox. They open the verification email, click the link, are told their email is verified, sign in at `/login`, and land on a minimal `/account` page that greets them by name and shows their email and verification date. This is the core end-to-end loop the whole slice exists to prove.

**Why this priority**: Without registration + verification + first sign-in, nothing else in the slice has value. This is the minimum viable authentication product.

**Independent Test**: Register a brand-new email, receive and click the verification link, sign in, and confirm `/account` renders the welcome state — all without touching any other flow.

**Acceptance Scenarios**:

1. **Given** an email not already registered, **When** the user submits a valid signup form (email + password ≥ 12 chars + matching confirm), **Then** an account is created with an unverified status, a verification email is sent, and the user is shown a "check your inbox" confirmation page.
2. **Given** a freshly created unverified account, **When** the user clicks the verification link before it expires, **Then** their email is marked verified, the link is consumed (single-use), and they are redirected to `/login` with an "email verified — please sign in" confirmation.
3. **Given** a verified account, **When** the user submits correct credentials at `/login`, **Then** a session is created and they are redirected to `/account`, which displays their name (or email), email address, and verification timestamp.
4. **Given** an unverified account, **When** the user attempts to sign in, **Then** authentication is refused with a "please verify your email" message and a way to resend the verification email.
5. **Given** a signup attempt with an email that already exists, **When** the form is submitted, **Then** a generic "could not create account" error is shown (the response does not confirm or deny that the email is registered).

---

### User Story 2 - Returning user signs in and signs out (Priority: P1)

A returning, verified user signs in at `/login`, uses the product, and later signs out. After signing out they land on the public landing page and the top navigation reverts to its logged-out state.

**Why this priority**: A login that cannot be reversed by a logout is not a usable session system. Sign-in/sign-out is the everyday loop and is required for any protected surface to be safe on shared machines.

**Independent Test**: With an existing verified account, sign in, confirm the session persists across navigation, click sign out, and confirm the session is destroyed and chrome reverts.

**Acceptance Scenarios**:

1. **Given** a verified user with correct credentials, **When** they sign in, **Then** a session cookie is set (httpOnly, secure in production, sameSite=lax) and they remain signed in across page navigations until expiry or sign-out.
2. **Given** a signed-in user, **When** they click "Sign out" (on `/account` or in the top nav), **Then** their session is destroyed and they are redirected to `/`.
3. **Given** a signed-in user, **When** any page renders the top navigation, **Then** the nav shows their account affordance and a sign-out option instead of "Sign in" / "Start free".
4. **Given** invalid credentials (wrong password or unknown email), **When** the user submits the login form, **Then** a single generic "invalid email or password" error is shown that does not distinguish which field was wrong.

---

### User Story 3 - User recovers a forgotten password (Priority: P2)

A user who forgot their password requests a reset from `/forgot-password`, receives a reset email, follows the link to set a new password, and signs in with it. All their other active sessions are invalidated by the reset.

**Why this priority**: Password recovery is essential for retention but not required to demonstrate the core loop; a user can still register and sign in without it. High value, slightly lower than the core loop.

**Independent Test**: For an existing verified account, request a reset, click the emailed link, set a new password, and sign in with the new password while confirming the old one no longer works.

**Acceptance Scenarios**:

1. **Given** any submitted email at `/forgot-password`, **When** the form is submitted, **Then** the user always sees the same "if an account exists, a reset link is on its way" message regardless of whether the email is registered (no enumeration).
2. **Given** a registered email, **When** a reset is requested, **Then** a single-use reset link with a 1-hour expiry is emailed.
3. **Given** a valid, unexpired, unused reset link, **When** the user submits a new valid password, **Then** their password is updated, the token is marked used, all their existing sessions are invalidated, and they are redirected to `/login` with a "password updated" confirmation.
4. **Given** a reset link that is expired, already used, or unknown, **When** the user opens it, **Then** an "this reset link is no longer valid" page is shown with a link to request a new one.
5. **Given** a reset link that was just successfully used, **When** the same link is submitted again, **Then** it is rejected as no longer valid (single-use enforced atomically with the password update).

---

### User Story 4 - Protected access and auth-aware navigation (Priority: P2)

An unauthenticated visitor who tries to reach a protected area is redirected to sign in and, after signing in, is returned to where they were headed. The top navigation reflects auth state everywhere it appears.

**Why this priority**: Establishes the protected-route pattern and the auth-aware chrome that every future authenticated slice depends on. Required to make `/account` meaningful and safe.

**Independent Test**: While signed out, visit `/account` directly and confirm redirect to `/login` with a return path; sign in and confirm landing back on `/account`. Inspect the top nav signed-out vs signed-in.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to a protected route (`/account`), **When** the route is requested, **Then** the user is redirected to `/login` with a return path so they come back after signing in.
2. **Given** a user who was redirected to login from a protected route, **When** they sign in successfully, **Then** they are returned to the originally requested route.
3. **Given** a signed-out visitor, **When** they view any page that includes the top navigation, **Then** the nav renders identically to the pre-slice chrome (no visual regression), with "Sign in" → `/login` and "Start free" → `/signup`.
4. **Given** a signed-in user, **When** they view the top navigation, **Then** the account affordance and sign-out replace the signed-out CTAs while the rest of the nav (Pricing, Blog, Changelog, About) is unchanged.

---

### User Story 5 - Every public account CTA becomes functional (Priority: P2)

A visitor anywhere on the public site who clicks a "Start free", "Create free account", or "Sign in" call-to-action arrives at a working signup or login page rather than a placeholder stub.

**Why this priority**: This is the slice's biggest user-visible payoff and the reason it was sequenced ahead of remaining marketing polish. It is a regression surface spanning slices 005–012.

**Independent Test**: From the landing page, pricing page, and a sample problem page, click each account CTA and confirm it lands on the live `/signup` or `/login` rather than a stub.

**Acceptance Scenarios**:

1. **Given** the landing page, **When** the user clicks "Sign in" or "Start free" in the top nav, **Then** they reach the live `/login` or `/signup`.
2. **Given** a sample problem page, **When** the user clicks the sample-banner CTA or the evidence-list "Create free account" CTA, **Then** they reach the live `/signup`.
3. **Given** the pricing page, **When** the user clicks a tier CTA, **Then** they reach the live `/signup`.
4. **Given** the site footer, **When** account-related links are rendered, **Then** they resolve to live destinations with zero edits to the footer component (link-flip only).

---

### Edge Cases

- **Expired verification link**: opening a verification link after its 24-hour TTL shows an error and routes the user back to signup with the option to resend.
- **Resend abuse**: repeated "resend verification" or "forgot password" requests are rate-limited and return a generic "too many requests" message.
- **Duplicate signup race**: two near-simultaneous signups with the same email — the database unique constraint on email is the authority; the second returns the generic create-account error.
- **Password reset while logged in elsewhere**: completing a reset invalidates sessions on all devices; other devices are signed out on their next request.
- **TOCTOU on reset token**: a reset token validated when the page loads is re-validated at submit; a token consumed in the interim is rejected.
- **JavaScript disabled**: all four forms (signup, login, forgot, reset) submit via standard form POST and render server-rendered error/success states without client JS.
- **Unverified user requests password reset**: handled the same as any account (reset is independent of verification state); after reset they still cannot sign in until verified.
- **Rate-limit counter across instances**: the in-memory limiter is per server instance; a determined attacker hitting multiple instances gets a higher effective limit (documented limitation; tracked follow-up for distributed limiting).
- **Verification/reset email never arrives**: user can re-request from the confirmation page (rate-limited); no account state is corrupted by repeated requests.

---

## Requirements *(mandatory)*

### Functional Requirements

**Constitution & foundation**

- **FR-001**: The project constitution (`CLAUDE.md` §3) MUST be updated so the locked authentication stack is Auth.js v5 + the Drizzle adapter + an Argon2 password hasher, and Supabase Auth MUST be removed from the locked stack. Supabase Postgres, Drizzle, and Resend remain unchanged. This edit MUST land as one of the slice's first commits.
- **FR-002**: The data model MUST gain five persisted entities (see Key Entities): user accounts, linked external accounts (future OAuth), sessions, email-verification tokens, and password-reset tokens. A migration MUST be generated, committed, and applied to the development database; the development database schema MUST match the committed migration.
- **FR-003**: Exactly three new top-level runtime dependencies MUST be added (an Auth.js v5 package, its Drizzle adapter, and an Argon2 hasher) with pinned versions; the lockfile change MUST be limited to those additions and their transitive dependencies.
- **FR-004**: A new required secret for session encryption MUST be documented in the example environment file and configured in the hosting project at both preview and production scopes. Existing email-sending configuration from slice 008 MUST be reused for transactional auth emails (consolidated to a single shared "from" address if not already generic).

**Registration & verification**

- **FR-005**: Users MUST be able to create an account with email + password, with an optional display name. Password MUST be at least 12 characters; the confirm field MUST match. No additional complexity rules apply.
- **FR-006**: On successful signup the account MUST be created in an unverified state, a single-use verification token with a 24-hour expiry MUST be issued, and a verification email MUST be sent. The user MUST NOT be auto-signed-in; they MUST be shown a confirmation page.
- **FR-007**: Following a valid verification link MUST mark the account verified, consume the token (single-use), and route the user to sign in with a success confirmation. An invalid/expired/consumed link MUST route back to signup with an error.
- **FR-008**: A signup attempt with an already-registered email MUST return a generic failure that does not reveal whether the email exists (no account enumeration on signup).
- **FR-009**: The confirmation page MUST offer a rate-limited way to resend the verification email.

**Authentication & session**

- **FR-010**: Users MUST be able to sign in with email + password. Incorrect email or password MUST produce a single generic error that does not distinguish which was wrong.
- **FR-011**: Sign-in MUST be refused for accounts whose email is not yet verified, with a message instructing the user to verify and a way to resend verification.
- **FR-012**: Successful sign-in MUST establish a server-validated session using a database-backed session strategy with a 30-day expiry. Session cookies MUST be httpOnly, secure in production, and sameSite=lax.
- **FR-013**: Users MUST be able to sign out from both `/account` and the top navigation; signing out MUST destroy the session and return the user to the public landing page.
- **FR-014**: Cross-site request forgery protection on all state-changing submissions MUST rely on the framework's built-in Server Action protection; no page may submit auth state changes via an unprotected channel.

**Password recovery**

- **FR-015**: Users MUST be able to request a password reset by email. The response MUST be identical whether or not the email is registered (no enumeration). A registered email MUST receive a single-use reset link with a 1-hour expiry.
- **FR-016**: A valid reset link MUST allow setting a new password (subject to the same ≥12-char + confirm rules). Completing the reset MUST update the password, mark the token used atomically with the update (TOCTOU-safe), and invalidate all of that user's existing sessions.
- **FR-017**: An invalid, expired, or already-used reset link MUST show a clear "no longer valid" page with a path to request a new one.

**Protected access & navigation**

- **FR-018**: The system MUST provide at least one protected route (`/account`) that is inaccessible to unauthenticated users. Unauthenticated requests MUST redirect to `/login` with a return path, and successful sign-in MUST honor that return path.
- **FR-019**: `/account` MUST render the signed-in user's display name (or email if unset), email address, verification timestamp, account creation date, and a sign-out control. It is intentionally minimal and proves the loop; it is not the dashboard.
- **FR-020**: The top navigation MUST be auth-aware. Signed-out, it MUST render identically to the existing chrome (no visual regression on slices 005–012). Signed-in, it MUST show an account affordance and sign-out while leaving Pricing/Blog/Changelog/About unchanged. This is a disciplined, flagged exception to the no-chrome-edits rule held since slice 005.

**Transactional email**

- **FR-021**: The system MUST send three transactional emails via the existing email provider: an email-verification message (24h link), a password-reset message (1h link, with an "ignore if you didn't request this" note), and a welcome message sent only after verification completes. Each MUST carry a Bristle header line and a plain "you're receiving this because you signed up" footer, with no marketing copy.

**Abuse prevention**

- **FR-022**: The system MUST rate-limit per client: account creation (3/hour), sign-in attempts (5/minute), and password-reset requests (3/hour). Exceeding a limit MUST return a generic "too many requests" message that does not reveal limit internals. The limiter is per server instance for this slice (documented limitation).

**Quality floors (per `CLAUDE.md` §5/§6)**

- **FR-023**: All four forms MUST function without client JavaScript (server-rendered submit and error/success states). On error, previously entered values (except passwords) MUST be preserved, following the slice-008 form pattern.
- **FR-024**: All forms MUST meet WCAG 2.2 AA: labels associated to inputs (placeholders never replace labels), errors programmatically associated and announced, password inputs masked (optional show/hide toggle), and visible focus on the first errored field.
- **FR-025**: All new microcopy MUST follow the Bristle voice (§6): plain, no exclamation points, no "amazing"/"awesome", no emoji. Use the design tokens and type scale from §4. New interactive client surface MUST be kept to at most ~5 client component files.
- **FR-026**: All new auth routes MUST stay within the performance budget: First Load JS < 180 KB gzipped per route (expected ~110–120 KB).

**Slice integrity**

- **FR-027**: The slice MUST NOT modify component files or routes from slices 006/008/009/010/011/012, with these flagged exceptions only: (a) the `CLAUDE.md` §3 constitution edit; (b) the database package schema additions; (c) the auth-aware edit to the top-nav component; (d) wholesale rewrites of the existing `/signup` and `/login` stub pages (replacing slice-005 placeholders). Every other `/signup` and `/login` CTA across the site MUST become functional by route availability alone (link-flip), with zero edits to those pages or the footer.

### Key Entities *(include if feature involves data)*

- **User account**: A person's Bristle identity. Attributes: unique email, optional display name, optional avatar reference (future), email-verified timestamp (null until verified), password hash, created/updated timestamps. Central entity referenced by sessions, external accounts, and reset tokens.
- **Linked external account**: Standard shape for an external identity provider linked to a user (provider, provider account id, token fields). Defined now to future-proof OAuth; unused by the credentials-only flows this slice ships.
- **Session**: A server-validated login session for a user, with a unique session token and an expiry. Backs the database session strategy; destroyed on sign-out and bulk-invalidated on password reset.
- **Email-verification token**: A single-use token tied to an email identifier with a 24-hour expiry, consumed when the user verifies.
- **Password-reset token**: A single-use token tied to a user with a 1-hour expiry and a "used" flag, consumed atomically when a reset completes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from the landing page to a signed-in `/account` view — signup, email verification via the emailed link, and first sign-in — with no manual/database intervention.
- **SC-002**: A user who forgot their password can regain access end-to-end: request reset, follow the emailed link, set a new password, and sign in with it, while the old password no longer works.
- **SC-003**: Sign-out from either entry point ends the session, and a subsequent attempt to view the protected area redirects to sign-in.
- **SC-004**: Account enumeration is not possible through signup (duplicate email → generic error), forgot-password (always-success response), or login (single generic credential error).
- **SC-005**: Sign-in is blocked for unverified accounts and clearly tells the user to verify, with a working resend path.
- **SC-006**: A completed password reset signs the user out everywhere; previously active sessions can no longer access the protected area.
- **SC-007**: A reset link works exactly once; reuse after success is rejected.
- **SC-008**: Rate limits hold: the 4th signup or 4th reset request from one client within an hour, and the 6th sign-in within a minute, are rejected with a generic message.
- **SC-009**: An unauthenticated request to the protected area redirects to sign-in and returns the user to the originally requested location after they authenticate.
- **SC-010**: The signed-out top navigation is visually unchanged from the pre-slice chrome across every page that renders it (slices 005–012); the signed-in navigation adds the account/sign-out affordance without breaking layout.
- **SC-011**: Every account CTA across the public site (top-nav "Sign in"/"Start free", landing CTAs, pricing tier CTAs, sample-banner and evidence CTAs, about/contact CTAs) lands on a live signup or login page; the count of flipped CTAs is confirmed by audit at the gate (expected ~10–15 links).
- **SC-012**: All four auth forms complete successfully with JavaScript disabled.
- **SC-013**: All three transactional emails are received during the registration, reset, and verification walks.
- **SC-014**: Auth forms meet WCAG 2.2 AA (labeled fields, associated/announced errors, masked password inputs, focus management).
- **SC-015**: `typecheck`, `lint`, and the production build all pass; every auth route's First Load JS is under the 180 KB budget.
- **SC-016**: Lighthouse Performance, Accessibility, and Best Practices each score ≥ 90 on `/login`, `/signup`, and `/account`.
- **SC-017**: The constitution reflects the new auth stack; the database has the five new entities with a committed, applied migration; exactly three new runtime dependencies are present in the lockfile.

---

## Clarifications

The following decisions were specified with a recommended default. They are recorded here as resolved-with-default and can be revisited in `/speckit.clarify`. Each is reflected in the requirements above.

- **C-a — Logged-in account affordance**: Direct link to `/account` (not a dropdown) this slice. Rationale: only one account route exists; a dropdown is a future micro-slice once settings/billing routes arrive. *(Default applied.)*
- **C-b — Sign-out control shape**: A form submit button driving a Server Action (works without JS), not a client onClick handler. Matches the no-JS and Server-Action discipline. *(Default applied.)*
- **C-c — Email-verification gate**: `/login` refuses authentication when the email is unverified and routes the user to a verify/resend affordance, rather than allowing sign-in with a nag. *(Default applied.)*
- **C-d — Session invalidation on reset**: Completing a password reset invalidates all existing sessions (log out everywhere). *(Default applied.)*
- **C-e — Top-nav user display**: Show display name if set, otherwise the email (truncated). *(Default applied.)*
- **C-f — Resend verification**: Ship a rate-limited "resend verification email" affordance on the confirmation page. *(Default applied.)*
- **C-g — Account creation date on `/account`**: Display the account creation date alongside email and verification timestamp. *(Default applied.)*

---

## Assumptions

- **Stack swap is in-scope and authorized**: Auth.js v5 + Drizzle adapter + Argon2 hasher replace Supabase Auth in the locked stack; this is a deliberate, recorded reversal of `CLAUDE.md` §3 and is committed as part of this slice. Supabase Postgres, Drizzle, and Resend are retained.
- **Auth.js v5 is pinned at `5.0.0-beta.31` by deliberate choice**: the `beta` tag is the de-facto production line for Auth.js (npm `latest` is the legacy v4 line), and the v5 API has been stable through ~4 years of beta. This is a documented stack decision, not an open risk. Tracked follow-up: bump to `5.0.0` GA when it lands — a version bump, not an architecture revisit.
- **Credentials-only for v1**: Email + password is the only sign-in method this slice. The external-account entity exists solely to make a later OAuth addition non-breaking.
- **Email deliverability is available**: The existing transactional email provider (slice 008) is configured and able to deliver verification/reset/welcome emails to test inboxes.
- **Development database is reachable**: The managed Postgres development database can receive the new migration during the slice.
- **Rate limiting is per-instance**: Acceptable for an indie-product launch; distributed limiting is a tracked follow-up, not a v1 requirement.
- **`/account` is a placeholder protected route**: It proves the loop and establishes the protected-route pattern; a Tier 4+ slice replaces it with the real dashboard.
- **Password policy is NIST-style**: Minimum 12 characters, no composition rules and no breached-password check this slice (HIBP is a tracked follow-up).
- **Hand-rolled email HTML**: Transactional emails are plain hand-authored HTML strings reusing the slice-008 sender, not a component email library.
- **Footer is link-flip only**: The site footer is not edited; its account links become functional by route availability.

---

## Dependencies

- **Existing**: Supabase Postgres (development + production), Drizzle ORM and the database package, the Resend transactional-email wiring from slice 008, the slice-005 top-nav and footer chrome, and the slice-005 `/signup` and `/login` stub routes (to be replaced).
- **New (this slice)**: An Auth.js v5 package, its Drizzle adapter, and an Argon2 password hasher (three pinned runtime dependencies); a session-encryption secret in the environment; five new database entities and their migration.

---

## Out of Scope

OAuth providers (Google/GitHub/Apple — data model is future-proofed); MFA/2FA; magic-link/passwordless login; account deletion and GDPR erasure (Tier 5+); a separate username distinct from email; avatar upload; password change while signed in; email change while signed in; social profile linking; role-based access control / admin roles; email allowlist/waitlist; breached-password (HIBP) checks; distributed (Redis) rate limiting; a component email library; screenshot-diffing infrastructure for the auth-aware nav (verified via SSR markers + responsive sweep at the gate instead); a `/signup`/`/login` visual redesign beyond what the design PDFs specify.
