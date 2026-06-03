# Feature Specification: Onboarding — Role + Categories (Steps 1–2)

**Feature Branch**: `015-onboarding`

**Created**: 2026-06-03

**Status**: Draft

**Slice**: Tier 3.2 — Slice 3.2 (repo numbering 015) per `docs/Bristle-Build-Plan.pdf`. Builds on slice 014 (Auth Fidelity).

**Base commit**: `c6f8025` (slice-014 merge `976b863` + the `design/onboarding/` PNGs).

**Input**: User description: "Slice 015 (Tier 3.2) — Onboarding: capture new users' role (Step 1) + watched categories (Step 2) immediately after email verification, feeding personalization to future product surfaces. Steps 1+2 ONLY (Step 3 First-Run Tour deferred until a dashboard exists)."

---

## Overview

Slice 014 made a new user able to verify their email and reach a minimal `/account`. This slice inserts a **two-step onboarding** between verification and the account area so the product captures, once, the two inputs every future surface (dashboard, alerts, comparison) will personalize against: **who the user is** (role) and **which categories they watch** (3–5 slugs). It is the load-bearing bridge from the auth foundation to the product proper — it does not yet *act* on the preferences; it *captures* them durably.

Scope is deliberately **Steps 1 + 2 only**. The full design includes a Step 3 First-Run Tour, but a tour must overlay a dashboard that does not exist yet; it becomes a separate micro-slice when the dashboard ships. Consequently the step counter reads **"Step 1 of 2" / "Step 2 of 2"** (the design PNGs show "of 3"), and several design affordances that imply data Bristle does not have yet are deliberately stubbed: category cards show **"Coming soon"** instead of active-problem counts, the **sparklines are removed**, the search subtitle is **"Showing all"** (not "sorted by activity"), and aspirational copy ("unlock instant alerts") is kept as forward-looking promise rather than a live feature.

Onboarding is **mandatory-but-skippable**: a new user is gated into it after verification and after any first sign-in (including OAuth), but a "Skip for now" affordance on either step completes onboarding immediately and routes to `/account` with the preferences left null/empty (future code treats null role + empty categories as sensible "show everything" defaults). Re-editing preferences is deferred to a later Settings slice; once onboarding is complete, the onboarding routes redirect away.

This slice carries a small **constitution edit** (`CLAUDE.md` §8 product-surface map gains `/onboarding/*` + the role/categories capture) and the project's **third migration** (`0003`: four additive `users` columns).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New user completes onboarding and reaches their account (Priority: P1)

A freshly-verified user lands on `/onboarding/role`, sees a personalized welcome ("WELCOME TO BRISTLE, MARLON"), picks the role that fits them, reads the per-role preview of how their dashboard will lead, and continues. On the next step they search/scan a category grid, select between 3 and 5 categories, and finish — landing on `/account` with their role and watched categories saved.

**Why this priority**: This is the core capture loop the whole slice exists to perform. Without it, future personalization has no inputs.

**Independent Test**: Verify a brand-new email, complete role → categories, and confirm `/account` is reached with `role`, `watched_categories` (3–5), and `onboarding_completed_at` all persisted.

**Acceptance Scenarios**:

1. **Given** a freshly-verified new user, **When** email verification succeeds, **Then** they are routed to `/onboarding/role` (not directly to `/account`).
2. **Given** the role step, **When** the user selects one of the six roles and continues, **Then** their role is saved and they advance to `/onboarding/categories`.
3. **Given** the categories step, **When** the user has selected 3–5 categories and continues, **Then** the categories are saved, `onboarding_completed_at` is set, and they are routed to `/account`.
4. **Given** the categories step with fewer than 3 selected, **When** the user looks at the continue control, **Then** it is disabled until at least 3 are selected.
5. **Given** the categories step with 5 selected, **When** the user attempts a 6th, **Then** the selection is prevented and the limit is indicated.

---

### User Story 2 - User skips onboarding (Priority: P1)

A user who would rather get to the product immediately clicks "Skip for now" on either step. Onboarding is marked complete and they land on `/account`; their role and categories remain unset, and the product later treats that as generic defaults.

**Why this priority**: A mandatory flow with no exit traps users and harms the skeptical-builder experience. Skip is the essential escape hatch and a first-class path.

**Independent Test**: From either onboarding step, click "Skip for now" and confirm `/account` is reached with `onboarding_completed_at` set and `role`/`watched_categories` still null/empty.

**Acceptance Scenarios**:

