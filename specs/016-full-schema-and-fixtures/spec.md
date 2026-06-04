# Feature Specification: Full Product Schema + 15 Fixture Problems

**Feature Branch**: `016-full-schema-and-fixtures`
**Slice**: 4.1 (Tier 4 — Authenticated App with Fixtures)
**Created**: 2026-06-03
**Status**: Draft — held for review (no plan, no code)
**Input**: Define the complete production data model for the authenticated product and seed it with 15 hand-authored fixture problems, so the seven Tier-4 app screens (slices 4.2–4.8) are built against real seeded data with zero schema rework. Data contract: `design/Core_app.pdf` pages 1–7 — every stored field must trace to something one of those screens renders.

## Why this slice exists

The seven authenticated-app screens — Dashboard, Problem detail, Library, Saved, Alerts, Compare, Command palette — are built in slices 4.2–4.8. Building seven screens against seven separately-evolving ad-hoc shapes would guarantee schema churn and rework. This slice front-loads the **one production data model** they all read from, and **seeds it with realistic data**, so every later screen is a pure rendering exercise over a stable, typed contract.

The schema is the **production** schema: exactly the shape the Tier-5 pipeline will eventually write. Fixtures are hand-authored rows in that production shape — never UI-only shortcuts. If a value cannot be expressed as a row the pipeline could later populate, it does not belong here.

This slice builds **no screens and no pipeline**. It is data model + seed only.

## User Scenarios & Testing *(mandatory)*

The "users" of this slice are (a) the **builders of slices 4.2–4.8**, who consume the schema and seed, and (b) the **demo viewer** (a signed-in user browsing the seeded app once the screens exist). Scenarios are framed around those consumers.

### User Story 1 - Every screen's data has a home in the schema (Priority: P1)

