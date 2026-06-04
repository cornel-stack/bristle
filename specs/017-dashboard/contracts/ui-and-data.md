# Contracts: Routes, App-User Seam, Query Helpers, UI (Slice 4.2)

## 1. Route table

| Route | Kind | Auth gate | Notes |
|---|---|---|---|
| `/app` (or `/app/dashboard`) | Page (Server Component) | session required → `/login?callbackUrl=/app` | the dashboard |
| `app/(app)/layout.tsx` | Layout | `auth()` authoritative gate | the reusable shell wrapping 4.2–4.8 |
| (4.3–4.8 routes) | future | inherit the layout gate | content-only slices |

Middleware (`apps/web/src/middleware.ts`): `matcher` gains `"/app/:path*"` (cookie pre-check; absent → `/login?callbackUrl=<pathname>`). Unchanged cookie-only logic.

## 2. App-user seam — `apps/web/src/lib/app-user.ts` (A1/D1)

```text
getAppUser(): Promise<User>
  // THE single demo-vs-session decision. v1.0: getUserByEmail("demo@bristle.dev").
  // Tier 5.5: getUserByEmail(session.user.email). The demo-email literal lives ONLY here.
```
- The **layout** runs the auth gate (`auth()` → redirect) — WHETHER authenticated.
- `getAppUser()` resolves WHICH user's data. Every read helper takes `(await getAppUser()).id` — **no hardcoded id** elsewhere.

## 3. Read query helpers — `packages/db/src/queries.ts` (A6/D3) — all read-only

```text
getUsageMeters(userId): Promise<UsageMeter[]>
getWatchedCategories(userId): Promise<Category[]>     // watched_categories slugs → categories rows (label, count, tints), ordered
getRecentActivity(userId, limit=5): Promise<ProblemActivity[]>   // newest first
getWeeklyMomentum(userId): Promise<WeeklyMomentum | null>        // dashboard_fixtures key "weekly_momentum", parsed via WeeklyMomentumSchema
getUnreadNotificationCount(userId): Promise<number>             // alert_notifications where is_read=false
// reused: getDashboardProblems(): Promise<Problem[]>
```
Rules: no writes; JSON payloads (`weekly_momentum`) parsed through the shared Zod contract at the boundary (no `any` to the UI); exported from `packages/db/src/index.ts`.

## 4. Sort contract (D4)

`?sort = momentum | frequency | newest | wtp` (default `momentum`). The dashboard server-reads the param, sorts the 15 in-memory by the §data-model sort keys, slices top 6. `sort-tabs.tsx` (client) updates the URL only.

## 5. Component prop contracts (server unless **(client)**; §4 tokens; no hex; no localStorage)

| Component | Props | Notes |
|---|---|---|
| `app/(app)/layout.tsx` | `{ children }` | `auth()` gate → shell (sidebar + topbar + children) |
| `app-sidebar` | `{ user; categories; activePath }` | logo · ⌘K affordance (visual) · 5 nav links (active = `aria-current`) · watched categories + counts · Settings (pinned) |
| `sidebar-nav` **(client)** | `{ activePath }` | active-state from pathname; mobile-collapsible |
| `app-topbar` | `{ user; contextLabel; unreadCount }` | context label · search field (visual) · bell (badge=unread, aria-label) · avatar (initials) |
| `dashboard-header` | `{ name; meters }` | live greeting + date; data subhead (N/M from meters) |
| `kpi-card` | `{ label; value; delta?; quota?; secondary? }` | one of 4; includes `kpi-sparkline` |
| `kpi-sparkline` | `{ variant }` | **decorative** fixed shape (D7) |
| `sort-tabs` **(client)** | `{ active }` | updates `?sort=`; 4 tabs |
| `problem-grid` | `{ problems }` | top 6; each `ProblemCardFull` (via adapter) wrapped in `<Link href={"/problems/"+slug}>` |
| `weekly-momentum-chart` | `{ data: WeeklyMomentum }` | hand-rolled SVG: series + dashed projection + caption + "Open in Library →"; reduced-motion |
| `activity-rail` | `{ entries }` | type tag + title + delta + relative time |
| `header-actions` | `{}` | Filter / Export digest / + Add category — visual-only |
| `problem-card-adapter` (fn) | `(p: Problem) => ProblemCardFullProps` | routes source keys via `resolveBadge` (A7); see data-model §3 |

Client islands: **only** `sidebar-nav` (mobile toggle / active state) + `sort-tabs`. Everything else Server Components. Theme via existing `next-themes`.

## 6. Acceptance trace
SC-001 gate · SC-002 KPIs from meters · SC-003 sort + Momentum top6 · SC-004 ProblemCard + slug link · SC-005 weekly chart · SC-006 activity rail · SC-007 sidebar categories + nav + bell · SC-008 page-1 light/dark + responsive + Lighthouse 90+ · SC-009 no schema/seed/migration; apps/web + read-only db helpers · SC-010 reusable shell.
