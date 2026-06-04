# Feature Specification: Dashboard + Authenticated App Shell

**Feature Branch**: `017-dashboard`
**Slice**: 4.2 (Tier 4 — Authenticated App)
**Created**: 2026-06-04
**Status**: Draft — held for review (no plan, no code)
**Input**: The Dashboard — the first authenticated product screen — plus the persistent app shell (sidebar + top bar) that slices 4.3–4.8 reuse. Read-only UI over the slice-4.1 demo-user fixtures and the typed queries in `packages/db`. Visual contract: `design/Core_app.pdf` page 1. No schema or seed changes.

## Why this slice exists

Tier 4 turns the seeded data model (slice 4.1) into a usable product. The Dashboard is the **first screen**, and it carries two jobs: render the day-one product surface a signed-in builder sees, and **establish the persistent app shell** (left sidebar + top bar) that every later Tier-4 screen (4.3–4.8) drops into. Getting the shell right once means 4.3–4.8 are pure content slices.

Everything renders against the **demo user's fixtures** (Elena Hart + the seeded problems, categories, usage meters, activity, and dashboard fixtures). When the Tier-5 pipeline goes live, only the underlying data changes — not this UI.

This slice is **read-only UI**: no schema change, no seed/fixture change, no pipeline. It reuses the canonical ProblemCard (slice 1.3) and Tier-3 auth.

## User Scenarios & Testing *(mandatory)*

The primary actor is the **signed-in builder** browsing the app (the demo renders Elena's fixtures). A secondary actor is the **builder of slices 4.3–4.8**, who reuses the shell.

### User Story 1 - The Dashboard renders the day-one product surface (Priority: P1)

A signed-in builder lands on the app and sees a complete dashboard: a personalized greeting and a data-driven subhead; four KPI tiles; a sortable six-card problem grid; a weekly-momentum chart; and a recent-activity rail — all framed by a persistent sidebar (logo, search affordance, nav, watched categories with counts, settings) and top bar (context label, search, notification bell with unread count, avatar). Every value traces to the demo user's data.

**Why this priority**: This is the slice — the first authenticated screen. Without it, Tier 4 has no product surface.

**Independent Test**: Sign in, open the app, and confirm each region (shell, greeting, 4 KPIs, grid, chart, rail) renders the demo user's seeded values matching `design/Core_app.pdf` page 1.

**Acceptance Scenarios**:

1. **Given** a signed-in session, **When** the app route loads, **Then** the authenticated shell + dashboard render, and an unauthenticated visit is redirected to sign in (Tier-3 gate).
2. **Given** the demo user's data, **When** the dashboard loads, **Then** the four KPI tiles show New mentions/24h (14, +27%), Crossed momentum threshold (3), Saved problems (28 of 50), and Alert queue (7, 3 unread), each with a sparkline.
3. **Given** the seeded problems, **When** the grid renders under the default sort, **Then** the top six are Stripe → LLM → Expo → pgvector → OAuth → Fly.io, each a canonical ProblemCard linking to that problem by slug.
4. **Given** the dashboard fixtures, **When** the weekly-momentum chart and recent-activity rail render, **Then** the chart shows the multi-series category lines + dashed projection + caption, and the rail shows the seeded activity entries with type tags, delta labels, and relative timestamps.
5. **Given** the demo user's watched categories and notifications, **When** the shell renders, **Then** the sidebar lists the 7 watched categories with their counts, the active nav item is highlighted, and the bell shows the unread notification count.

---

### User Story 2 - Sorting re-orders the grid (Priority: P1)

A builder switches the sort tab (Momentum / Frequency / Newest / Willingness-to-pay); the six-card grid re-orders to the top six by that sort. Momentum (descending) is the default.

**Why this priority**: The grid is the dashboard's core interaction; sorting is the one piece of real interactivity in the slice.

**Independent Test**: Click each sort tab; confirm the grid re-orders and the top six reflect the chosen sort, with Momentum default showing Stripe→Fly.io.

**Acceptance Scenarios**:

1. **Given** the default view, **When** the dashboard loads, **Then** the Momentum tab is active and the grid is momentum-descending.
2. **Given** the Momentum view, **When** the builder selects Frequency / Newest / Willingness-to-pay, **Then** the grid re-orders by 60-day mentions / first-seen recency / willingness-to-pay respectively, and the active tab updates.

---

### User Story 3 - The shell is reusable chrome for 4.3–4.8 (Priority: P2)

A builder starting slice 4.3 (problem detail) — or any of 4.4–4.8 — drops their screen's content into the existing app shell and gets the sidebar, top bar, active-nav state, theming, and responsive behavior for free, without rebuilding chrome.

**Why this priority**: The shell's reusability is the slice's structural payoff; if it's not a clean layout, every later slice re-litigates chrome.

**Independent Test**: Confirm the app shell is a layout that wraps a content slot, computes active-nav from the current route, and is theme- and mobile-aware independent of the dashboard content.

**Acceptance Scenarios**:

1. **Given** the app shell, **When** a different in-app route is active, **Then** the corresponding nav item is highlighted and the content slot swaps without re-rendering the chrome.

---

### Edge Cases

- **No authenticated session** → the app route redirects to sign in (Tier-3 gate); no demo data leaks to an anonymous viewer.
- **A KPI's underlying meter is absent** → the tile renders a neutral empty state, not a crash.
- **An empty sort result / fewer than six problems** → the grid renders what exists (the seed has 15, so six always fill).
- **Reduced motion** → the sparklines/chart respect `prefers-reduced-motion` (no looping animation).
- **Narrow viewport** → the sidebar collapses to a mobile affordance; the grid reflows to one column; the chart + rail stack.
- **A problem's category is outside the 8 canonical keys** → cannot happen with the seed (all 15 are within the 8), but the card maps category → tint defensively.

## Requirements *(mandatory)*

### Functional Requirements

**App shell (persistent, reused by 4.3–4.8)**

- **FR-001**: The app MUST provide a persistent shell — a left sidebar + top bar — that wraps every Tier-4 screen's content and is gated behind Tier-3 authentication (unauthenticated → redirect to sign in).
- **FR-002**: The sidebar MUST show: the Bristle logo; a ⌘K search affordance (visual only — the command palette is slice 4.8); the five nav links (Dashboard, Library, Saved, Alerts, Compare) with the current screen's link in an active state; a CATEGORIES section listing the **demo user's 7 watched categories**, each with its stored `problem_count`; and a Settings link pinned at the bottom.
- **FR-003**: The top bar MUST show: a context label ("Today" on the dashboard); a search field (visual only this slice); a notification bell badged with the **unread count** from the demo user's notifications; and the user avatar (Elena's initials).
- **FR-004**: The shell MUST support Editorial Light + Editorial Dark via the existing token system, and be mobile-responsive (sidebar collapses; content reflows).

