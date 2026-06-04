# Research & Decisions: Slice 4.2 (Dashboard + App Shell)

Founder-confirmed (A1–A9) or resolved here. Format: Decision / Rationale / Alternatives.

## D1 — App-user seam: one `getAppUser()` function (A1)
**Decision**: `apps/web/src/lib/app-user.ts` exports `getAppUser(): Promise<User>` — the ONLY place the demo-vs-session decision lives. v1.0: `return getUserByEmail("demo@bristle.dev")` (the demo-email literal lives ONLY here). The `app/(app)/layout.tsx` separately runs the **auth gate** (`auth()` → redirect if no session). Tier 5.5: change the one line to `getUserByEmail(session.user.email)`.
**Rationale**: Separates WHICH user's data (seam) from WHETHER authenticated (gate), per the founder guards; makes the 5.5 swap one line; keeps the real Tier-3 gate intact. Read helpers take the seam-resolved id — never a hardcoded id.
**Alternatives**: seed a demo session (needs a seed change — out of scope); passwordless demo login (auth change).

## D2 — Auth gate (A1, Tier-3 reuse)
**Decision**: middleware matcher gains `"/app/:path*"` (cookie-presence pre-check, same as `/account`); `app/(app)/layout.tsx` does the authoritative `await auth()` → `redirect("/login?callbackUrl=…")` if no session (TOCTOU-safe, slice-013 pattern). No other Tier-3 file changes.
**Rationale**: Identical to the proven `/account` gate; the layout gate covers every nested screen (4.3–4.8).

## D3 — Read query helpers in `packages/db` (A6)
**Decision**: add read-only helpers (signatures in contracts §3): `getUsageMeters(userId)`, `getWatchedCategories(userId)`, `getRecentActivity(userId)`, `getWeeklyMomentum(userId)`, `getUnreadNotificationCount(userId)`; reuse `getDashboardProblems()`. `getWeeklyMomentum` parses the `dashboard_fixtures.payload` through `WeeklyMomentumSchema` (shared) at the boundary — no raw `any` reaches the UI.
**Rationale**: CLAUDE.md §5 keeps all DB access in `packages/db`; the web app stays drizzle-free. Read-only, no schema/seed change (A6). Each takes the seam id.
**Alternatives**: drizzle in the web app (violates §5); a single mega-query (couples unrelated regions).

## D4 — Sort mechanic: server searchParam (A8)
**Decision**: the dashboard is a Server Component reading `?sort=` (`momentum`|`frequency`|`newest`|`wtp`, default `momentum`). `sort-tabs.tsx` is a thin **client** island that updates the URL (`next/navigation`), the server re-renders the grid. Sort keys: `momentum_pct` / `mention_count_60d` / `first_seen_at` desc / WTP (mention count then median, desc). `getDashboardProblems()` returns all 15; the page sorts + slices top 6 (or a `getDashboardProblems(sort)` variant — plan-pinned: in-memory sort of the 15 is simplest and avoids 4 query variants).
**Rationale**: Keeps the grid server-rendered (small client JS, good Lighthouse); URL-shareable sort; no client data-fetch. `noUncheckedIndexedAccess`-safe.
**Alternatives**: fully client island sorting fetched data (more client JS); 4 server query variants (needless).

## D5 — Weekly chart: hand-rolled SVG (no new dep)
**Decision**: render `weekly_momentum` as **hand-rolled SVG** (polylines for the category series, a dashed polyline for the projection, the caption + "Open in Library →" link), reusing the `Sparkline`/`buildSparklinePath` primitive pattern from `@bristle/ui`. Reduced-motion: no animation, static paths.
**Rationale**: CLAUDE.md §9.5 forbids a new library without proposal; a charting dep (recharts/visx) is unjustified for one fixed multi-series line chart. Tokens for every stroke. Server Component (no client JS).
**Alternatives**: add recharts (new dep — rejected); canvas (heavier, less token-friendly).

## D6 — ProblemCard `SourceKey` gap (flagged — founder decision)
**Finding**: `@bristle/ui` `ProblemCardFull` `SourceKey` = `gh|hn|so|ph|ap|gp` (slice 1.3, pre-4.1). The 4.1 registry = `gh|hn|so|se|appstore|forum`. Mapping: `gh→gh`, `hn→hn`, `so→so`, `se→so` (both → stackexchange badge), `appstore→ap`. **`forum` (Discourse) has NO card mark.** The card also carries dead `ph`/`gp` (4.1 dropped them).
**Decision (CONFIRMED — Option A, scoped tight)**: add a **`forum` (Discourse) source icon** to `@bristle/ui/source-icons` (+ extend `SourceKey`/`SOURCE_LABELS`) so forum-sourced badges render; the adapter maps `forum→forum`. **Scope guards (founder-set):**
- **ADD `forum` only.** Leave the vestigial `ph`/`gp` keys in the card — removing them is a breaking change to a slice-1.3 shared primitive the **Tier-2 landing hero card** may rely on, and the 4.x adapter never feeds `ph`/`gp`, so they're inert here.
- The `se→so` and `appstore→ap` adapter mappings stand as-is.
- **Verify** the rolled-up Stack Exchange badge presents with the registry's label (it now stands for Stack Overflow + the wider network). If aligning the card's `so` label/icon is more than a trivial tweak, **flag it** — do NOT broaden the card edit here.
**Rationale**: B (omit) is out — a card showing fewer sources than the problem has contradicts the detail donut and silently drops forum evidence. Adding one icon is the minimal correct fix.
**Follow-up (TF-022)**: fully reconcile the canonical card's source vocabulary to the 4.1 registry — drop `ph`/`gp` and route the card's badge rendering through `resolveBadge` as the single source-of-truth — **once the Tier-2 landing card's source usage is confirmed safe to change.**

## D7 — Decorative KPI sparklines (A2)
**Decision**: 4 fixed, deterministic sparkline shapes (a small const array of paths/points per KPI, in `kpi-sparkline.tsx`), clearly chrome — NOT random, NOT data-derived (3 of 4 KPIs have no series). Rendered via the same SVG primitive, reduced-motion static.
**Rationale**: Uniform chrome beats fabricating analytics for 3 of 4 tiles; honest about being decorative. Real per-KPI series is a Tier-5 enhancement.

## D8 — Greeting/date live; match-count literal; card target (A3/A4/A5)
**Decision**: greeting time-of-day + date computed from the clock (server time); name from `getAppUser()`. "87 problems match · last 14d" + "All 7" are display literals. Cards link to `/problems/[slug]` (TF-021 re-points in 4.3).
**Rationale**: A "Today" dashboard must be live; the match count mirrors the Library's indexed-count literal; a working public link beats a 404.
