# Implementation Plan: Dashboard + Authenticated App Shell (Slice 4.2)

**Branch**: `017-dashboard` · **Spec**: [spec.md](./spec.md) · **Base**: `462a180` (main, slice-4.1 merged)
**Status**: PLAN — held for review. **DON'T-IMPLEMENT guard active** — no `/speckit.tasks`, no code until founder go.

## Summary

Build the first authenticated screen (the Dashboard) plus the **persistent app shell** (sidebar + top bar) that slices 4.3–4.8 reuse. Read-only UI over the slice-4.1 demo-user fixtures. New authenticated route group `app/(app)/` gated by Tier-3 auth; a single **`getAppUser()` seam** resolves *which* user's data to render (the demo user for v1.0). Add **read-only** query helpers in `packages/db` (meters, watched categories, activity, weekly-momentum, unread count). Reuse the canonical `ProblemCardFull` (slice 1.3) via a presentation adapter that routes source keys through `resolveBadge`. Hand-rolled SVG for the weekly chart (no charting dep). **No schema, migration, or seed/fixture change.**

## Technical Context

**Stack**: Next.js 15 App Router (Server Components first); Tailwind v4 tokens; `next-themes` (already wired); lucide-react; TS strict. (CLAUDE.md §3.)
**Data**: read-only via typed `packages/db` helpers (reuse `getDashboardProblems`; add the A6 read helpers). JSON payloads parsed through the slice-4.1 shared Zod contracts (`WeeklyMomentumSchema`) at the boundary. dev==prod single Supabase.
**Auth**: Tier-3 — cookie middleware pre-check + authoritative `auth()` in the layout. The `getAppUser()` seam resolves the data-user (demo for v1.0) — **separate** from the auth gate.
**Reuse**: `@bristle/ui` `ProblemCardFull` + `Sparkline`; `@bristle/shared` `resolveBadge`/`SOURCE_REGISTRY`; Tier-3 `auth()`.
**Scope**: `apps/web` (new route group + components) + read-only `packages/db` helpers. **0 new deps, 0 new env, no schema/seed/migration.**
**Unknowns**: one flagged — the ProblemCard `forum` source gap (research D6); resolution needs founder OK.

## Constitution Check

| Rule | Status |
|---|---|
| §3 locked stack (Next 15, Server Components, Tailwind v4, next-themes, lucide) | ✅ used as-is |
| §4 design tokens / §4.1a category tints | ✅ every color a token; category tints via the card |
| §5 Server Components first; DB via Drizzle in `packages/db`; kebab files; **no localStorage** | ✅ (sort via searchParams, not storage) |
| §9.5 no new library without proposal | ✅ chart is **hand-rolled SVG** (Sparkline pattern), no charting dep |
| §9.6 no localStorage/sessionStorage | ✅ |
| §7 SDD: spec→plan→tasks→implement; STOP gates; one commit/task | ✅ 5 STOP batches below |

**One item to ratify (not a violation):** the `forum` source icon gap (D6) — adding a `forum` mark to `@bristle/ui` is a **canonical-card extension**, no new dep; surfaced for explicit approval, not done silently.

## Project Structure (this feature)

```
apps/web/src/
  app/(app)/
    layout.tsx              # the reusable app shell (sidebar + top bar + content slot); auth() gate
    dashboard/page.tsx      # the dashboard (or app/(app)/page.tsx at /app)
  components/app/
    app-sidebar.tsx         # logo, ⌘K affordance, nav (active state), watched categories, settings
    app-topbar.tsx          # context label, search field, notification bell (unread), avatar
    sidebar-nav.tsx (client) + mobile-sidebar-toggle (client)
    dashboard/
      dashboard-header.tsx  # greeting (live) + subhead (data) ; kpi-card.tsx (×4) ; kpi-sparkline.tsx (decorative)
      sort-tabs.tsx (client); problem-grid.tsx; weekly-momentum-chart.tsx (SVG); activity-rail.tsx
      header-actions.tsx    # Filter / Export digest / + Add category (visual-only)
    problem-card-adapter.ts # DB Problem row → ProblemCardFull props (routes source keys via resolveBadge)
  lib/
    app-user.ts             # getAppUser() — THE demo-vs-session seam (5.5 flip point)
  middleware.ts             # +"/app/:path*" matcher (cookie pre-check)
packages/db/src/queries.ts  # + getUsageMeters / getWatchedCategories / getRecentActivity /
                            #   getWeeklyMomentum / getUnreadNotificationCount (read-only)
specs/017-dashboard/        # plan.md · research.md · data-model.md · quickstart.md · contracts/ui-and-data.md
```

No schema/seed/migration files change.

---

## Batching — 5 STOP-gated batches

### Batch 0 — App shell + auth gate + `getAppUser()` seam (STOP 1)
`lib/app-user.ts`: **`getAppUser()`** — the ONE function holding the demo-vs-session decision; for v1.0 returns the demo user (`getUserByEmail("demo@bristle.dev")` — the demo-email literal lives ONLY here). `app/(app)/layout.tsx`: `auth()` gate (no session → redirect `/login?callbackUrl=…`) + render the shell (sidebar + topbar + `{children}`). `middleware.ts`: add `"/app/:path*"` to the matcher (cookie pre-check). Sidebar/topbar render with static/placeholder data (real data wired in Batch C/D). Active-nav from the current pathname. typecheck/lint.

