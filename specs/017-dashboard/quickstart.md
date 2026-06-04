# Quickstart: Slice 4.2 (Dashboard + App Shell)

Read-only UI over the slice-4.1 seed. No new env, no new deps, no schema/seed change.

## 1. App shell + auth gate + seam (Batch 0 / STOP 1)
```bash
# lib/app-user.ts: getAppUser() (v1.0 → demo@bristle.dev; the ONLY demo-vs-session point)
# app/(app)/layout.tsx: await auth() → redirect if no session; render sidebar + topbar + {children}
# middleware.ts: matcher += "/app/:path*"
pnpm --filter web typecheck && pnpm --filter web lint
# Verify (HTTP, no DB session needed): anonymous GET /app → 307 /login?callbackUrl=/app
```

## 2. Read helpers + card adapter (Batch A / STOP 2)
```bash
# packages/db: getUsageMeters / getWatchedCategories / getRecentActivity / getWeeklyMomentum
#   / getUnreadNotificationCount (read-only, parse weekly_momentum via WeeklyMomentumSchema) + export
# components/app/problem-card-adapter.ts: Problem → ProblemCardFullProps, source keys via resolveBadge
pnpm typecheck && pnpm lint
# Foreground tsx probe (demo user id from getUserByEmail): each helper returns Elena's rows;
#   adapter maps a forum-source problem (D6 decision applied).
```

## 3. Dashboard regions (Batches B + C / STOPs 3–4)
```bash
# B: dashboard-header, 4 KPI cards, sort-tabs (?sort=), problem-grid (top 6 + slug links), header-actions
# C: weekly-momentum-chart (SVG), activity-rail, wire sidebar categories + bell unread + avatar/greeting
pnpm build   # confirm the route compiles; Server Components first
```

## 4. Polish + gates + preview (Batch D / STOP 5)
```bash
pnpm typecheck && pnpm lint && pnpm build           # 4/4
# Per-route First Load JS for /app — Server Components first; islands = sort-tabs + sidebar-nav only.
# Push → Vercel preview. INTERACTIVE verification on preview (sandbox can't hold a signed-in session):
#   sign up a real account → reach /app → see Elena's data: 4 KPIs (14/+27%, 3, 28/50, 7·3-unread),
#   sort tabs re-order (Momentum top6 Stripe→Fly.io), cards link to /problems/[slug], weekly chart,
#   activity rail, sidebar 7 categories + counts, bell unread = 3.
# Visual diff vs Core_app.pdf page 1 (light + dark) — founder-run; greeting/date dynamic (A3).
```

## 5. Done-when
SC-001…010: /app gated + shell + dashboard; KPIs from meters; sort works (Momentum top6); ProblemCard + slug links; weekly chart; activity rail; sidebar categories + nav active + bell unread; page-1 light/dark + responsive + Lighthouse 90+; no schema/seed/migration (diff = apps/web + read-only packages/db helpers); shell reusable.

## 6. Process oddities
dev==prod single Supabase (read-only here); sandbox can't run signed-in walks → interactive checks on preview with a real signup; the anonymous `/app`→login redirect is locally HTTP-verifiable; chart is hand-rolled SVG (no charting dep, §9.5); `getAppUser()` is the 5.5 flip point.