**Dashboard header**

- **FR-005**: The dashboard MUST render a time-of-day greeting with the user's first name (e.g. "Good morning, Elena.") and a date/time line.
- **FR-006**: The dashboard MUST render a subhead computed from the demo user's data: "N new mentions across your 7 categories since yesterday. M problems crossed momentum thresholds." (N, M from the demo user's meters).

**KPI cards**

- **FR-007**: The dashboard MUST render four KPI cards from the demo user's usage meters, each with a sparkline: New mentions / 24h (value + Δ%), Crossed momentum threshold (value), Saved problems (used / quota), Alert queue (value + unread count) — matching page 1 (14 / +27%, 3, 28 of 50, 7 with 3 unread).

**Sort + grid**

- **FR-008**: The dashboard MUST render sort tabs (Momentum / Frequency / Newest / Willingness-to-pay) that re-order the grid; **Momentum descending is the default**. It MUST also show an "All categories" indicator and an "N problems match · last 14d" line (the match count is a display literal).
- **FR-009**: The dashboard MUST render a six-card problem grid using the **canonical ProblemCard from slice 1.3** (reuse, do not rebuild) — category pill, sparkline, top quote + source badge, source badges, momentum %, relative time — showing the top six problems by the active sort. The default (Momentum) top six are Stripe, LLM, Expo, pgvector, OAuth, Fly.io.
- **FR-010**: Each problem card MUST link to that problem's detail route by slug.

**Chart + activity**

- **FR-011**: The dashboard MUST render a weekly-momentum chart from the demo user's `weekly_momentum` dashboard fixture — the multi-series category lines, the dashed projection line, and the editorial caption — with an "Open in Library →" link (the link target is the Library route, built in 4.4).
- **FR-012**: The dashboard MUST render a recent-activity rail from the seeded activity log — each entry's type tag (threshold / new / saved), title, delta label, and relative timestamp.

