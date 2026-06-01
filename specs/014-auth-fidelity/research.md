# Research: Auth Visual + Functional Fidelity (Slice 014)

Phase 0 decisions. Format per item: **Decision / Rationale / Alternatives considered**. All resolve cleanly; no open `NEEDS CLARIFICATION` markers remain.

---

## R1 — Hashing the 6-digit verification code: argon2id, not SHA-256

**Decision**: Hash the code with **argon2id**, reusing the existing `lib/auth/password.ts` wrapper (the same `@node-rs/argon2@2.0.2` already used for passwords). `email-verification-code.ts` exposes `generateCode()` (6 random digits), `hashCode(code)` (argon2id), `verifyCode(input, storedHash)` (argon2.verify).

**Rationale**: A 6-digit code has only 10⁶ possible values. A SHA-256 (or any fast hash) of such a code is reversible by exhaustive search in microseconds if the `users` row leaks — i.e. it provides essentially zero protection. argon2id's deliberate cost makes an offline brute force of a leaked hash impractical, and the runtime cost is irrelevant here: at most one verify per attempt, capped at 5 attempts (C-g) and rate-limited (C-f), so we never hash in a hot loop. Reusing the installed argon2 wrapper adds no dependency (§9.5 untouched) and keeps one hashing primitive in the codebase.

**Alternatives considered**: (a) SHA-256/HMAC-SHA-256 — fast, but trivially brute-forceable for a 6-digit space even with a server-side pepper unless the pepper is itself well-protected; rejected as false economy. (b) Store the code in plaintext with a short TTL — rejected; a DB leak hands out live codes. (c) bcrypt — no existing wrapper, would re-introduce a dependency question; argon2 is already here.

## R2 — Adding Google + GitHub providers does not re-trip the v5 `onlyCredentials` assertion

**Decision**: Set `providers: [Google({...}), GitHub({...})]` in `apps/web/src/auth.ts`, importing from `next-auth/providers/google` and `next-auth/providers/github` (submodules of the installed `next-auth@5.0.0-beta.31` — **no new dependency**). Keep `session.strategy: "database"`.

**Rationale**: Slice 013's `auth.ts` header documents that `@auth/core`'s `assertConfig()` throws `UnsupportedStrategy` when a Credentials provider is the *only* provider **and** the strategy is `database` (`if (dbStrategy && onlyCredentials)`). That is why slice 013 ships `providers: []` and hand-rolls credentials sessions. Adding Google + GitHub makes the providers array **non-empty with non-credentials providers**, so `onlyCredentials` is false and the assertion cannot fire. The credentials login path is unaffected — it still never calls Auth.js `signIn()`; it verifies the password and calls `createUserSession` (Decision D2). OAuth, by contrast, *does* flow through Auth.js and the adapter (R3).

**Alternatives considered**: (a) Re-add a `Credentials` provider now that providers is non-empty — rejected; the hand-rolled credentials session works, is proven, and re-introducing `Credentials` would risk the assertion if OAuth providers were ever removed and adds a redundant code path. (b) Switch to JWT strategy — rejected; slice 013 needs DB sessions for password-reset bulk invalidation (FR-016), and that requirement stands.

## R3 — Who creates the session: Auth.js+adapter for OAuth, `createUserSession` for credentials

**Decision**: For OAuth, let Auth.js + `DrizzleAdapter` create the `sessions` row and set the session cookie automatically on the `/api/auth/callback/[provider]` round-trip. Do **not** call `createUserSession` for OAuth. Credentials sign-in keeps using the manual `createUserSession` path. Both write the same `sessions` table and the same cookie name/options (pinned in `session-cookie.ts`), so `auth()` reads either uniformly.

**Rationale**: The DrizzleAdapter is purpose-built to persist OAuth sessions under the database strategy; re-implementing it would be redundant and error-prone. Because slice 013 pinned the cookie name + options in `auth.ts`'s `cookies.sessionToken` config (matching the manual writer), the framework-written OAuth cookie and the manually-written credentials cookie are indistinguishable to the reader. The `accounts` table (provisioned in slice 013 with all 11 columns) receives the provider linkage row with no shape change.