### Batch A — Read query helpers + card adapter (STOP 2)
`packages/db/src/queries.ts` (+ index exports): `getUsageMeters(userId)`, `getWatchedCategories(userId)` (resolve `watched_categories` slugs → `categories` rows w/ count+tints), `getRecentActivity(userId)`, `getWeeklyMomentum(userId)` (read `dashboard_fixtures` key `weekly_momentum`, **parse via `WeeklyMomentumSchema`**), `getUnreadNotificationCount(userId)` — all read-only, each taking the seam-resolved id. `components/app/problem-card-adapter.ts`: DB `Problem` → `ProblemCardFullProps`, routing source keys through `resolveBadge` (single badge source-of-truth). **Resolve the `forum` gap (D6)** per founder decision. typecheck/lint.

### Batch B — Dashboard header + KPIs + grid + sort (STOP 3)
`dashboard/page.tsx` reads `getAppUser()` → the A6 helpers + `getDashboardProblems()`. `dashboard-header.tsx` (live greeting + data subhead), 4 `kpi-card.tsx` (from `getUsageMeters`, decorative `kpi-sparkline`), `sort-tabs.tsx` (client; `?sort=` searchParam) + the "All categories" + "87 problems match · last 14d" literal line, `problem-grid.tsx` (top 6 via the active sort, each `ProblemCardFull` wrapped in `<Link href="/problems/[slug]">`). `header-actions.tsx` visual-only.

### Batch C — Weekly chart + activity rail + shell data (STOP 4)
`weekly-momentum-chart.tsx` (hand-rolled SVG: category lines + dashed projection + caption + "Open in Library →"; reduced-motion). `activity-rail.tsx` (from `getRecentActivity`: type tag + title + delta + relative time). Wire the shell's real data: sidebar watched categories + counts (`getWatchedCategories`), bell unread badge (`getUnreadNotificationCount`), avatar initials + greeting name (from `getAppUser`).

### Batch D — Polish + bundle + gates + preview (STOP 5)
Light/dark parity, mobile-responsive (sidebar collapse, grid reflow, chart/rail stack), reduced-motion, a11y (nav landmarks, aria-current, bell aria-label, focus rings). typecheck/lint/build 4/4; per-route bundle (Server Components first; only sort-tabs + mobile-toggle as client islands). Push → preview.
**Verification split (the seam + gate mean the populated dashboard only renders for a signed-in session on preview):**
- **Automated (sandbox)**: anonymous `/app`→`/login` redirect (HTTP), build green, the data layer (foreground tsx probe: each read helper returns Elena's rows, adapter maps a forum-source problem), typecheck/lint/build 4/4, slice-integrity diff.
- **Founder-run (preview, real login → Elena's data)**: pixel/visual fidelity vs page 1. The STOP-5 report MUST give the **preview URL** + an explicit **"check these against page 1"** list: (1) 4 KPIs 14/+27% · 3 · 28/50 · 7·3-unread; (2) sort tabs re-order, Momentum top-6 Stripe→Fly.io; (3) ProblemCard render + `/problems/[slug]` links (incl. a **forum badge** on a forum-source card); (4) weekly chart (lines + dashed projection + caption); (5) activity rail tags/times; (6) sidebar 7 categories + counts, active nav, bell unread=3; (7) light + dark parity; (8) mobile reflow. Greeting/date are dynamic (A3) — not pixel-matched.

---

## Slice-integrity manifest (expected diff)

- **NEW**: `apps/web/src/app/(app)/layout.tsx` + `dashboard/page.tsx`; `apps/web/src/components/app/**`; `apps/web/src/lib/app-user.ts`.
- **EDIT**: `apps/web/src/middleware.ts` (matcher +`/app/:path*`); `packages/db/src/queries.ts` + `index.ts` (read-only helpers); `CLAUDE.md` (§8 note). Possibly `@bristle/ui` (a `forum` source icon — **only if founder approves D6**).
- **UNCHANGED**: all Tier-3 auth files (`auth.ts`, `next-auth.d.ts`, onboarding); the slice-4.1 schema/seed/migration; `ProblemCardFull` logic (adapter wraps it). **0 new deps, 0 new env.**

## Risks & follow-ups

- **D6 / ProblemCard `forum` gap (RESOLVED — Option A, scoped tight)** — add a **`forum` icon + key only** to `@bristle/ui`; leave the inert `ph`/`gp` keys (the Tier-2 landing card may rely on them; the 4.x adapter never feeds them). `se→so`/`appstore→ap` mappings stand. Verify the rolled-up Stack Exchange label presents correctly; flag (don't broaden) if more than trivial.
- **TF-021** — re-point the problem cards from `/problems/[slug]` (public sample) to the authenticated detail in **slice 4.3** (a logged-in user shouldn't land on the blurred public sample long-term).
- **TF-022** — fully reconcile the canonical card's source vocabulary to the 4.1 registry (drop `ph`/`gp`; route the card's badge rendering through `resolveBadge` as the single source-of-truth) once the Tier-2 landing card's source usage is confirmed safe to change.
- **`getAppUser()` is the 5.5 flip point** — the swap from demo-user to real-session-user is a one-line change there; do not let any screen or helper bypass it.
- **Risk**: a charting dep sneaking in → mitigated (hand-rolled SVG, §9.5).

## Process-oddity carry-forwards

- **dev==prod single Supabase** — the seeded reads hit the same DB; verification reads are safe (read-only).
- **Sandbox can't run signed-in HTTP walks** → interactive verification (KPIs, sort, links rendering Elena's data) deferred to **preview with a real signup**; the anonymous `/app`→login redirect IS HTTP-verifiable locally.
- **Visual diff vs `Core_app.pdf` page 1** (light+dark) is founder-run; greeting/date are dynamic (A3) — not pixel-matched.
- `noUncheckedIndexedAccess`; Server Components first (defer client JS); HTTPS-token git push.