1. **Given** either onboarding step, **When** the user clicks "Skip for now", **Then** `onboarding_completed_at` is set and they are routed to `/account`.
2. **Given** a user who skipped, **When** they later reach `/account`, **Then** they are NOT redirected back into onboarding (skip counts as complete).
3. **Given** a user who skipped, **When** any future surface reads their preferences, **Then** null role + empty categories are interpretable as "show all categories, generic view".

---

### User Story 3 - Onboarding access is correctly gated (Priority: P2)

Access to the onboarding and account areas is governed by sign-in state and completion state, so users always end up in the right place: unsigned visitors are sent to sign in, incomplete users are pulled into onboarding, and completed users are kept out of it.

**Why this priority**: The redirect rules are what make onboarding "mandatory-but-once". Get them wrong and users either bypass capture or get stuck re-onboarding.

**Independent Test**: Exercise each rule directly (signed-out `/onboarding/*`, incomplete `/account`, completed `/onboarding/*`) and confirm the redirect target.

**Acceptance Scenarios**:

1. **Given** an unsigned visitor, **When** they request any `/onboarding/*` route, **Then** they are redirected to `/login?callbackUrl=/onboarding/role`.
2. **Given** a signed-in user whose onboarding is not complete, **When** they request `/account`, **Then** they are redirected to `/onboarding/role`.
3. **Given** a signed-in user whose onboarding IS complete, **When** they request any `/onboarding/*` route, **Then** they are redirected to `/account` (re-edit deferred).
4. **Given** the slice-014 `/account` protection, **When** any of these rules apply, **Then** the existing signed-out-→-`/login?callbackUrl=` behavior is preserved unchanged.

---

### User Story 4 - OAuth users onboard on first sign-in (Priority: P2)

A user who signs up via Google or GitHub has no separate "verification" step, but still needs to be onboarded once. On their first sign-in they are routed into onboarding the same way, with their provider display name driving the personalized welcome.

**Why this priority**: OAuth is a first-class signup path from slice 014; skipping onboarding for OAuth users would leave a whole cohort unpersonalized.

**Independent Test**: Sign in with a brand-new Google (or GitHub) account and confirm the first landing is `/onboarding/role` with the provider name in the welcome overline.

**Acceptance Scenarios**:

1. **Given** a brand-new OAuth user (no prior session), **When** they complete provider consent and a session is created, **Then** their `onboarding_completed_at` is null and they are routed into `/onboarding/role`.
2. **Given** an OAuth user with a provider display name, **When** the role step renders, **Then** the welcome overline shows their first name; **and given** no name, it falls back to the un-named welcome.
3. **Given** a returning OAuth user who already completed onboarding, **When** they sign in, **Then** they go straight to `/account` (not back into onboarding).

---

### User Story 5 - Step 2 category selection behaves correctly (Priority: P2)

On the categories step the user can search to filter a multi-select grid, must pick at least 3 and at most 5, sees their picks as removable pills with a live counter and hint, and reads honest placeholder copy where live data doesn't exist yet.

**Why this priority**: The 3–5 constraint and the search are the functional heart of step 2; the honest-placeholder treatment is what keeps the product credible to a skeptical user before problems exist.

**Independent Test**: On `/onboarding/categories`, type a query and confirm filtering; select/deselect via cards and pills; confirm the counter/hint update and the min/max enforcement.

**Acceptance Scenarios**:

1. **Given** the category grid, **When** the user types into search, **Then** the grid filters to categories whose name contains the query (case-insensitive), and the placeholder shows the real category count.
2. **Given** any category card, **When** the user toggles it, **Then** its selected state (orange border + filled checkbox) and the selected-pills row + counter update; **and** each pill can be clicked to deselect.
3. **Given** the selection count, **When** it is below 3 / 3–4 / 5, **Then** the hint reads "pick N more to continue" / "pick N more to unlock instant alerts" / "max reached" respectively.
4. **Given** a category card, **When** it renders, **Then** its subline reads "Coming soon" (no active-problem count) and no sparkline is shown.
5. **Given** the subhead, **When** it renders, **Then** it states the Starter 5-category limit with an "Upgrade to Pro" link to `/pricing`, and the search subtitle reads "Showing all".

---

### User Story 6 - Captured preferences persist for future use (Priority: P3)

The role (and free-text "other"), the watched categories, and the completion timestamp are stored durably and validly, and a user who leaves mid-flow resumes at the right step rather than starting over.

**Why this priority**: The captured data is the slice's product output; it must be well-shaped for the consuming slices, and partial-resume avoids losing a user's first answer.