**Alternatives considered**: (a) Force OAuth through `createUserSession` too (uniform path) — rejected; would mean intercepting the adapter's session creation, fighting the framework for no benefit. (b) Custom `signIn`/`jwt` callbacks to reshape the session — unnecessary; the existing `session` callback already surfaces `id` + `emailVerified`.

## R4 — `pages.verifyRequest` must be dropped when `/signup/verify-email-sent` is deleted

**Decision**: Edit `auth.ts` `pages` from `{ signIn: "/login", verifyRequest: "/signup/verify-email-sent" }` to `{ signIn: "/login" }` (drop `verifyRequest`).

**Rationale**: `verifyRequest` is the page Auth.js redirects to after an **Email-provider** "magic link" send. Bristle does not use the Email provider (verification is our own code flow), so `verifyRequest` is never exercised — but leaving it pointed at a route this slice deletes is a latent dangling reference and a misleading config. Dropping it is safe and honest. This is a required `auth.ts` edit **beyond** the providers array; the brief's "providers array gets added; everything else stays" is inaccurate on this one point.

**Alternatives considered**: (a) Leave `verifyRequest` pointing at the deleted route — rejected; dead config that 404s if ever hit. (b) Repoint it at the new `/signup/verify-email` page — rejected; semantically wrong (that page expects an `?email=` param from our own signup, not an Auth.js Email-provider redirect).

## R5 — Password strength scoring (dependency-free)

**Decision**: A pure `scorePassword(pw): 0|1|2|3|4` combining: **length tiers** (<8 → 0 contribution; ≥8, ≥12, ≥16 step up), **character-class diversity** (count of {lowercase, uppercase, digit, symbol}), and a **repeat/sequence penalty** (runs of the same char or trivial sequences like `1234`/`aaaa` cap the score). Score → label/colour: 0 empty, 1 weak (status/error red), 2 fair (status/warning amber), 3 strong (status/success green), 4 excellent (accent/validated dark green). Labels match the design strings ("Strong — 12+ chars, mixed case, one number" / "Excellent — passphrase-style passwords resist 4M× more attempts.").

**Rationale**: FR-009 + C-spec forbid zxcvbn (≈400 KB) to protect the 130 KB budget. A heuristic over length + classes + repeat detection is sufficient for a *guidance* meter (it is UX, not an auth gate — the real floor is the server-side ≥12-char rule carried from slice 013). Pure function → unit-inspectable and trivially client-cheap.

**Alternatives considered**: (a) zxcvbn / @zxcvbn-ts — rejected on bundle size (§5) and the no-heavy-library constraint. (b) Server-side scoring via a Server Action on each keystroke — rejected; needless round-trips, worse UX, and the meter is advisory.

## R6 — CodeInput accessibility + interaction model

**Decision**: Six controlled `<input inputmode="numeric" autocomplete="one-time-code" maxLength={1}>` boxes, each with `aria-label="Digit N of 6"`. Roving focus: typing a digit advances to the next box; Backspace clears the current box (or, if empty, focuses+clears the previous); ArrowLeft/Right move focus; paste of a 6-char numeric string on the **first** box spreads one digit per box and focuses the last. When all six are filled, an `aria-live="polite"` region announces completion — but the form does **not** auto-submit (FR-011); the user presses "Verify & continue". Non-digit input is rejected.

**Rationale**: `autocomplete="one-time-code"` lets iOS/Android surface the SMS/email code suggestion (the code is emailed, and some clients expose it). The no-auto-submit rule prevents a mis-typed paste from firing a wasted attempt against the 5-attempt cap. The roving-focus + arrow + paste-spread model is the conventional OTP-input pattern and is fully keyboard-operable for WCAG 2.2 AA (SC-005, FR-034).

