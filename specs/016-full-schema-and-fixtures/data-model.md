# Data Model: Slice 4.1 (Full Schema + Fixtures)

Migration **0004**. Extends `problems`; adds **15 tables**. Notation: `→` FK; `*` nullable; `[lit]` seeded literal (not computed). Every column annotated with the screen it feeds.

## 1. `problems` — EXTEND (additive, non-breaking · D4/FR-030)

**Preserved (slice-004, do not touch):** `id, slug (uniq), title, category, momentum_pct, sparkline int[], top_quote, quote_source, sources text[], last_seen_at, created_at, embedding vector(1536)*`.

**Added (all nullable/defaulted):**
| Column | Type | Feeds |
|---|---|---|
| `synthesis` | text* | p2 Synthesis tab |
| `demand_status` | text* (`validated`/`trending`/`emerging`) | p2 badge, p3 Validated-demand facet, p6 scorecard |
| `momentum_bucket` | text* (`surging`/`climbing`/`flat`/`new`) | p3 Momentum facet (+100%/+25–99/flat/new) |
| `mention_count_60d` | int* | p2 "47 quotes", p3 Mentions col, p6 Mentions·60d |
| `first_seen_at` | timestamptz* | p2 "First seen Feb 6", p6 "time since first seen" |
| `updated_at` | timestamptz default now() | p2 "Updated 12m ago", p3 Updated col |
| `compare_card` | jsonb* (`CompareCardSchema`) | p6 qualitative scorecards + Bristle's Read [lit] |

Seed backfills the 4 existing rows with the new fields.

## 2. Problem-scoped child tables

### `problem_quotes` (p2 Evidence tab; p1/p2 top quote)
`id, problem_id→problems, author_handle, source_key (registry), engagement_value int, engagement_label text` (e.g. `reactions`/`pts`/`rep`/`stars`), `rating int*` (App Store stars), `quote_text, source_url, posted_at, is_wtp_signal bool, stated_price_usd int*, position int`.
Holds the **individual WTP prices** (rows where `is_wtp_signal` carry `stated_price_usd`). App-Store quotes use `rating` + null engagement; thread quotes use `engagement_value/label` + null rating (edge case in spec).

### `problem_sources` (p2 donut; p1/p3 badges)
`id, problem_id→, source_key (registry), quote_count int`. **Five live sources only** (D2 — no Product Hunt / Google Play). Hero: GitHub 20 / HN 13 / Stack Exchange 9 / App Store 3 / Forums 2 = 47. Page-2 header "**5 sources**"; Compare cell "**X of 5**".

### `existing_solutions` (p2 Solutions tab; p6 Existing-solutions row)
`id, problem_id→, name, price_range text, match_type text (direct/adjacent/partial), description, mention_count int, position int`. Hero: Hookdeck (direct, $25–499), Inngest (adjacent, Free–$300), Stripe quickstart (partial, Free), Roll-your-own (partial, ~$50) + 2 more = 6.

### `wtp_signals` (p2 WTP panel; p6 WTP cell) — 1 row/problem*
`id, problem_id→ (uniq), mention_count int, price_min_usd int, price_max_usd int, median_usd int, note text*`. Hero: 11, $20, $99, $60, note. Absent WTP = no row (distinct from zero — edge case).

### `problem_personas` (p2 Who's-complaining; p6 Personas)
`id, problem_id→, label, count int, percentage int*, position int`. Hero: Indie founders 22, Engineers 10–50 16, Agency 6, Other 3.

### `problem_frequency_points` (p1 sparkline source; p2 90-day chart · child table per D1, pipeline-written in 5.9)
`id, problem_id→, observed_on date, mention_count int, is_threshold_marker bool`. Hero: ~90 points, one flagged `Apr 16 · validation threshold`.

### `problem_related` (p2 Related problems · D8)
`id, problem_id→, related_problem_id→problems*, label, target_slug text*, position int`. Hero: 4 label-only links.

## 3. Catalog & dashboard

### `categories` (sidebar, facets, tints, weekly chart · D9)
`id, key text (uniq), label, tint_bg_key text, tint_fg_key text` (§4.1a token names), `problem_count int [lit]`, `is_custom bool default false`, `created_by_user_id→users*`, `momentum_series jsonb*` (`WeeklyMomentumSchema` per-cat points), `position int`. Seed: the 8 canonical keys with design counts.

### `dashboard_fixtures` (p1 weekly caption + greeting singletons · D7)
`id, user_id→users, key text, payload jsonb (WeeklyMomentumSchema)`. uniq `(user_id,key)`. One row `weekly_momentum`.

## 4. User-scoped tables (all → demo user · D5)

### `saved_collections` (p4 Kanban columns)
`id, user_id→, name, color text, position int`. uniq `(user_id,name)`. Seed: Next product, Q3 brief candidates, Read later, For Jules to review.

### `user_saved_problems` (p4 cards; p1 "saved 28/50")
`id, user_id→, problem_id→, collection_id→saved_collections*, position int`. uniq `(user_id,problem_id)`.

### `alert_rules` (p5 Active watch rules)
`id, user_id→, name, category_key text*, rule_type text (momentum/new/wtp/threshold), threshold int*, channels text[] (email/slack/webhook/in-app), enabled bool, fired_count int default 0, position int`. uniq `(user_id,name)`. Seed: Payments momentum>+200 (5 fired, on), Auth&SSO any-new (3, on), Devtools weekly-count>100 (1, on), AI/ML WTP>5 (0, **off**).