**Independent Test**: Submit role only, leave, return — confirm the role survived and the user resumes on step 2; confirm `role_custom` is required iff role is "other", and that watched_categories holds 3–5 valid slugs.

**Acceptance Scenarios**:

1. **Given** a user who submitted step 1 and left, **When** they return to onboarding, **Then** their saved role is retained and they continue from the categories step.
2. **Given** the role "Something else", **When** the user submits without entering custom text, **Then** submission is rejected with a clear message; **and** a non-empty custom answer (≤200 chars) is saved to `role_custom`.
3. **Given** a completed onboarding, **When** the stored data is read, **Then** `role` is one of the allowed values (or null if skipped), `watched_categories` holds 3–5 known slugs (or null if skipped), and `onboarding_completed_at` is set.

---

### Edge Cases

- **No display name**: the welcome overline falls back to "WELCOME TO BRISTLE" (no comma, no name) when the user has no name (skipped name at signup, or an OAuth profile without one).
- **"Other" role without text**: submitting role = "other" with empty custom text is rejected; the textarea is required only in that case (≤200 chars).
- **Tampered category slugs**: a submitted slug not in the canonical category list is rejected (server-side validation), independent of the client grid.
- **Boundary counts**: exactly 3 selected is allowed (continue enabled); exactly 5 is the max (6th prevented); 0 selected leaves the continue disabled.
- **Direct deep-link to step 2 before step 1**: a user who reaches `/onboarding/categories` without a saved role is handled gracefully (sent back to `/onboarding/role` rather than allowed to complete with no role).
- **Re-skip / re-complete**: a completed user hitting `/onboarding/*` is redirected to `/account`; the completion timestamp is not overwritten.
- **JavaScript disabled**: the selectors are interactive client surfaces; with JS off the grids cannot enforce min/max client-side, so the server actions remain the authority (they re-validate 3–5 and the role rules) and the page degrades to a usable, if less guided, form.
- **Concurrent sessions**: completing onboarding in one tab and then acting in a stale tab re-evaluates gating on the next request (session reflects the fresh completion state).

---

## Requirements *(mandatory)*

### Functional Requirements

**Constitution, schema, and constants**

- **FR-001**: `CLAUDE.md` MUST be updated so the product-surface map (§8) records the `/onboarding/role` + `/onboarding/categories` routes and the role/categories capture as Tier 3.2. This edit MUST land as one of the slice's first commits.
- **FR-002**: The `users` entity MUST gain four additive fields: a nullable role string, a nullable free-text custom-role string, a nullable list of watched category slugs, and a nullable onboarding-completion timestamp. A migration (`0003`) MUST be generated, committed, and applied; the schema MUST match the committed migration. (The schema source MUST be edited before generating the migration.)
- **FR-003**: A canonical **categories list** MUST exist as a shared constant (slug + display label + optional description + optional icon name), consumed by both step 2's grid and the server-side validation. The list ships with ~18 placeholder categories (from the design) marked for founder replacement before merge; it MUST NOT carry active-problem counts or sparkline/trend data (deferred until problems exist).

**Entry / exit / gating**

- **FR-004**: After successful email-code verification, a **new** user MUST be routed to `/onboarding/role` rather than to `/account`.
- **FR-005**: Access gating MUST enforce: unsigned `/onboarding/*` → `/login?callbackUrl=/onboarding/role`; signed-in + onboarding-incomplete `/account` → `/onboarding/role`; signed-in + onboarding-complete `/onboarding/*` → `/account`. The slice-014 signed-out-`/account` protection MUST be preserved.
- **FR-006**: The onboarding-completion state MUST be available to the gating layer for the signed-in user without an extra per-request database read in the common path (e.g., surfaced on the session).
- **FR-007**: OAuth (Google + GitHub) users MUST traverse the same onboarding gating on first sign-in (their completion state starts unset), identical to credentials users.

**Step 1 — Role**

- **FR-008**: `/onboarding/role` MUST present the six roles verbatim from the design (Indie founder, Product manager, Agency / studio, Innovation lab / scout, Researcher / student, Something else), each with its label, description, and an icon, in a selectable grid; exactly one is selectable at a time.
- **FR-009**: A personalized overline MUST read "WELCOME TO BRISTLE, {FIRSTNAME}" using the first whitespace-delimited token of the user's name, falling back to "WELCOME TO BRISTLE" when the name is null/empty.
- **FR-010**: Selecting a role MUST update a per-role **preview line** (the "your dashboard will lead with …" copy) shown in the step footer; the copy is aspirational and clearly about the future dashboard.
- **FR-011**: Choosing "Something else" MUST reveal an inline free-text field; the custom answer is required (non-empty, ≤200 chars) only when that role is chosen and is saved as the custom role.
- **FR-012**: A "Continue" control MUST persist the chosen role (+ custom text when applicable) and advance to `/onboarding/categories`. Submission MUST re-validate the role server-side.