A builder starting slice 4.2 (Dashboard) — or any of 4.3–4.8 — opens the schema and finds a typed home for **every value their screen renders**: stat tiles, category counts, problem cards, momentum and sparklines, the multi-series momentum chart, the activity rail, the full problem-detail page (synthesis, sources donut, WTP panel, who's-complaining personas, related problems, frequency series, evidence quotes, existing solutions), the Library table and its filter facets, the Saved Kanban (collections + ordered cards), the Alerts feed (notifications + watch rules + delivery channels), and the Compare grid (metrics rows, qualitative scorecards, and "Bristle's Read"). Nothing a screen shows requires inventing a new table mid-slice.

**Why this priority**: This is the whole point of the slice — it eliminates schema rework across the next seven slices. If any screen field has no home, those slices stall.

**Independent Test**: Walk each of `design/Core_app.pdf` pages 1–7 field-by-field and confirm each rendered value maps to a named entity + attribute (or a seeded, schema-representable structure). Zero unmapped fields.

**Acceptance Scenarios**:

1. **Given** the Dashboard design (page 1), **When** a builder looks up the four stat tiles, the seven sidebar category counts, the six problem cards, the weekly multi-series momentum chart, and the recent-activity rail, **Then** each maps to a stored attribute or a seeded structure.
2. **Given** the Problem-detail design (page 2), **When** a builder looks up the synthesis, the sources donut, the WTP panel, who's-complaining personas, related problems, the 90-day frequency series, the 47 evidence quotes, and the six existing solutions, **Then** each maps to a stored attribute or a seeded structure.
3. **Given** the Library, Saved, Alerts, Compare, and Command-palette designs (pages 3–7), **When** a builder looks up each rendered value — filter facet counts, Kanban collections + ordered cards, notifications + watch rules + delivery channels, Compare metric rows + qualitative scorecards + Bristle's Read, palette result groups — **Then** each maps to a stored attribute or a seeded structure.

---

### User Story 2 - The seed produces the exact 15 fixtures the screens depict (Priority: P1)

Running the seed populates the database with **15 fixture problems** and all their associated rows, plus the curated categories and the demo user's personal fixtures (saved collections, saved problems, alert rules, notifications, usage meters). The 15 are exactly the problems shown across pages 1–7, plus filler to reach 15 and cover every category the app surfaces — notably **Analytics**, which no screen depicts. The hero fixture — **Stripe webhooks fail silently on Vercel cold starts** — is rich enough to fully populate the page-2 problem-detail screen.

**Why this priority**: Without the exact depicted data, the later screens cannot be visually verified against their designs. The hero must be complete or page 2 can't be built or reviewed.

**Independent Test**: Run the seed against an empty database; confirm 15 problems exist with the exact titles/categories the designs show, the hero has every page-2 section populated, and the demo user owns the page-4/5 personal fixtures. Re-run the seed; confirm no duplication and no error.

**Acceptance Scenarios**:

1. **Given** an empty database, **When** the seed runs, **Then** exactly 15 problems exist, including all 13 named in the designs (Stripe webhooks, LLM streaming, Expo OTA, pgvector, OAuth refresh, Fly.io wake, Supabase Realtime, Notion API, Cursor agent, Astro webhook, SES bounce, App Store Connect login, Stripe Connect onboarding) plus 2 filler — at least one of which is an **Analytics** problem.
2. **Given** the seeded hero problem, **When** a builder inspects it, **Then** it carries the full synthesis text, a source breakdown summing to its quote count over the five live sources (GitHub 20 / Hacker News 13 / Stack Exchange 9 / App Store 3 / Forums 2 = 47 — no Product Hunt / Google Play, per the source-model decision), an 11-mention WTP aggregate ($20–$99/mo, median $60), a who's-complaining persona breakdown (Indie founders 22 / Engineers 16 / Agency 6 / Other 3), four related-problem links, a 90-day frequency series, ≥5 evidence quotes (several flagged as WTP signals, with engagement metrics), and six existing solutions with match types.
3. **Given** a seeded database, **When** the seed is run a second time, **Then** the row counts are unchanged and no unique-constraint error occurs (idempotent).
4. **Given** the seed, **When** it completes, **Then** the demo user owns four saved collections (Next product, Q3 brief candidates, Read later, For Jules to review) with ordered saved-problem cards, four watch rules (one disabled), the alerts feed, and usage meters (e.g. saved problems 28 of 50).

---

### User Story 3 - Typed queries return ordered, correct data (Priority: P2)

A builder writes a typed "dashboard problems sorted by momentum" query and gets back the seeded set, fully typed, in the correct order — the same order the Library table (page 3) and Dashboard cards (page 1) show. Source keys resolve to display badges through a single mapping, so the five live sources (and the network/forum roll-ups) render correctly without any screen hardcoding a source key.

**Why this priority**: Proves the schema is not just present but queryable into exactly the shapes the screens need, and that the source model is screen-safe.

**Independent Test**: Execute the momentum-sorted query against the seed; confirm the returned order matches the page-3 table (Stripe webhooks +312% → LLM +184% → Expo +96% → pgvector +72% → OAuth +58% → Fly.io +41% → …). Resolve every seeded source key to a badge via the mapping; confirm Stack-Exchange-network sites collapse to one badge and forums to one badge.

**Acceptance Scenarios**:

1. **Given** the seed, **When** the momentum-sorted dashboard query runs, **Then** it returns the 15 problems fully typed, ordered by momentum descending, matching the design's order.
2. **Given** a problem's source breakdown, **When** each source key is resolved through the badge mapping, **Then** all five live sources (Hacker News, GitHub, Stack Exchange, Apple App Store, developer forums) map to a display badge, with Stack-Exchange-network entries under one badge and forum entries under one badge.

---

### Edge Cases

- **Star-rated reviews vs threaded posts**: App Store evidence quotes carry a star rating and no thread engagement; HN/GitHub/SO quotes carry a generic engagement metric (points/reactions/reputation) and no rating. The quote shape must hold both without nullable sprawl breaking either.
- **Problems with no WTP and no personas**: page-6 Compare shows problems with "0" WTP and a single dominant persona; the schema must represent absent WTP/persona data distinctly from zero.
- **A disabled watch rule** (page 5: "AI/ML · WTP mentions > 5 · New") must be representable (enabled flag + zero fired-count).
- **Category display count ≠ seeded fixture count**: the sidebar shows global counts (Devtools 142) that are far larger than the number of seeded fixtures in that category; the displayed count is a stored literal, independent of `COUNT(*)` over fixtures.
- **Re-running the seed** must not duplicate rows or violate unique constraints (idempotent upsert on stable keys).
- **Filler fixtures** must still be complete, valid production rows (not stubs) so they render cleanly anywhere they appear.

## Requirements *(mandatory)*

### Functional Requirements

**Schema scope & continuity**

- **FR-001**: The data model MUST be the production shape the Tier-5 pipeline will later write — no UI-only fields that the pipeline could not populate.
- **FR-002**: The model MUST extend the existing database (the slice-004 `problems` table and the Tier-3 auth/onboarding tables) rather than recreate it; existing columns consumed by shipped public pages (landing, sample report) MUST continue to satisfy those pages.
- **FR-003**: The migration MUST apply cleanly to the managed database with every new table visible in the database dashboard.

**Problems & evidence**

- **FR-004**: The model MUST represent a **problem** with: title, unique URL slug, category, synthesis text, demand status (validated / trending / emerging), momentum percent, momentum bucket (+100%+, +25–99%, flat/declining, new <30d), 60-day mention count, first-seen timestamp, and last-updated timestamp.
- **FR-005**: The model MUST represent each problem's **evidence quote** with: author handle, an engagement metric (reputation / points / reactions / stars per source), an optional star rating, quote text, source URL, posted-at timestamp, a willingness-to-pay-signal flag, and an optional stated price.
- **FR-006**: The model MUST represent each problem's **source breakdown** (per-source quote counts) sufficient to draw the sources donut (page 2) and the card/table source badges (pages 1, 3).
- **FR-007**: The model MUST represent each problem's **existing solutions** with: name, price range, match type (direct / adjacent / partial), description, and mention count.
- **FR-008**: The model MUST represent each problem's **willingness-to-pay aggregate** (total mention count, price range, median price, plus the individual stated prices) sufficient to render the page-2 WTP panel and the page-6 WTP cell.

**Screen data that does not obviously map (must be representable AND seeded)**

- **FR-009**: The model MUST represent a problem's **frequency / sparkline series** over time (the page-1 card sparkline and the page-2 "last 90 days" frequency chart, including a marked validation-threshold point).
- **FR-010**: The model MUST represent a problem's **who's-complaining persona breakdown** (labelled persona segments with counts/percentages — page 2 and page 6).
- **FR-011**: The model MUST represent **related-problem links** between problems (the page-2 "Related problems" list).
- **FR-012**: The model MUST represent the page-6 **qualitative scorecards** (validated-demand, has-direct-solution, persona-fit, build-effort, defensibility) and **"Bristle's Read"** verdict (STRONGEST / BUILD-ABLE / WATCH / SKIP + prose) as hardcoded fixture values (v1.0 deferral — not computed).
- **FR-013**: The model MUST represent the **weekly multi-series momentum chart** on the dashboard (per-category momentum-over-time series + the editorial caption).

**Categories**

- **FR-014**: The model MUST represent a **category** with: key, display label, color/tint tokens, a displayed live-problem count (a stored literal), an is-custom flag, and an optional created-by-user reference.
- **FR-015**: The seeded categories MUST cover every category the seven screens render (the sidebar set plus Email/Comms), each with the design's displayed count and a tint that exists in the design system.

**User-scoped product data**

- **FR-016**: The model MUST represent **saved collections** (name, color, ordering position) and **saved problems** (which collection, ordering position for Kanban) per user — page 4.
- **FR-017**: The model MUST represent **watch/alert rules** (name, category, type, threshold, delivery channels, enabled flag, fired-count) and **alert notifications** (type ∈ momentum / new / WTP / digest / threshold / weekly, title, body, read state) per user — page 5.
- **FR-018**: The model MUST represent a per-user **activity log** of typed entries (threshold crossed, quotes added, problem added, saved) feeding the dashboard activity rail (page 1) and the problem-detail Activity tab (page 2).
- **FR-019**: The model MUST represent per-user **usage meters** (metric, used, quota) for tier displays such as "Saved problems 28 of 50" — pages 1, 4.
- **FR-020**: The model MUST carry forward the Tier-3 **onboarding category selection** without recreating it; if a normalized form is introduced it MUST preserve the existing selection.

**Source model**

- **FR-021**: The model MUST support exactly five live sources — Hacker News, GitHub, Stack Exchange (Stack Overflow + wider network), Apple App Store, and developer community forums (Discourse) — as an **extensible set**, where adding a source later does not change any screen-facing assumption.
- **FR-022**: The model MUST provide a **source-key → display-badge mapping** such that Stack-Exchange-network sites collapse to one badge and forum sites collapse to one badge, and **no source key is hardcoded in any screen-facing type**.

**Seed**

- **FR-023**: A seed routine MUST insert the 15 fixture problems and all associated rows (quotes, sources, solutions, WTP, frequency series, personas, related links, activity), the curated categories with displayed counts, and the demo user's personal fixtures (collections, saved problems, watch rules, notifications, usage meters).
- **FR-024**: The 15 fixtures MUST be exactly the problems depicted across pages 1–7, plus filler to reach 15 covering every screen-surfaced category (including at least one Analytics problem).
- **FR-025**: The hero fixture (Stripe webhooks) MUST be complete enough to fully populate every section of the page-2 problem-detail screen.
- **FR-026**: The seed MUST be **idempotent** — safe to re-run with no duplication and no constraint violation.
- **FR-027**: The seed MUST attach all user-scoped fixtures to a single **demo user**.
- **FR-028**: Every seeded row — including filler — MUST be a valid production row (no stubs, no UI-only fields). All 15 fixtures (fillers included) MUST be **equally fleshed** — every one carries the full set of card-level fields (title, category, momentum, sparkline, source badges, top quote) so no visibly thin card appears anywhere in the Dashboard grid or Library table.

**Continuity & demo-seed guarantees**

- **FR-029**: The seed MUST set the **demo user's `watched_categories`** to the **canonical 8 category keys** (the §4.1a-tinted set: `devtools, payments, ai-ml, auth-sso, deployment, analytics, mobile, email`), NOT the 18-slug onboarding values — so every screen resolves "my categories" to real `categories` rows that carry counts and tints. The seed MUST NOT normalize the selection into a join table this slice (that would drag the onboarding write-path + catalog reconciliation into a schema slice).
- **FR-030**: Extending the existing `problems` table MUST be **non-breaking** for the live Tier-2 consumers (the public landing hero card and the public `/problems/[slug]` sample report): all newly added columns MUST be **nullable or defaulted**, the existing seed row MUST be **backfilled** so it satisfies the new shape, and both the landing card and a sample-report page MUST still render after the migration.
- **FR-031**: The fixture-only JSON payloads (Compare qualitative scorecards, "Bristle's Read", the dashboard weekly-chart series) MUST be backed by an **explicit shared type contract** (a single typed schema), because the v1.1 LLM output that later replaces these hardcoded values MUST target the identical shape.
- **FR-032**: The fixed demo user MUST seed in **both local and the Vercel preview** environments (so the screens demo in both), with a stable identity that **cannot collide with a real signup** on the same email.

### Key Entities *(include if feature involves data)*

- **Problem** — a synthesized, evidence-backed problem report; the central entity. Carries identity (slug/title/category), editorial body (synthesis), and ranking signals (momentum %, bucket, mention count, demand status, first-seen).
- **Evidence quote** — one complaint citation under a problem; author + engagement (or star rating) + text + source + WTP flag + optional price.
- **Source breakdown** — per-problem per-source quote counts (drives donut + badges).
- **Existing solution** — a competing/adjacent product under a problem; name, price, match type, mention count.
- **WTP aggregate** — per-problem willingness-to-pay roll-up (count, range, median) + the individual prices.
- **Frequency series** — per-problem time series of mentions (sparkline + 90-day chart + threshold marker).
- **Persona segment** — per-problem "who's complaining" breakdown (label + count/percentage).
- **Related link** — a directed/undirected association between two problems.
- **Compare card** — per-problem hardcoded qualitative scorecards + "Bristle's Read" verdict (fixture-only, v1.0).
- **Category** — a product category; key, label, tint tokens, displayed count, custom flag, optional owner.
- **Saved collection / Saved problem** — a user's Kanban board of saved problems (collections with color + position; cards with collection + position).
- **Watch rule / Alert notification** — a user's alert configuration and the resulting notification feed.
- **Activity entry** — a typed event in a user's activity log.
- **Usage meter** — a per-user metric/used/quota row for tier displays.
- **Demo user** — the single user that owns all user-scoped fixtures.
- **Category momentum series** — per-category momentum-over-time data for the dashboard weekly chart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The migration applies cleanly to the managed database and every new table is visible in its dashboard. *(AC-1)*
- **SC-002**: The seed inserts exactly 15 fixture problems plus every associated row, attaches all user-scoped fixtures to the demo user, and is safe to re-run (re-running leaves row counts unchanged and raises no error). *(AC-2)*
- **SC-003**: The 15 fixtures are exactly the problems shown across `design/Core_app.pdf` pages 1–7, plus filler to reach 15 covering every screen-surfaced category, including at least one Analytics problem. *(AC-3)*
- **SC-004**: A typed "dashboard problems sorted by momentum" query returns the seeded set fully typed and in the correct (design-matching) order. *(AC-4)*
- **SC-005**: Every seeded fixture is a valid production row — a reviewer can point to each field and name the screen element it feeds, with no UI-only fields the pipeline could not later populate. *(AC-5)*
- **SC-006**: All five live sources resolve to display badges through the mapping, with no source key appearing in any screen-facing type, and network/forum roll-ups collapsing to one badge each. *(AC-6)*
- **SC-007**: Type-checking and linting both pass with zero errors. *(AC-7)*
- **SC-008**: Every value rendered on `design/Core_app.pdf` pages 1–7 traces to a seeded, schema-representable structure (zero unmapped fields).
- **SC-009**: The hero fixture fully populates every section of the page-2 problem-detail screen (synthesis, donut, WTP, personas, related, frequency, ≥5 evidence quotes, six solutions).
- **SC-010**: After the migration + seed, the existing live Tier-2 surfaces still render: the public landing hero card and a public `/problems/[slug]` sample-report page both load and display correctly (no regression from extending `problems`). *(FR-030)*
- **SC-011**: The demo user's `watched_categories` resolve 1:1 to seeded `categories` rows (all 8 canonical keys), so every "my categories" sidebar/filter on the screens shows real catalog rows with counts and tints. *(FR-029)*

## Assumptions

These were surfaced as decisions and are now **founder-confirmed** (resolution recorded inline).

- **A1 — `user_categories` does not exist today (CONFIRMED: keep the array).** Tier 3 (slice 015) stored the onboarding selection as a `watched_categories` text-array column on the user, **not** a join table. Resolution: **keep the array untouched**, treat `categories` as the canonical catalog, do **not** normalize to a join this slice (it would drag the onboarding write-path + catalog reconciliation into a schema slice). **Non-negotiable add (FR-029):** the seed sets the demo user's `watched_categories` to the **canonical 8 keys** so every screen resolves "my categories" to real catalog rows.
- **A2 — Demo user attachment (CONFIRMED: fixed demo user).** A single fixed demo user (deterministic id, stable email), idempotent, signup-independent. **Adds (FR-032):** seeds in both local **and** Vercel preview; cannot collide with a real signup on the same email.
- **A3 — Non-obvious-data placement (CONFIRMED: hybrid).** Relational/queried data (persona segments, related links, frequency points, source breakdown, WTP prices) → **dedicated child tables** (frequency as a child table is what the Tier-5.9 pipeline writes). Fixture-only v1.0 payloads (Compare scorecards, "Bristle's Read", weekly-chart series) → **JSON on the problem**, with an **explicit shared type contract (FR-031)** so the v1.1 LLM replacement targets the same shape.
- **A4 — Canonical category set.** The `categories` table seeds the **8 design-system categories** (devtools, payments, ai-ml, auth-sso, deployment, analytics, mobile, email) that have both labels (slice-003 `CATEGORY_LABELS`) and §4.1a tint tokens and that the seven screens render. The broader **18-slug onboarding catalog** (slice 015, with divergent slugs like `mobile-dev`/`email-comms`) is a separate watch-list catalog; reconciling the two is **out of scope** here and flagged as a follow-up.
- **A5 — "Every onboarding category" = every screen-surfaced category.** 15 fixtures cannot cover 18 onboarding slugs one-each; the brief's intent is read as covering every category the app surfaces (the sidebar/canonical set), with Analytics — absent from all screens — guaranteed at least one filler fixture.
- **A6 — Hosting/stack unchanged.** Managed Postgres + the existing ORM + the existing migration tooling (CLAUDE.md §3); no new dependencies, no new env vars, no pipeline/ingestion tables (raw items, embeddings, tracked sources are Tier 5).
- **A7 — All ranking/qualitative values are literals.** Momentum %, momentum bucket, demand status, WTP median, personas, scorecards, and "Bristle's Read" are hand-authored fixture values; no computation this slice.
- **A8 — Filler fixtures.** Of the 2 filler problems, one is an **Analytics** problem; the second fills the next screen gap and is a complete production row.
- **A9 — Idempotency key.** Idempotency is keyed on each entity's stable natural key (problem slug, category key, demo-user email, collection name per user, rule name per user) via upsert.

## Out of Scope

- Any of the seven screens — this slice is schema + seed only (slices 4.2–4.8 build the screens).
- Any pipeline / ingestion: no raw-items, embeddings, or tracked-repos/apps/forums tables (Tier 5).
- Real momentum computation, real WTP extraction, real "Bristle's Read" — all literal fixture values.
- Auth or onboarding behavior changes; billing/tier **enforcement** (usage meters are seeded display values only — no enforcement logic).
- **TF-019 (bundled follow-up) — Category-catalog convergence.** A1's `watched_categories` array→`user_categories` join normalization and A4/A5's 18-slug onboarding catalog ↔ 8-key canonical catalog merge are **the same problem** and ship as **one** follow-up. **Hard trigger:** it MUST land **before any non-demo user drives category filtering — i.e. before the Tier-5.5 fixtures→live swap.** Until then the demo user (seeded with the canonical 8 keys per FR-029) carries every screen. Direction is fixed: onboarding's 18 slugs migrate onto the canonical set, **not** the reverse.

## Dependencies

- Tier 3 auth + onboarding schema (users, sessions, accounts, watched-categories array) — extended, not recreated.
- The slice-004 `problems` table and its public-page consumers (landing, sample report) — preserved.
- `design/Core_app.pdf` pages 1–7 — the binding data contract.
- CLAUDE.md §3 (stack), §4 (design tokens / category tints).