### `alert_notifications` (p5 feed)
`id, user_id→, type text (momentum/new/wtp/digest/threshold/weekly), title, body, problem_id→*, is_read bool default false, created_at`.

### `problem_activity_log` (p1 activity rail; p2 Activity tab)
`id, user_id→*` (null = global, e.g. "3 problems added in Auth&SSO"), `problem_id→*, type text (threshold_crossed/quotes_added/problem_added/saved), title, delta_label text*` (`+312%`/`NEW`/`SAVED`), `created_at`.

### `usage_meters` (p1 tiles; p4 "28 of 50")
`id, user_id→, metric text, used int, quota int*, delta_pct int*, secondary_label text*`. uniq `(user_id,metric)`. Seed: `saved_problems` 28/50, `categories` 7/?, `alerts` 4, `api_calls`, `new_mentions_24h` 14 Δ+27, `momentum_crossed_24h` 3, `alert_queue` 7 sec="3 unread".

## 5. The 15 fixtures (momentum-desc · FR-024)

| # | Slug | Title | Category | Momentum | Notes |
|---|---|---|---|---|---|
| 1 | `stripe-webhooks-vercel-cold-starts` | Stripe webhooks fail silently on Vercel cold starts | payments | +312% | **HERO — full depth** |
| 2 | `llm-streaming-cdn-buffering` | LLM streaming chokes through CDN buffering | ai-ml | +184% | p6 compare col |
| 3 | `expo-ota-ios-18-4` | Expo OTA updates silently fail on iOS 18.4 | mobile | +96% | p6 compare col |
| 4 | `pgvector-index-degradation-2m` | pgvector indexes degrade past 2M rows | devtools | +72% | p6 compare col |
| 5 | `oauth-refresh-google-sso` | OAuth refresh token rotation breaks Google SSO | auth-sso | +58% | |
| 6 | `flyio-wake-from-zero-p95` | Fly.io machine wake-from-zero hits 3.2s p95 | deployment | +41% | |
| 7 | `supabase-realtime-safari-18` | Supabase Realtime drops on Safari 18 | devtools | +37% | |
| 8 | `notion-api-bulk-write-throttle` | Notion API rate-limits silently throttle bulk writes | devtools | +29% | |
| 9 | `cursor-agent-multifile-context` | Cursor agent loses context on multi-file edits | ai-ml | +24% | |
| 10 | `astro-webhook-signature-mismatch` | Webhook signature mismatch on Astro endpoints | payments | +19% | |
| 11 | `stripe-connect-onboarding-422` | Stripe Connect onboarding 422 on test mode | payments | +12% | p7 palette |
| 12 | `ses-bounce-resend-dashboard` | SES bounce handling not surfaced in Resend dashboard | email | +11% | |
| 13 | `appstore-connect-phone-reverify` | App Store Connect login requires phone re-verification weekly | mobile | +8% | App-Store-rated quotes |
| 14 | `posthog-replay-mobile-sampling` | **[FILLER]** PostHog session replay drops mobile events under sampling | analytics | +15% | **Analytics coverage (A8)** |
| 15 | `vercel-build-cache-monorepo-miss` | **[FILLER]** Vercel build cache misses monorepo package changes | deployment | +6% | second filler, full row |

All 15 are equally fleshed at card level (FR-028): title, category, momentum_pct, sparkline, ≥1 top quote, source badges, demand_status, mention_count, first/updated timestamps. Fixtures 2–15 each get a representative handful of child rows; only the hero is exhaustively populated (p2).

## 6. Hero depth (Stripe webhooks · FR-025/SC-009)
`synthesis` (3 paras), `problem_sources` GitHub 20 / HN 13 / Stack Exchange 9 / App Store 3 / Forums 2 (= 47, **5 sources**, D2), `wtp_signals` 11·$20–99·med$60, `problem_quotes` ≥5 incl. ≥3 `is_wtp_signal` with prices + varied engagement, `problem_personas` 22/16/6/3, `problem_related` 4 label-only, `problem_frequency_points` 90-day + threshold marker, `existing_solutions` 6 with match types, `compare_card` JSON (scorecards + Bristle's Read = STRONGEST), `demand_status=validated`, `first_seen_at` = 94 days before "today".

## 7. Screen → entity trace (completeness, SC-008)
p1 Dashboard: `usage_meters` (tiles) · `categories` (sidebar+counts) · `problems`+`problem_sources`+`problem_quotes` (cards) · `dashboard_fixtures`+`categories.momentum_series` (weekly chart) · `problem_activity_log` (rail). p2 Detail: `problems`(synthesis/badges) · `problem_sources`(donut) · `wtp_signals`(panel) · `problem_personas` · `problem_related` · `problem_frequency_points` · `problem_quotes`(evidence) · `existing_solutions`. p3 Library: `problems`+`problem_sources` (table) · facets from `problems`(momentum_bucket/demand_status), `problem_sources`(source counts), `wtp_signals`/`existing_solutions` (signals). p4 Saved: `saved_collections`+`user_saved_problems`+`usage_meters`. p5 Alerts: `alert_notifications`+`alert_rules` (+delivery channels on rules). p6 Compare: `problems`+children (metrics) + `problems.compare_card` (scorecards/Bristle's Read). p7 Palette: queries over `problems`+`categories` + static actions (no new table). **Zero unmapped fields.**