**Step 2 — Categories**

- **FR-013**: `/onboarding/categories` MUST present the canonical categories in a multi-select grid; selecting toggles a clearly-indicated selected state (orange border + filled checkbox).
- **FR-014**: The user MUST select **at least 3 and at most 5** categories; the continue control is disabled below 3, and a 6th selection is prevented with a visible indicator. Selection MUST be re-validated server-side (3–5 known slugs).
- **FR-015**: A search input MUST filter the grid by case-insensitive substring of the category name; its placeholder MUST reflect the real category count (not a hardcoded number), and the subtitle MUST read "Showing all".
- **FR-016**: Each category card MUST show its name and a "Coming soon" subline; it MUST NOT show an active-problem count or a sparkline (no fabricated data).
- **FR-017**: A selected-pills row MUST list the current selection as removable pills, with a live counter and a hint that reads "pick N more to continue" (below 3), "pick N more to unlock instant alerts" (3–4), or "max reached" (5).
- **FR-018**: The subhead MUST state the Starter 5-category limit and link "Upgrade to Pro" to `/pricing` (the upgrade flow itself is out of scope).
- **FR-019**: A "Finish →" control MUST persist the selected slugs, set the onboarding-completion timestamp, and route to `/account`. (The label is "Finish →", not the design's "Continue → tour" — the tour is deferred and step 2 completes onboarding; C-j.)

**Skip**

- **FR-020**: A "Skip for now" affordance MUST appear in the shell header on both steps; activating it MUST set the onboarding-completion timestamp and route to `/account`, leaving role and categories unset.

**Layout, voice, continuity**

- **FR-021**: A new **onboarding shell** MUST wrap both steps: a top header (Bristle logo, a 2-segment progress indicator, "Step N of 2", "Skip for now") over a centered, full-width content area on the light canvas — NOT the slice-014 split-screen. The progress indicator fills the first segment on step 1 and both on step 2.
- **FR-022**: All new microcopy MUST follow the Bristle voice (§6) and use the §4 tokens/type scale (serif headings, orange overlines via the slice-014 overline component, Inter body, mono where needed). Error states MUST reuse the slice-014 error-banner treatment. No new design tokens are introduced.

**Data persistence**

- **FR-023**: A user who completes only step 1 and returns MUST resume at step 2 (role persisted on step-1 submit; step-2 read uses it); a user who reaches step 2 with no saved role MUST be returned to step 1.
- **FR-024**: Stored preferences MUST be valid: role ∈ the allowed set (or null), custom role present iff role = "other", watched categories a 3–5-element subset of known slugs (or null), completion timestamp set on complete or skip.

**Quality floors (per `CLAUDE.md` §4/§5/§6)**

- **FR-025**: The role and category selectors MUST be keyboard-operable and screen-reader-accessible (role group = single-choice; category group = multi-choice; selected state and counts conveyed non-visually), meeting WCAG 2.2 AA. The server actions remain the validation authority so the flow is safe without client JS.
- **FR-026**: New onboarding routes MUST stay within the performance budget (First Load JS comfortably under the §5 ceiling; expected near the slice-014 auth-route band). Server-first composition; only the two selectors are client islands.

**Slice integrity**

- **FR-027**: The slice MUST NOT modify slices 005–014 surfaces except: the `CLAUDE.md` §8 edit; the `users` schema additions; the **extension** of `middleware.ts` (additive matcher + the onboarding rules, not a rewrite); the **extension** of the session callback + its type augmentation to surface completion state; and the change to the post-verification redirect target (new users → `/onboarding/role`). `/account` and the auth pages otherwise stay as slice 014 shipped them.

### Key Entities *(include if feature involves data)*

- **User (extended)**: The slice-014 identity, now additionally carrying a chosen **role** (nullable, one of a fixed set), a **custom role** free-text (nullable; set only for "other"), a list of **watched category slugs** (nullable; 3–5 when set), and an **onboarding-completion timestamp** (nullable; set on complete or skip). Null role + empty/null categories are a valid "skipped / defaults" state.
- **Category (constant, not a table)**: A canonical entry with a stable **slug**, a display **label**, an optional **description**, and an optional **icon name**. The list is the single source of truth for the step-2 grid and server-side slug validation. It intentionally carries no counts or trend data this slice.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from verified email to a personalized `/account` by completing role + 3–5 categories entirely through the UI, with the three preference fields + completion timestamp persisted.
- **SC-002**: A user can exit onboarding at any point via "Skip for now" and reach `/account`, with completion recorded and preferences left unset.
- **SC-003**: All four gating rules hold (unsigned `/onboarding/*` → login; incomplete `/account` → onboarding; complete `/onboarding/*` → `/account`; signed-out `/account` → login), for both credentials and OAuth users.
- **SC-004**: OAuth (Google + GitHub) first-time users are routed through onboarding with their provider name in the welcome; returning completed OAuth users go straight to `/account`.
- **SC-005**: Step 2 enforces 3 ≤ selected ≤ 5 (continue disabled <3, 6th prevented), and search filters by case-insensitive name with the real category count shown.
- **SC-006**: Category cards show "Coming soon" with no counts and no sparklines; the search subtitle reads "Showing all"; the step counter reads "of 2".
- **SC-007**: Role "Something else" requires a non-empty ≤200-char custom answer; other roles save without it; the per-role preview line updates on selection.
- **SC-008**: A user who saved only their role and returned resumes at the categories step (role retained); a user reaching step 2 with no role is returned to step 1.
- **SC-009**: Server-side validation rejects an unknown/tampered category slug and an out-of-range count, independent of the client grid.
- **SC-010**: `typecheck`, `lint`, and the production build pass; the `users` schema matches the committed `0003` migration; the categories constant exists with the documented shape.
- **SC-011**: The onboarding routes meet WCAG 2.2 AA (keyboard-operable single/multi-select, non-visual selected-state + counts) and stay within the performance budget.
- **SC-012**: Slices 005–014 are unaffected: `/account` and the auth pages behave as before except for the new gating redirects; the integrity diff shows only the flagged exceptions.
- **SC-013**: The end-to-end flows pass on a deployed preview: credentials signup → onboarding → `/account`; Google onboarding; GitHub onboarding; skip → `/account`; completed-user `/onboarding/*` → `/account`.

---

## Clarifications

Decisions recorded with a recommended default; revisitable in `/speckit.clarify`. Items flagged **(founder review suggested)** most warrant a deliberate confirmation.

- **C-a — Final category list**: ships with the ~18 design placeholders (Devtools, Payments, AI / ML, Auth & SSO, Deployment, Analytics, Mobile dev, DataOps, No-code / Low-code, Browsers, Security, Design tools, Email / Comms, Calendaring, Content / CMS, Education tech, Health tech, Climate), each `// TODO`-marked. **(founder review suggested — replace with the real list before merge.)**
- **C-b — "Other" textarea placement**: inline below the role grid, revealed when "Something else" is chosen (not a separate step). *(Default applied.)*
- **C-c — Partial-progress persistence**: yes — step 1 saves the role on submit; a returning incomplete user resumes at step 2. *(Default applied.)*
- **C-d — Selectable-card hover**: subtle, matching the design's calm resting state (border/elevation shift within tokens; no scale). *(Default applied.)*
- **C-e — Step counter "of 2", not "of 3"**: the tour is deferred, so both steps read "Step N of 2" (overriding the design PNGs' "of 3"). *(Default applied — brief override.)*
- **C-f — Category subline = "Coming soon"**: not "142 active problems · updated 12m ago" (no problems exist). *(Default applied — brief override.)*
- **C-g — Sparklines removed**: no fabricated trend lines on the cards. *(Default applied — brief override.)*
- **C-h — Search subtitle = "Showing all"**: not "Showing all · sorted by activity" (no activity sort exists). *(Default applied — brief override.)*
- **C-i — Search placeholder count**: uses the real `CATEGORIES.length` (not the design's "312"). *(Default applied.)*
- **C-j — Step-2 Continue button label**: *Founder-confirmed* — **"Finish →"** (not the design's "Continue → tour"). Avoids over-promising a dashboard that's still a placeholder; clean completion signal. Update to "Continue → dashboard" when the dashboard ships.
- **C-k — "Unlock instant alerts" hint**: kept as aspirational forward-promise (alerts don't exist yet); tracked as a follow-up to become real when alerts ship. *(Default applied — founder-recommended.)*
- **C-l — "Upgrade to Pro" link**: targets `/pricing` (the page exists); the actual upgrade/billing flow is out of scope. *(Default applied.)*
- **C-m — Step h1 copy**: uses the design headings — "What are you trying to do?" (step 1), "Which categories should we watch?" (step 2). *(Default applied — from design.)*

---

## Tracked follow-ups

- **TF-008 — Settings page** to re-edit role + categories (and other preferences); onboarding is one-and-done this slice.
- **TF-009 — Real category data**: active-problem count + sparkline/trend on the cards, once problems exist.
- **TF-010 — "Instant alerts"** must actually exist for the step-2 unlock copy to be literally true.
- **TF-011 — Step 3 First-Run Tour** micro-slice, when a dashboard exists to overlay.
- **TF-012 — Dashboard customization** that *acts on* the captured role + categories (this slice only captures).
- **TF-013 — Role copy / preview-line polish** — current strings are placeholder; founder may refine.
- **TF-014 — Settings-page edit access**: the future Settings slice will edit `role` + `watched_categories`. Both columns are nullable in slice 015, so the settings UI is straightforward CRUD on the same columns (no schema change needed there).
- **Carried from slice 014**: pricing reconciliation (TF-002), OAuth account-link hardening (TF-001), dynamic editorial stats (TF-004), ⌘K palette (TF-005), SSO/SAML (TF-006), Resend domain verification (TF-007), text-link focus-ring micro-slice, husky + lint-staged, and the slice-013 carry-forwards (Upstash distributed rate-limit, HIBP, production migration runbook, separate prod Supabase project at real-user scale).

---

## Assumptions

- **Builds on slice 014, does not replace it**: the Auth.js v5 config, session strategy, middleware shape, `/account`, and the auth pages are authoritative and extended, not rebuilt.
- **Single Supabase project (dev == prod)**: migration `0003` is applied to the one shared project, as established in slice 014.
- **Migration workflow**: the Drizzle schema source is edited before `drizzle-kit generate` (the slice-014 STOP-1 lesson); any consuming code touched in the same batch as a nullability/type change.
- **Completion = complete OR skip**: a single timestamp marks "onboarding resolved"; there is no separate "skipped" flag this slice.
- **Categories are static constants**: not a database table this slice; the founder edits the list before merge. Slug validation is against the constant.
- **First array column**: `watched_categories` is the schema's first Postgres `TEXT[]` column (Drizzle DSL `text("watched_categories").array()`); the `0003` migration emits `ADD COLUMN watched_categories text[]`.
- **Three slice-014 files extend (not refactor)**: `signup/verify-email/actions.ts` (the new-user redirect target → `/onboarding/role`), `auth.ts` (session callback surfaces `onboardingCompletedAt`), and `next-auth.d.ts` (type augmentation for it) — all forward-compatible extensions. Plus `apps/web/src/middleware.ts` — not a slice-014 file, but the load-bearing new routing logic that gates `/onboarding/*` and `/account` by completion state.
- **Name source**: the display name captured at signup (credentials) or from the OAuth provider profile; no separate username/profile editing.
- **Aspirational copy is acceptable** where it promises a future capability without claiming a present one (per the brief), and is tracked.
- **Mobile**: the design is desktop-only; the centered onboarding content degrades to a single-column, usable layout on small screens (reasonable default, not a designed mobile layout).

---

## Dependencies

- **Existing (carried forward)**: slice-014 Auth.js v5 config + session callback + `next-auth.d.ts`, `middleware.ts`, `/account`, the auth pages and primitives (overline, error banner), the design tokens/type scale; Supabase Postgres + Drizzle and the `db` package; the `/pricing` page (slice 006/007) as the "Upgrade to Pro" target.
- **Existing (design references)**: `design/onboarding/3_1_Role.png` + `3_2_Categories.png` (the in-scope visual contract); `3_3_First-Run_Tour.png` is reference for the deferred tour micro-slice only.
- **New (this slice)**: four additive `users` columns + migration `0003`; the shared categories constant; the onboarding routes, shell + primitives, two selector islands, and three server actions.

---

## Out of Scope

Step 3 First-Run Tour (deferred until a dashboard exists); a Settings page / re-edit access; the real billing / "Upgrade to Pro" upgrade flow; dashboard logic that acts on the captured role/categories; real category active-problem counts + sparklines; a real "instant alerts" feature; category-preference sync via any external API; role-specific onboarding paths (all roles share the one 2-step flow); email-notification-preference capture; avatar/profile-picture upload; a separate username distinct from the signup name; and a designed mobile-first layout (single-column fallback only).