**Header actions (visual-only this slice)**

- **FR-013**: The header action buttons (Filter, Export digest, + Add category) MUST render per the design but be non-functional this slice (Filter is wired with the Library in 4.4, Add category opens its modal in 4.9, Export digest is Tier 6).

**Data access**

- **FR-014**: The screen MUST read all data through typed queries in `packages/db` (no direct ORM use in the web app). Reusing the existing momentum query, and adding **read-only** query helpers for the demo user's meters, watched categories, activity, weekly-momentum fixture, and unread count — **no schema or seed change**.
- **FR-015**: The authenticated screens MUST resolve "the current app user" to a single source so all Tier-4 screens read the same user's fixtures (see Assumptions A1 — the v1.0-fixtures resolution to the demo user).

### Key Entities *(include if feature involves data)*

All read-only, from slice 4.1:

- **Problem** — drives the grid cards (title, category, momentum, sparkline, top quote + source, sources, last-seen) and the sort orders (momentum, mentions, first-seen, WTP).
- **Category** — the sidebar watched list (label + displayed `problem_count`); the weekly-chart series key.
- **Usage meter** — the four KPI tiles + the subhead counts.
- **Activity entry** — the recent-activity rail (type, title, delta label, timestamp).
- **Dashboard fixture (`weekly_momentum`)** — the weekly chart (series + projection + caption).
- **Alert notification** — the bell's unread count.
- **Demo user** — the resolved current app user whose fixtures every region reads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app route renders the authenticated shell + dashboard and is gated behind Tier-3 auth (anonymous → sign-in redirect). *(AC-1)*
- **SC-002**: All four KPI cards show values computed from the demo user's rows, matching page 1 (14 / +27%, 3, 28 of 50, 7 with 3 unread). *(AC-2)*
- **SC-003**: The sort tabs re-order the grid; Momentum default shows Stripe→Fly.io as the top six. *(AC-3)*
- **SC-004**: The grid renders the canonical ProblemCard (category pill, sparkline, quote + source badge, source badges, momentum %, relative time); each card links to the problem's detail route by slug. *(AC-4)*
- **SC-005**: The weekly-momentum chart renders the seeded multi-series + dashed projection + caption. *(AC-5)*
- **SC-006**: The recent-activity rail renders the seeded activity log with correct type tags and relative times. *(AC-6)*
- **SC-007**: The sidebar lists the 7 watched categories with counts, the active nav state is correct, and the bell shows the unread notification count. *(AC-7)*
- **SC-008**: The screen matches `design/Core_app.pdf` page 1 within tolerance in both Light and Dark themes, is mobile-responsive, and scores Lighthouse 90+. *(AC-8)*
- **SC-009**: Type-check, lint, and build pass; **no schema, migration, or seed/fixture change** — the diff is `apps/web` + **read-only** `packages/db` query helpers (each taking the seam-resolved user id). *(AC-9, reframed per A6)*
- **SC-010**: The app shell is a reusable layout: a different in-app route highlights its nav item and swaps content without re-rendering the chrome (proves 4.3–4.8 reuse).

## Assumptions

Informed defaults; the items marked **[DECISION]** are surfaced for explicit confirmation before `/speckit.plan` (they govern every Tier-4 screen, not just this one, or touch a missing-data point).

- **A1 — Current-user → demo-user seam (CONFIRMED).** Elena (`demo@bristle.dev`) has **no password** and cannot credentials-log-in, yet the screens must render her fixtures. The app is **gated by Tier-3 auth** (any valid session reaches `/app`), but a single **"resolve current app user" seam returns the fixed demo user** (Elena) for v1.0 fixtures. Tier 5.5 flips this seam to the real session user. Guards (founder-confirmed):
  - **One named function** is the ONLY place the demo-vs-session decision lives — so the 5.5 swap is a one-line change, not a screen-by-screen sweep.
  - It resolves **WHICH user's data to show**, NOT **WHETHER** the visitor is authenticated — the real Tier-3 auth gate on `/app` stays fully intact (anonymous → sign-in redirect).
  - Every read helper (A6) takes a **user id resolved through this seam** — **never Elena's id hardcoded** — so the seam remains the single flip point.