**Alternatives considered**: (a) Single text input styled to look like six boxes — simpler a11y but loses the per-box focus affordance the design shows. (b) Auto-submit on sixth digit — rejected per FR-011 (burns attempts on paste typos). (c) A library OTP component — rejected; no dependency for ~80 lines.

## R7 — OAuth callback routing (UX page vs direct-to-/account)

**Decision**: OAuth buttons target `/api/auth/signin/{provider}?callbackUrl=/auth/callback/{provider}`. After the adapter creates the session, Auth.js redirects to `/auth/callback/{provider}`, which `auth()`-checks and immediately `redirect()`s to `/account` (or a forwarded `callbackUrl`). On the rare race where the session is not yet readable, the page renders the 4-step progress UI and `CallbackProgressPoller` polls a lightweight server action every 500ms, redirecting on success or after a 10s timeout (C-i) to `/login`.

**Rationale**: The design (2_6) has a dedicated progress screen; routing through it gives that UI a home. In the fast path it flashes (acceptable — copy says "usually under a second"); in the slow path it informs rather than showing a blank redirect. Pinning the `callbackUrl` resolves the Batch B implementation ambiguity the founder flagged.

**Alternatives considered**: (a) `callbackUrl=/account` directly (skip the progress page) — rejected; throws away a designed surface and the slow-connection affordance (FR-018 rationale a). (b) Render progress unconditionally and never short-circuit — rejected; needless delay on the common fast path.

## R8 — `rememberMe` cookie semantics

**Decision**: `createUserSession(userId, rememberMe = true)`. `rememberMe` true → cookie `expires` = now+30d (today's behavior). false → omit cookie `expires`/`maxAge` → session-only cookie (cleared at browser close). The DB `sessions.expires` row stays 30d in both cases.

**Rationale**: SC-009 requires the toggle to control persistence. The minimal, correct mechanism is the cookie lifetime, not the DB row (a session-only cookie is dropped by the browser regardless of the row's expiry; the stale row is harmless and lazily cleaned). Default `true` preserves backward-compatibility for the sole caller pre-change. Credentials-only — OAuth has no checkbox (R3).

**Alternatives considered**: (a) Shorten the DB row expiry for non-remember sessions — rejected; adds a second expiry concept for no user-visible benefit. (b) Separate "session" vs "persistent" cookie names — rejected; over-engineered, and `auth()` reads one pinned name.

## R9 — Mobile layout for the split screen (design is desktop-only)

**Decision**: Below 768px, `auth-split-layout` hides the editorial panel (or reduces it to a thin brand strip) and gives the form panel full width; at 375px the form remains single-column and usable. No auth flow depends on editorial-panel-only content.

**Rationale**: The six PNGs are desktop (1280px) only; §10 says ask when design is silent, but the spec pre-resolved this as a documented default (C-spec assumptions + edge cases) rather than invention — a form-only collapse is the conventional, low-risk responsive behavior and nothing functional lives in the editorial panel.

**Alternatives considered**: (a) Stack editorial-above-form on mobile — rejected; pushes the form below the fold and the editorial content is non-essential. (b) Block on a mobile design — rejected; the spec authorizes the documented default to avoid stalling the slice.

## R10 — No new runtime dependencies; gate is verification (no new test harness)

**Decision**: Confirm zero package additions (providers are `next-auth` submodules; argon2/adapter/zod/resend reused) and keep verification at the gate phase (typecheck/lint/build + bundle + a11y + end-to-end walks), as in slices 005–013. No Vitest/Playwright wiring this slice.

**Rationale**: Matches the established slice cadence and keeps the lockfile diff empty (a clean §9.5 story). Introducing a test harness now would be scope the slice did not ask for (§9.4).

**Alternatives considered**: (a) Add Playwright for the OAuth round-trip — tempting but out of scope; the STOP 8 preview walk covers it manually. Tracked as a future testing-infrastructure slice.

---

**Open clarifications**: none. The 15 spec clarifications (C-a…C-o) are confirmed; C-c/C-m/C-n are founder-confirmed.
