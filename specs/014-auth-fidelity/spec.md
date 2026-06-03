# Feature Specification: Auth Visual + Functional Fidelity (OAuth + Code Verify + Design Refinement)

**Feature Branch**: `014-auth-fidelity`

**Created**: 2026-06-02

**Status**: Draft

**Slice**: Tier 3.1 — Slice 3.1 part 2 (repo numbering 014) per `docs/Bristle-Build-Plan.pdf`. Builds directly on slice 013 (Production Authentication).

**Base commit**: `52dd247` (merged slice-013 head, PR #12).

**Input**: User description: "Slice 014 (Tier 3.1 part 2) — Auth visual + functional fidelity: OAuth (Google + GitHub) + code-based email verification + design refinement of the slice-013 auth pages. Builds on slice 013's auth foundation WITHOUT replacing it."

---

## Overview

Slice 013 made authentication *real* but *plain*: credentials-only, link-based email verification, and stub-level page layouts that proved the loop without matching the visual contract. This slice raises the auth surface to **visual and functional fidelity** against the six high-fidelity design references in `design/auth-pages/`, and adds the two capabilities a skeptical technical builder expects on day one: **social sign-in (Google + GitHub)** and a **6-digit code email verification** flow that reads like a modern product rather than a "click this link" relay.

The defining constraint of this slice is **non-destructive extension**. Slice 013's foundation — database schema, the Auth.js v5 core configuration, password hashing, session management, rate limiting, middleware, the protected `/account` route, and the auth-aware top-nav edit — all carry forward. Some pieces get *extended* (the providers array gains Google + GitHub; the `users` table gains five columns; the rate limiter gains new keys). What gets *replaced wholesale* is the presentation-and-flow layer: the five auth pages are rebuilt against the design, link-based verification is retired in favor of code-based verification, and one new surface — the OAuth callback progress page — is added.

This slice also carries a small **constitution edit**: `CLAUDE.md` §3 currently records OAuth providers as deferred (`accounts` table provisioned, providers array empty). This slice flips that note to reflect Google + GitHub shipping now, while SSO/SAML remains explicitly deferred.

Scope is six batches (~30–40 tasks): (A) shared layout primitives, (B) OAuth providers, (C) code-based verification, (D) page rebuilds, (E) edge cases + polish, (F) gates. The end state is auth pages that match the design within 4px at 1280px, behave correctly down to 375px, and pass the same security, accessibility, and voice floors held since slice 013 — with no regression to any preserved foundation piece or to any untouched public route (slices 005–012).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New user signs up and verifies with a 6-digit code (Priority: P1)

A first-time visitor lands on the redesigned `/signup` split-screen page, enters their name, email, and a password (watching a live strength meter and accepting the Terms), and submits. They are taken to a "verify your email" page where they enter the 6-digit code sent to their inbox. On the correct code their email is marked verified and they are routed to `/login` with a success confirmation, ready to sign in. This replaces slice 013's link-click verification and its separate "check your inbox" page.

**Why this priority**: Code-based verification is the headline functional change to the credentials path and the new core of the registration loop. Without it, the rebuilt signup page has no working destination. It must work end-to-end before anything else in the slice has value.

**Independent Test**: Register a brand-new email on the rebuilt `/signup`, receive the code email, enter the correct 6 digits on `/signup/verify-email`, and confirm redirect to `/login?verified=true` with the account marked verified — without touching OAuth or password recovery.

**Acceptance Scenarios**:

1. **Given** an email not already registered, **When** the user submits a valid signup form (name + email + password ≥ 12 chars + Terms accepted), **Then** an unverified account is created with `terms_accepted_at`/`terms_version` recorded, a hashed 6-digit code (10-minute expiry, attempt counter zeroed) is stored, a code email is sent, and the user is routed to `/signup/verify-email?email=…` (the code-entry page — there is no separate "check your inbox" page).
2. **Given** an account awaiting verification, **When** the user enters the correct 6 digits before expiry, **Then** the email is marked verified, the stored code is cleared, a welcome email is sent, and the user is redirected to `/login?verified=true`.
3. **Given** the verify page, **When** the user enters an incorrect code, **Then** the attempt counter increments and a "Incorrect code. Try again." message is shown; after 5 wrong attempts the user is told to request a new code.
4. **Given** a code older than its 10-minute expiry, **When** the user submits it, **Then** a "Code expired. Request a new code." message is shown and verification is refused.
5. **Given** the verify page, **When** the user requests a resend, **Then** a new code replaces the old one and the resend control enters a 24-second server-enforced cooldown (counting down 24…0) before it can be used again.
6. **Given** the verify page for an unverified account, **When** the user chooses "Use a different email", **Then** the unverified account record is deleted and the user is returned to `/signup` with the email field pre-populated.
7. **Given** the Terms checkbox is unchecked, **When** the user attempts to submit signup, **Then** submission is blocked and the checkbox shows an invalid state.

---

### User Story 2 - User signs in or registers with Google or GitHub (Priority: P1)

A visitor clicks "Google" or "GitHub" on the signup or login page, completes the provider's consent screen, and is returned to Bristle. While the session is being established they see the OAuth callback progress page (Bristle+provider logo, a four-step status checklist), then land on `/account` signed in. If the session is slow to land, the page keeps them informed; if it never lands, they are offered a fall-back to email sign-in.

**Why this priority**: Social sign-in is the second headline capability of the slice and the primary reason a skeptical builder will or won't bother completing signup. It exercises a new provider configuration, a new public surface (the callback page), and the previously-dormant `accounts` table.

**Independent Test**: From `/signup` or `/login`, click Google (then, separately, GitHub), complete consent on a test provider account, observe the `/auth/callback/[provider]` progress UI, and confirm arrival on `/account` with a valid session and an `accounts` row linked to the user.

**Acceptance Scenarios**:

1. **Given** the signup or login page, **When** the user clicks the Google or GitHub button, **Then** they are taken to that provider's consent screen requesting only profile + email scope.
2. **Given** a completed provider consent, **When** the provider redirects back, **Then** a Bristle session and cookie are created, an `accounts` row is linked to the user, and the user reaches `/account` (or the original `callbackUrl`).
3. **Given** the redirect cycle is still completing, **When** the callback page renders, **Then** it shows the four-step progress checklist (Authenticated → Verifying ID token → Creating Bristle session → Loading workspace) and polls for session readiness, redirecting to `/account` as soon as the session lands.
4. **Given** the session has not landed within the timeout, **When** the poll window elapses (10 seconds), **Then** the page falls back to `/login` and offers a "Sign in with email" path.
5. **Given** a user whose email already exists from a prior credentials signup, **When** they sign in with an OAuth provider using that same email, **Then** the provider account is auto-linked to the existing user (Auth.js default behavior; stricter takeover defense is a tracked follow-up).
6. **Given** the SSO button, **When** the user views or clicks it, **Then** it is visibly disabled with a "Coming soon — SSO available on Enterprise" tooltip and does not navigate.

---

### User Story 3 - Auth pages match the high-fidelity split-screen design (Priority: P2)

A visitor on any of the six auth surfaces sees the editorial split-screen layout from the design references: a dark editorial panel (Bristle logo, "TODAY ON BRISTLE" overline, the evidence-not-vibes headline, subhead, the Jules Marin testimonial, and the mono stats ticker) beside a clean form panel, with live password strength feedback, requirement pills, and a six-box code input where applicable. The layout mirrors per page (editorial left on signup/verify/forgot; editorial right on login/reset) and collapses to a form-only single column on mobile.

**Why this priority**: Visual fidelity is the slice's stated purpose and the most user-visible payoff, but it depends on the functional flows (US1, US2) having working destinations. High value, sequenced after the core loops.

**Independent Test**: Render each of the six routes at 1280px and confirm structure matches its design reference within a 4px tolerance; resize to 768px and 375px and confirm the editorial panel collapses while the form remains usable full-width.

**Acceptance Scenarios**:

1. **Given** any of `/signup`, `/login`, `/forgot-password`, `/reset-password/[token]`, `/signup/verify-email` at 1280px, **When** the page renders, **Then** it presents the split-screen layout with the editorial panel on the side specified by its design (left for signup/verify/forgot; right for login/reset) and the form on the other.
2. **Given** the editorial panel, **When** it renders, **Then** it shows the Bristle logo, the "TODAY ON BRISTLE" overline, the headline "Real problems, ranked by evidence — not vibes.", the standard subhead, the Jules Marin testimonial + attribution, and the "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" mono stats footer.
3. **Given** the signup or reset password field, **When** the user types, **Then** the four-segment strength meter updates live with the correct color and qualitative label per score (weak / fair / strong / excellent).
4. **Given** the reset-password page, **When** it renders, **Then** the live requirement pills show "At least 12 characters", "Contains a number", "Contains uppercase", and an always-inactive "Not used elsewhere — we can't check this", each toggling its check state as the user types.
5. **Given** the verify-email page, **When** the user interacts with the six-box code input, **Then** typing a digit auto-advances focus, Backspace clears and moves back, arrow keys navigate, and pasting six digits on the first box spreads across all boxes.
6. **Given** any viewport from 1280px down to 375px, **When** the page is resized, **Then** the form panel remains fully usable and the editorial panel collapses (hidden or reduced to a brand strip) at <768px without layout breakage.

---

### User Story 4 - User recovers a forgotten password on the redesigned flow (Priority: P2)

A user who forgot their password requests a reset on the rebuilt `/forgot-password` page (editorial-left split screen, always-success confirmation pill), follows the emailed link to the rebuilt `/reset-password/[token]` page (editorial-right, email context pill, strength meter, requirement pills), sets a new password, and is signed in. All slice-013 recovery semantics are preserved; only the presentation changes.

**Why this priority**: Recovery is essential for retention and is a direct beneficiary of the new primitives (strength meter, requirement pills), but its underlying logic is carried forward unchanged from slice 013, so the risk is presentational.

**Independent Test**: For an existing verified account, request a reset on the redesigned page, confirm the green success pill, follow the emailed link, set a new password using the strength-meter-equipped form, and sign in with it — confirming the slice-013 single-use/expiry/session-invalidation semantics still hold.

**Acceptance Scenarios**:

1. **Given** the redesigned `/forgot-password`, **When** any email is submitted, **Then** the same "If an account exists for that address, a reset link is on its way…" green confirmation pill is shown regardless of whether the email is registered (no enumeration — unchanged from 013).
2. **Given** a valid reset link, **When** the `/reset-password/[token]` page loads, **Then** it shows the "Resetting password for [email]" context pill (email derived from the token's user via the read-only validity helper), the strength meter, and the requirement pills.
3. **Given** a valid reset token and a new password meeting the rules, **When** the user submits, **Then** the password is updated, the token is consumed atomically, all existing sessions are invalidated, and the user proceeds to sign in (slice-013 semantics preserved).
4. **Given** the confirm-password field, **When** it matches the new password, **Then** a green check affordance appears.

---

### User Story 5 - Foundation and untouched routes are preserved (Priority: P2)

The slice extends auth without disturbing what slice 013 established or what slices 005–012 shipped. The database keeps all five tables (gaining only additive columns), the Auth.js core config keeps everything except the expanded providers array, session/cookie/password/rate-limit/middleware behavior is unchanged, `/account` stays protected, the auth-aware top nav keeps its slice-013 behavior, and every other public route renders exactly as before.

**Why this priority**: Slice integrity is an explicit gate. A fidelity slice that silently regresses session handling, the protected route, or the public chrome would fail even if every page looked perfect.

**Independent Test**: Diff the working tree against `52dd247` and confirm the only non-additive changes are the five rewritten auth pages, the retired link-based verify route, and the removed verify-email-sent page; curl `/`, `/pricing`, `/faq` and confirm unchanged; sign in and confirm `/account` and the auth-aware nav behave as in slice 013.

**Acceptance Scenarios**:

1. **Given** a signed-out request to `/account`, **When** the route is requested, **Then** the user is redirected to `/login?callbackUrl=/account` and returned after sign-in (middleware unchanged).
2. **Given** a signed-in user, **When** `/account` and the top nav render, **Then** they show the slice-013 auth-aware affordances unchanged.
3. **Given** the "Keep me signed in" toggle on login, **When** it is checked, **Then** the session persists ~30 days; when unchecked, the session cookie is session-only (expires at browser close).
4. **Given** the public routes `/`, `/pricing`, `/faq` and other slices 005–012 surfaces, **When** they render signed-out, **Then** they are visually unchanged from before this slice (the auth pages do not share the TopNav/SiteFooter chrome; the rest of the site does).
5. **Given** the database, **When** the migration is applied, **Then** all five slice-013 tables remain and `users` has gained exactly the five new columns, with no destructive change beyond emptying the retained-but-unused `verificationTokens` table.

---

### Edge Cases

- **Expired code**: a code submitted after its 10-minute TTL is refused with "Code expired. Request a new code."; no verification occurs.
- **Code brute force**: after 5 incorrect attempts the account's code is locked to further attempts and the user must request a fresh code; resend is itself rate-limited (24s), so repeated resend+guess cycles are naturally throttled (no separate hard lockout window).
- **Resend abuse**: requesting a new code before the 24-second cooldown elapses is refused with the remaining countdown; per-IP rate limiting also applies.
- **"Use a different email" on an already-verified account**: only unverified accounts are deletable via this affordance; a verified account is never deleted by it.
- **OAuth callback never completes**: if the session does not land within 10 seconds, the callback page redirects to `/login` with an email fall-back rather than spinning indefinitely.
- **OAuth email collides with an existing credentials account**: the provider account auto-links to the existing user (documented v1 behavior; stricter verify-before-link is a tracked follow-up).
- **OAuth provider misconfiguration**: if any required OAuth client id/secret is missing at startup, the application fails fast at module load rather than presenting a broken button.
- **JavaScript disabled**: the credentials forms (signup, login, forgot, reset) still submit via standard POST and render server-side error/success states; the code input, strength meter, and requirement pills are progressive enhancements and the verify form still accepts a typed code without them.
- **Mobile editorial panel**: at <768px the editorial panel is hidden or reduced to a brand strip; no auth flow depends on content that only appears in the editorial panel.
- **Direct visit to `/signup/verify-email` without an email param**: the page handles a missing/garbage `email` query param gracefully (prompts the user back to signup rather than erroring).
- **Stale OAuth `callbackUrl`**: a `callbackUrl` pointing at a non-existent or unauthorized route resolves to the `/account` default.

---

## Requirements *(mandatory)*

### Functional Requirements

**Constitution, foundation, and slice integrity**

- **FR-001**: `CLAUDE.md` §3 MUST be updated so the locked auth stack records Google + GitHub OAuth as shipping in this slice (providers array expands from empty to `[Google, GitHub]`), while SSO/SAML remains explicitly deferred. This is a minor edit layered on slice 013's lock and MUST land as one of the slice's first commits.
- **FR-002**: The following slice-013 foundation pieces MUST be preserved and MUST NOT be rebuilt — only extended where noted: the database package schema (all five tables); the Auth.js v5 core configuration (everything except the providers array); the session-creation and sign-out logic; the Argon2 password wrapper; the session-cookie name/shape; the in-memory rate limiter (extended with new keys, same shape); the shared transactional-email helpers (extended if needed, same shell pattern); the middleware (unchanged matcher; protected paths remain `/account/:path*`); the `/account` page; and the auth-aware top-nav behavior.
- **FR-003**: The slice MUST NOT modify component files or routes from slices 005–012, with these flagged exceptions only: the `CLAUDE.md` §3 edit; the database schema column additions; the wholesale rewrites of the five existing auth pages; the retirement of the link-based verification route and the verify-email-sent page; and the addition of new auth components, the OAuth callback page, the code-verification logic, the new code email template, and the new OAuth environment variables. A clear diff against `52dd247` MUST show every other change is additive.

**Data model additions**

- **FR-004**: The `users` entity MUST gain five additive fields: a hashed email-verification code (nullable), a code-expiry timestamp (nullable), an integer verification-attempt counter (default 0), a Terms-accepted timestamp (nullable), and a Terms-version string (nullable). A migration MUST be generated, committed, and applied to the database; the schema MUST match the committed migration.
- **FR-005**: The `verificationTokens` table MUST be retained (for future Auth.js Email-provider compatibility) but its existing contents MAY be dropped, as no production users depend on it. The `accounts` table MUST become actively used by the OAuth providers (no shape change required from slice 013's provisioning).

**Shared layout primitives (design fidelity foundation)**

- **FR-006**: The slice MUST provide a reusable split-screen auth layout that places the editorial panel on a configurable side (left or right) and the form panel on the other, and collapses to a form-only single column with the editorial panel hidden or reduced to a brand strip below 768px.
- **FR-007**: The slice MUST provide an editorial panel that renders, with sensible zero-prop defaults, the Bristle logo, an overline ("TODAY ON BRISTLE"), the standard headline and subhead, the Jules Marin testimonial with attribution, and a stats footer.
- **FR-008**: The slice MUST provide a mono stats ticker rendering "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" (static for v1; computing these from live data is a tracked follow-up).
- **FR-009**: The slice MUST provide a live password-strength meter (four segments) that scores a password 0–4 using custom logic (length + character classes + repeat detection, no heavy third-party password library) and renders a color and qualitative label per score.
- **FR-010**: The slice MUST provide a live password-requirements list with four rows — at least 12 characters, contains a number, contains uppercase, and an always-inactive "Not used elsewhere — we can't check this" — each toggling a met/unmet indicator as the user types.
- **FR-011**: The slice MUST provide a six-box code input with: auto-advance on digit entry, Backspace clear-and-retreat, arrow-key navigation, paste-spread of six digits from the first box, an accessible per-box label ("Digit N of 6"), and an `aria-live` announcement when all six digits are entered (it MUST NOT auto-submit the form).
- **FR-012**: The slice MUST provide the supporting primitives the designs require: an orange overline component with simple / with-counter / multi-step variants; an "OR EMAIL" divider; a password field with a show/hide toggle and an optional right-aligned label link (for "Forgot?"); and an OAuth button row containing Google, GitHub, and a disabled SSO button.
- **FR-013**: Components MUST be server-rendered wherever possible; only the genuinely state-driven surfaces (code input, strength meter, requirements list, and the six form/poller islands) may be client components. Total client islands across auth routes MUST be at most six.

**OAuth providers**

- **FR-014**: The Auth.js providers array MUST expand to Google + GitHub, each reading its client id/secret from the environment. The application MUST fail fast at startup if any required OAuth client id/secret is missing.
- **FR-015**: Four new environment variables (Google + GitHub client id/secret) MUST be documented in the example environment file with comments, and the founder-side provider setup (authorized redirect URIs for `…/api/auth/callback/google` and `…/api/auth/callback/github`) MUST be documented as a pre-implementation prerequisite.
- **FR-016**: OAuth MUST request only profile + email scope (the minimum for user identification).
- **FR-017**: The provider callback MUST establish a Bristle session and cookie and link an `accounts` row to the user, reusing the existing Auth.js handler. For an OAuth email matching an existing account, the default behavior is auto-link (accepted v1 trade-off; verify-before-link is a tracked follow-up).
- **FR-018**: A new `/auth/callback/[provider]` page MUST exist. It MUST check for an established session on render and redirect to `/account` (or the original `callbackUrl`) if present; otherwise it MUST render a centered single-panel progress UI (Bristle+provider logo composite and a four-step checklist: Authenticated → Verifying ID token → Creating Bristle session → Loading workspace) and poll for session readiness, redirecting on success or, after a 10-second timeout, falling back to `/login`. This page MUST NOT use the split-screen chrome.
- **FR-019**: The SSO button MUST be visibly disabled with an accessible disabled state and a "Coming soon — SSO available on Enterprise" tooltip, and MUST NOT navigate.

**Code-based email verification**

- **FR-020**: The system MUST generate a 6-digit numeric verification code, store only a hash of it on the user, and verify a submitted code against that hash. Constants MUST be: 10-minute code TTL, 5 maximum attempts per code, 24-second resend cooldown.
- **FR-021**: The signup action MUST, on successful account creation, store the hashed code + expiry + zeroed attempt counter, record Terms acceptance, send the code email, and route the user to the code-entry verify page (not a separate "check your inbox" page).
- **FR-022**: A verify action MUST read the code + email, enforce attempt and per-IP rate limits, reject when attempts are exhausted or the code is expired, verify the hash, and on success mark the email verified atomically (clearing the code/expiry/attempts), send the welcome email, and route to `/login?verified=true`; on failure it MUST increment the attempt counter and return a try-again message. The success path MUST be a single atomic check-and-update.
- **FR-023**: A resend action MUST be rate-limited to the 24-second cooldown (per email + IP), generate and store a fresh code, and send a new code email, returning the remaining countdown to the form.
- **FR-024**: A "use a different email" action MUST delete the unverified user record (only when unverified) and return the user to signup with the email pre-populated.
- **FR-025**: A new code-based verification email template MUST display the 6 digits prominently in the body and include the code in the subject line for fast scanning, reusing the shared email helpers. It MUST follow the Bristle voice (no exclamation, no marketing copy). The slice-013 link-based verification email template, the link-based verification route, and the standalone verify-email-sent page MUST be removed.

**Page rebuilds (design fidelity)**

- **FR-026**: `/signup` MUST be rebuilt as a server component composing the split-screen layout (editorial left), with the "CREATE ACCOUNT · 1 OF 2" overline, the serif "Start your research journal." heading, the subhead "Create your account · no card required" (two clauses — see Clarifications C-n; the design's "7-day Pro trial · no card · cancel any time" is **not** used, as no trial mechanism exists), the OAuth button row, the "OR EMAIL" divider, a responsive name+email grid, a password field with strength meter and label, a required Terms checkbox with linked legal pages, the "Create account →" submit (the design's "· start 7-day trial" fragment is dropped for the same truthfulness reason), and a "Have an account? Sign in" footer link. A signup form client island wraps the inputs.
- **FR-027**: `/signup/verify-email` MUST be a server component (replacing the slice-013 route handler) composing the split-screen layout (editorial left), with the "ONE MORE STEP" overline, the serif "Verify your email." heading, a subhead naming the destination email and the expiry countdown, the six-box code input, a "Verify & continue" submit, a resend section with countdown + "use a different email", and a sender-contact info pill. It MUST read the email from the query string and handle a missing value gracefully. A verify form client island wraps the input.
- **FR-028**: `/login` MUST be rebuilt as a server component composing the split-screen layout **mirrored** (editorial right, form left), with the "WELCOME BACK" overline, the serif "Sign in to Bristle." heading, a promotional subhead, the OAuth button row, the "OR EMAIL" divider, an email field, a password field with a right-aligned "Forgot?" link, a "Keep me signed in" checkbox, a "Sign in" submit, and a "New here? Create account" footer link. It MUST handle `?verified=true` / `?reset=true` success banners as in slice 013. The design's "14 new mentions" personalization line and the ⌘K tip card are intentionally omitted (see Clarifications C-c, C-l).
- **FR-029**: `/forgot-password` MUST be rebuilt as a server component composing the split-screen layout (editorial left), with the "ACCOUNT RECOVERY" overline, the serif "Reset your password." heading, the explanatory subhead, an email field, a "Send reset link" submit, the green always-success confirmation pill, and a footer row ("← Back to sign in" left, "Contact support" right). Recovery semantics are unchanged from slice 013.
- **FR-030**: `/reset-password/[token]` MUST be rebuilt as a server component composing the split-screen layout **mirrored** (editorial right, form left), with the "ACCOUNT RECOVERY · FINAL STEP" overline, the serif "Choose a new password." heading, the "Resetting password for [email]" context pill (email from the read-only token-validity helper), a new-password field with strength meter, a confirm-password field with a match check, the requirements list, and an "Update password & sign in" submit. Token semantics are unchanged from slice 013.
- **FR-031**: All six auth routes MUST match their `design/auth-pages/` reference at 1280px within a 4px tolerance and remain usable at 768px (form-only, editorial collapsed) and 375px (form-only).

**Quality floors (per `CLAUDE.md` §4/§5/§6)**

- **FR-032**: All new microcopy MUST follow the Bristle voice — plain, no exclamation points, no "amazing"/"awesome", no emoji — and MUST use the §4 design tokens and type scale (Source Serif Pro headings, Inter UI, JetBrains Mono for the stats ticker and codes, the editorial color tokens, and the orange brand accent for overlines).
- **FR-033**: Every auth route's First Load JS MUST stay within a 130 KB budget (up from slice 013's ~107 KB to accommodate the new primitives; the increase is accepted and plan-pinned).
- **FR-034**: All auth surfaces MUST meet WCAG 2.2 AA: labeled fields (placeholders never replace labels), programmatically associated and announced errors, keyboard-navigable code input (Tab/Shift-Tab/Backspace/arrow keys/paste-spread), an accessible disabled SSO button, and an `aria-live` progress region on the OAuth callback page. Forms MUST preserve entered values (except passwords) on server-side error, following the slice-013 pattern.
- **FR-035**: The credentials forms (signup, login, forgot, reset) MUST function without client JavaScript, with the code input / strength meter / requirement pills as progressive enhancements.

### Key Entities *(include if feature involves data)*

- **User account (extended)**: The slice-013 user identity, now additionally carrying a hashed email-verification code, a code-expiry timestamp, a verification-attempt counter, a Terms-accepted timestamp, and a Terms-version string. The link-based verification token relationship is retired in favor of these on-user fields.
- **Linked external account (now active)**: The slice-013 `accounts` shape (provider, provider account id, token fields), previously dormant, is now written on every successful Google/GitHub sign-in and linked to the user.
- **Email-verification token (retained, emptied)**: The slice-013 single-use token table is kept for future Auth.js Email-provider compatibility but is no longer used by the registration flow; its contents may be dropped.
- **Session / password-reset token (unchanged)**: Carried forward from slice 013 with no shape change; reset semantics (single-use, 1-hour expiry, session invalidation on completion) are preserved.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete signup → 6-digit code verification → first sign-in entirely through the UI, with no manual or database intervention.
- **SC-002**: A user can sign in with Google and, separately, with GitHub, observe the callback progress page, and arrive on `/account` with a valid session and a linked `accounts` row.
- **SC-003**: All six auth routes match their design reference at 1280px within a 4px tolerance, and remain usable at 768px (form-only, editorial collapsed) and 375px.
- **SC-004**: The password strength meter updates live with the correct color and label per score, and the requirement pills toggle correctly per character class as the user types.
- **SC-005**: The six-box code input is fully keyboard-operable (type-to-advance, Backspace-to-retreat, arrow navigation, six-digit paste-spread) and announces completion via `aria-live` without auto-submitting.
- **SC-006**: Entering the correct code verifies the email and routes to `/login?verified=true`; five wrong codes force a new-code request; the resend cooldown of 24 seconds is server-enforced.
- **SC-007**: "Use a different email" deletes the unverified user and returns to signup with the email pre-populated.
- **SC-008**: The Terms checkbox blocks signup submission when unchecked and reports an invalid state.
- **SC-009**: "Keep me signed in" produces a ~30-day session when checked and a browser-session-only cookie when unchecked.
- **SC-010**: The SSO button is visible, disabled, carries the "Coming soon — SSO available on Enterprise" tooltip, and never navigates.
- **SC-011**: The OAuth callback page renders the four-step checklist, polls for the session, and either redirects on success or falls back to `/login` after a 10-second timeout.
- **SC-012**: Password recovery works end-to-end on the redesigned pages while preserving slice-013 semantics (no enumeration, single-use token, 1-hour expiry, session invalidation on reset).
- **SC-013**: A diff against `52dd247` shows only the expected non-additive changes (five auth pages rewritten, link-based verify route and verify-email-sent page removed); everything else is additive.
- **SC-014**: `/account` remains protected (signed-out → `/login?callbackUrl=/account`, returned after sign-in), the auth-aware top nav preserves slice-013 behavior, and the public routes (`/`, `/pricing`, `/faq`, and other 005–012 surfaces) are visually unchanged.
- **SC-015**: The database has all five slice-013 tables plus the five new `users` columns, via a committed and applied migration, with no destructive change beyond emptying the retained `verificationTokens` table.
- **SC-016**: `typecheck`, `lint`, and the production build all pass; no auth route exceeds the 130 KB First Load JS budget.
- **SC-017**: All auth surfaces meet WCAG 2.2 AA, and the credentials forms complete with JavaScript disabled.
- **SC-018**: The end-to-end integration walks pass on the deployed preview: email signup + code verify, Google OAuth, GitHub OAuth, forgot + reset, sign out, protected-route redirect, and the live OAuth callback render.

---

## Clarifications

The following decisions were specified with a recommended default and are recorded here as resolved-with-default; they can be revisited in `/speckit.clarify`. Items flagged **(founder review suggested)** are the ones most worth a deliberate confirmation before implementation.

- **C-a — Editorial panel content per page**: Same testimonial + headline across all five split-screen pages for v1 cohesion (only the editorial *side* mirrors per page). Varied per-page content is a later micro-slice. *(Default applied.)*
- **C-b — Editorial stats footer**: Keep "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" verbatim from the design; computing counts from live data is a tracked follow-up. Note the design intentionally shows a rounded "142,000 problems indexed" in the editorial *body* prose alongside the precise "142,318" in the *stats footer* — both are kept as drawn, not reconciled. *(Default applied.)*
- **C-c — Login promotional subhead**: Use "Sign in to your research journal." (no fake mention counts). This intentionally replaces the design's "Your dashboard has 14 new mentions…" personalization, which requires a notifications system that does not exist until Tier 4+. *(Founder-confirmed: keep the placeholder; voice polish deferred to a later pass — see Tracked follow-ups.)*
- **C-d — Verify code email subject**: Include the code in the subject ("Your Bristle verification code: 472918") for fast scanning, with the code also in the body. *(Default applied.)*
- **C-e — Code TTL**: 10 minutes. *(Default applied.)*
- **C-f — Resend cooldown**: 24 seconds (matches the design's "Resend in 24s"). *(Default applied.)*
- **C-g — Code max attempts**: 5 wrong codes lock that code and force a fresh-code request; no separate hard lockout window, since resend is itself rate-limited (24s) and naturally throttles brute force. *(Default applied.)*
- **C-h — "Use a different email"**: Hard-delete the unverified user record on click (prevents email squatting, simpler logic), versus a soft "abandoned" mark. *(Default applied.)*
- **C-i — OAuth callback poller timeout**: 10 seconds before falling back to `/login`. *(Default applied.)*
- **C-j — Terms tracking**: Store only a Terms-accepted timestamp + version string on the user; a separate acceptance audit log is overkill for v1. *(Default applied.)*
- **C-k — Auth route bundle budget**: 130 KB First Load JS per route (slice 013 was ~107 KB; the new primitives add overhead but should stay under). *(Default applied.)*
- **C-l — ⌘K command palette tip on login**: Removed entirely — the command palette is a Tier 4+ feature and the slice does not promise features that don't exist. *(Default applied.)*
- **C-m — Account-not-linked (OAuth email collision)**: *Founder-confirmed* — accept Auth.js v5's default auto-linking of a provider account to an existing same-email user for v1. Stricter "verify password before linking" account-takeover defense is promoted to a Tracked follow-up.
- **C-n — Signup trial copy**: *Founder-confirmed (Option A)* — the design's "7-day Pro trial · no card · cancel any time" subhead overstates: no trial mechanism exists and `/pricing` (slices 006/007) has no free/trial tier. The subhead becomes the truthful two-clause "Create your account · no card required" (card is collected at upgrade), and the submit button drops its "· start 7-day trial" fragment to "Create account →". The broader cross-surface positioning question (landing's "Start free" CTA vs no free tier) is promoted to a Tracked follow-up.
- **C-o — Verify email sender address**: The design's contact pill names `hello@bristle.dev`. Slice 013's Resend integration runs in a sandbox that can only deliver to verified/own addresses (a known limitation); the displayed sender and the actual deliverable sender may differ in preview. Display `hello@bristle.dev` as drawn; actual custom-domain sender verification is a separate deploy-config follow-up. *(Default applied.)*

---

## Tracked follow-ups

Deferred work this slice deliberately does not do, recorded so it is not lost:

- **TF-001 — Require password verify before OAuth-to-existing-email-account linking** *(security hardening; from C-m)*: Currently Auth.js v5's default auto-links the OAuth identity silently when a Google/GitHub email matches an existing email-account user. Stricter behavior (require password verify before merging the OAuth identity into the account) hardens against an attacker who controls a Google account matching a real user's email. Trade-off: extra friction in legitimate cross-provider signin scenarios. Defer to a security-hardening pass.
- **TF-002 — Pricing positioning reconciliation across public surfaces** *(from C-n)*: `/landing` currently CTAs "Start free →" but `/pricing` has no free tier (Starter $19/mo minimum). `/signup` subhead now says "no card required" (truthful — card collected at upgrade) but doesn't claim a free tier. Consider either: (a) introducing a real free tier on `/pricing` that matches the "free" landing CTA, (b) changing the landing CTA to "Create account →" to remove the free implication, or (c) accepting the soft tension as standard freemium signup positioning. Founder call when pricing matures.
- **TF-003 — Real personalized login subhead** *(from C-c)*: "Sign in to your research journal." is a placeholder. Real personalization ("N new mentions since you were last here", per the design) requires the notifications system (Tier 4+). Replace with founder-polished copy and/or live counts then.
- **TF-004 — Dynamic editorial-panel stats**: The "6 SOURCES · 142,318 PROBLEMS · UPDATED 14 SEC AGO" ticker and editorial body counts are hardcoded; wire to live data once available.
- **TF-005 — ⌘K command palette**: The login ⌘K tip was removed (C-l) because the palette does not exist; ship the tip when the Tier 4+ command palette lands.
- **TF-006 — SSO / SAML**: The SSO button ships visibly disabled; real Enterprise SSO is a v1.1+ feature.
- **TF-007 — Custom-domain email sender verification**: Code emails display `hello@bristle.dev`, but the Resend integration runs in a sandbox that only delivers to verified addresses; verify the sending domain for real user delivery (continues the slice-013 follow-up).
- **Carried from slice 013 (still open)**: distributed (Redis/Upstash) rate limiting, breached-password (HIBP) checks, and any other slice-013 tracked items remain deferred.

---

## Assumptions

- **Builds on slice 013, does not replace it**: The Auth.js v5 architecture, database schema, password hashing, session/cookie handling, rate limiter, middleware, `/account`, and auth-aware nav from slice 013 are authoritative and carried forward; this slice extends rather than rebuilds them.
- **NextAuth core config location**: The Auth.js configuration lives at `apps/web/src/auth.ts` (not `lib/auth.ts`); only its providers array changes. (The user brief refers to it as `lib/auth.ts`; the real path is `apps/web/src/auth.ts` — noted so the plan targets the correct file.)
- **Server Action discipline**: Server Action modules (`"use server"`) export only async functions — a slice-013 constraint that continues to apply to the new verify/resend/use-different-email actions.
- **Supabase schema overlap**: Auth.js tables live in the `public` schema and are managed by Drizzle/our migrations, distinct from Supabase's managed `auth.*` schema; the new `users` columns are additive to our `public.users`.
- **OAuth provider apps exist before implementation**: The founder creates the Google Cloud OAuth client and the GitHub OAuth App and supplies the four client id/secret values; authorized redirect URIs are `SITE_URL + /api/auth/callback/{google,github}`. Documenting these in the quickstart is in-scope; creating the provider apps is a founder pre-action.
- **Environment variables span the right scopes**: The four OAuth secrets (and any new values) must be set in the hosting project at the correct branch/environment scope (preview + production), consistent with the slice-013 `vercel env --git-branch` lesson; a preview build with a missing OAuth secret fails fast by design.
- **Resend sandbox limitation**: Transactional code emails are subject to the slice-013 Resend sandbox constraint (delivery limited to verified addresses in non-production); full deliverability from a verified custom domain is a separate follow-up.
- **No production users to migrate**: The link-based verification artifacts can be removed and `verificationTokens` emptied with no migration of existing users, because verification was only exercised in preview.
- **Static editorial content for v1**: The editorial panel headline, subhead, testimonial, and stats are hardcoded; no live-data wiring this slice.
- **Mobile is single-column, not mobile-first**: The designs show desktop only; below 768px the form panel goes full-width and the editorial panel is hidden or reduced to a brand strip — a reasonable, documented choice rather than a designed mobile layout.
- **Custom password scoring**: Strength scoring is hand-rolled (length + character classes + repeat detection); no zxcvbn or other heavy password library is added.

---

## Dependencies

- **Existing (carried forward from slice 013)**: Supabase Postgres + Drizzle and the database package; the Auth.js v5 core config at `apps/web/src/auth.ts` and its `/api/auth/[...nextauth]` handlers; the Argon2 password wrapper; session/cookie/rate-limit/middleware modules; the shared transactional-email helpers and Resend wiring; the `/account` route and auth-aware top nav; the design tokens and type scale from slices 003/005.
- **Existing (design references)**: The six PNGs in `design/auth-pages/` (signup, login, forgot-password, reset-password, email-verification, oauth-callback) are the visual contract for this slice.
- **New (this slice)**: Google + GitHub OAuth provider apps and their four client id/secret environment variables; five additive `users` columns and their migration; the new code-verification email template; the new shared auth layout primitives and the OAuth callback page.

---

## Out of Scope

SSO / SAML (button present but disabled; real SSO is a v1.1+ Enterprise feature); real "N new mentions" login personalization (needs the notifications system, Tier 4+); the real ⌘K command palette (Tier 4+; tip removed from login this slice); account-takeover defense / verify-before-link on OAuth email collision (tracked follow-up; v1 auto-links); account deletion / GDPR erasure; MFA / 2FA / phone verification; magic-link / passwordless email login; an explicit account-linking confirmation flow; email change while signed in; password change while signed in; avatar upload; CAPTCHA / Turnstile (tracked follow-up from slice 008); dynamic editorial-panel content from the database (v1 hardcoded); custom-domain email sender verification (separate deploy-config follow-up); a designed mobile-first responsive layout (single-column fallback only); zxcvbn or other heavy password libraries; onboarding steps beyond verification (role / categories / first-run tour become Tier 3.2+ surfaces); distributed rate limiting (per-instance limiter retained from slice 013).