- **A2 — KPI sparklines are decorative (CONFIRMED).** `usage_meters` has **no sparkline/series column**, and three of the four KPIs have no real series to derive from — so deriving would fabricate analytics for three while only one is "real," worse than uniform chrome. The KPI sparkline is a **presentational element**: a **deterministic, stable per-card shape** (a fixed path, NOT random noise), clearly chrome — not implied analytics. No new column (that would be a schema change). Real per-KPI series is a deliberate Tier-5 enhancement if ever wanted.
- **A3 — Greeting + date are live.** Default: the time-of-day greeting ("Good morning/afternoon/evening") and the date line are **computed from the current clock** (the design's "Tuesday · May 12 · 09:14" is the design snapshot, not pinned); the name comes from the resolved user. The **data-driven subhead** numbers (N mentions, M crossed) come from the meters. Consequence: the visual diff treats the greeting/date as dynamic (not pixel-matched). (Alternative: pin to the design's values for exact visual-diff fidelity.)
- **A4 — "N problems match · last 14d" is a display literal.** Like the Library's "142,318 indexed", the match count (page 1 shows 87) is a **constant**, not a count over the 15 fixtures (which would show 15). The "All 7" categories indicator reflects the watched count.
- **A5 — Card click target is `/problems/[slug]` for now (CONFIRMED).** The existing public sample-report route renders the seeded problems and is the link target this slice (AC-4) — a working link beats a 404. **Explicit 4.3 follow-up (TF-021):** when slice 4.3 builds the authenticated detail, **re-point the cards there** — a logged-in user should not land on the blurred public sample long-term.
- **A6 — Data-access layer grows; AC-9 reframed (CONFIRMED).** The dashboard needs demo-scoped **read** helpers (meters, watched categories, activity, weekly fixture, unread count) that don't exist yet — only `getDashboardProblems`/`getProblemDetail` do. Adding read-only query helpers to `packages/db` is the **data-access layer growing**, NOT a schema/seed/migration change. **AC-9 now reads: "no schema, migration, or seed/fixture change; the diff is `apps/web` + read-only `packages/db` query helpers."** Each helper takes the seam-resolved user id (A1).
- **A7 — Source-key adapter routes through `resolveBadge` (CONFIRMED).** The stored source keys (`gh/hn/so/se/appstore/forum`, slice 4.1) map to the canonical ProblemCard's inputs via a small **presentation adapter** — and that adapter MUST route through the slice-4.1 source registry's **`resolveBadge`** as the single badge source-of-truth. **No parallel source→badge mapping inside the card** or the web app. No card rebuild, no data change.
- **A8 — Sort mechanics.** Momentum = `momentum_pct` desc; Frequency = `mention_count_60d` desc; Newest = `first_seen_at` desc; Willingness-to-pay = WTP signal (mention count / median) desc. All derivable from the 15 seeded rows; the grid shows the top six.
- **A9 — Stack/route unchanged.** Next.js App Router, Server Components first, Tailwind v4 tokens, `next-themes`, lucide icons; the app lives under a new authenticated route group; the middleware matcher extends to gate it. No new dependency, no new env var.

## Out of Scope

- The other Tier-4 screens — problem detail (4.3), library (4.4), saved (4.5), alerts (4.6), compare (4.7); the command palette (4.8 — ⌘K is a visual affordance only); the add-category modal (4.9).
- Any schema or seed/fixture change — this slice is read-only UI over the 4.1 data. If a needed field is missing, STOP and flag (see A2); do not add it silently.
- Pipeline / live data; real notification delivery; the Filter and Export-digest behaviors.
- Auth changes — Tier-3 auth is reused (see A1 for the current-user seam).

## Dependencies

- Slice 4.1 schema + seed (problems, categories, usage_meters, problem_activity_log, dashboard_fixtures, alert_notifications, the demo user) + the typed queries in `packages/db`.
- The canonical ProblemCard (`@bristle/ui`, slice 1.3) — reused, not rebuilt.
- Tier-3 auth (`auth()`, session, middleware) — reused.
- `design/Core_app.pdf` page 1 — the visual contract. CLAUDE.md §3 (stack), §4 (tokens), §5 (conventions).
