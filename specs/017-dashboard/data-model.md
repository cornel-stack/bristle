# Data Model: Slice 4.2 (Dashboard)

**Read-only.** No new tables/columns. Every region reads slice-4.1 rows via a `packages/db` helper, scoped to the `getAppUser()`-resolved id. This documents the read sources + the source-key adapter.

## 1. Region → read source (page 1)

| Region | Read helper (`packages/db`) | Slice-4.1 source |
|---|---|---|
| Greeting name + avatar initials | `getAppUser()` | `users` (demo) |
| Subhead "N mentions… M crossed" | `getUsageMeters(uid)` | `usage_meters` (`new_mentions_24h`, `momentum_crossed_24h`) |
| KPI: New mentions/24h (14, +27%) | `getUsageMeters` | `usage_meters.new_mentions_24h` (used, delta_pct) |
| KPI: Crossed momentum (3) | `getUsageMeters` | `usage_meters.momentum_crossed_24h` |
| KPI: Saved (28/50) | `getUsageMeters` | `usage_meters.saved_problems` (used/quota) |
| KPI: Alert queue (7, 3 unread) | `getUsageMeters` + `getUnreadNotificationCount` | `usage_meters.alert_queue` + `alert_notifications` |
| KPI sparklines | — (decorative, D7) | none — fixed shapes |
| Sort tabs + "87 match · 14d" | — | `87` literal (D8); sort over the grid |
| Problem grid (top 6) | `getDashboardProblems()` → adapter | `problems` (+ `problem_sources` for badges) |
| Weekly chart | `getWeeklyMomentum(uid)` | `dashboard_fixtures` key `weekly_momentum` (parsed `WeeklyMomentumSchema`) |
| Activity rail | `getRecentActivity(uid)` | `problem_activity_log` |
| Sidebar watched categories + counts | `getWatchedCategories(uid)` | `users.watched_categories` → `categories` (label, count, tints) |
| Bell unread badge | `getUnreadNotificationCount(uid)` | `alert_notifications` where `is_read=false` |
| Nav active state | current pathname | — |

## 2. Grid sort keys (D4 / A8)

| Tab | Order by (desc) | Default top 6 |
|---|---|---|
| Momentum (default) | `momentum_pct` | Stripe, LLM, Expo, pgvector, OAuth, Fly.io |
| Frequency | `mention_count_60d` | (re-orders by 60-day mentions) |
| Newest | `first_seen_at` | (most-recently first-seen) |
| Willingness-to-pay | WTP mention count, then median | (WTP-signal problems first) |

`getDashboardProblems()` returns all 15; the page sorts in-memory + slices top 6.

## 3. Source-key adapter (A7 / D6) — `problem-card-adapter.ts`

DB `Problem` row → `ProblemCardFullProps`. Source keys route through `@bristle/shared` `resolveBadge` (single badge source-of-truth); category → `CategoryColor` is 1:1 (the 8 keys match).

| 4.1 key | `resolveBadge` badge | ProblemCard `SourceKey` | Note |
|---|---|---|---|
| `gh` | github | `gh` | |
| `hn` | hackernews | `hn` | |
| `so` | stackexchange | `so` | |
| `se` | stackexchange | `so` | SO/SE collapse to one badge |
| `appstore` | appstore | `ap` | |
| `forum` | forums | **`forum`** | ⚠️ **no card mark yet — D6** (add icon, or fallback omit) |

Adapter maps: `title, category (→categoryColor), momentumPct (→momentum), sparkline, topQuote, quoteSource (→SourceKey), sources (→SourceKey[] via the table), lastSeenAt (→lastSeenIso)`. Problems carry the per-row `sources` array (slice-004 column) + `problem_sources` rows; the card shows the badge set.

## 4. Key entities (read-only, from 4.1)

`Problem`, `Category`, `UsageMeter`, `ProblemActivity`, `DashboardFixture` (`weekly_momentum`), `AlertNotification` (count only), `User` (demo). All `$inferSelect` types already exported from `@bristle/db` (slice 4.1).

## 5. Completeness (SC trace)
Every page-1 value → a region row in §1 → a read helper → a 4.1 source. Zero values require new data. The only data-shaped gaps are **intentional**: KPI sparklines (decorative, D7) and "87 match" (literal, D8).
