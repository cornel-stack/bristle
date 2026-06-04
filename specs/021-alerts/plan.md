# Implementation Plan: Alerts — Slice 4.6

**Branch**: `021-alerts` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

> **DON'T-IMPLEMENT** until green-lit. Fast cadence: on green-light, self-run all batches (one commit per task, gates green per task), report at close.

## Summary

Alerts at `/app/alerts` — fifth Tier-4 screen, **second write slice**, inheriting the **slice-4.5 ephemeral model** verbatim. A Server Component resolves the `getAppUser()` user, reads the rules + notifications through one read-only `packages/db` helper, and hands them to **one client island** holding them as in-memory state. A primary **notification feed** (grouped by day, type-filtered, unread-marked, problem-linked) sits left; a **watch-rules rail** (toggles + fired-counts) + **delivery channels** (visual) sit right. Interactions — filter, mark-read / mark-all, toggle rule, create rule — mutate **client state only** (no DB write / no server action / no storage; reload resets). No schema/seed change.

## Constitution Check
RSC page + one client island; tokens/§4.1a tints; **ephemeral = in-memory state, no storage (§9.6)**; no new dep; voice; build-exactly-the-slice (delivery/manage deferred); **wrap-not-mutate** (no shared/public leaf edited — feed/rule/notification components are new in-app). **PASS.**

## Architecture

### Route + read
`app/app/alerts/page.tsx` — async RSC in the gated shell (`/app/:path*` covers it — no middleware/auth change). `getAppUser()` → `getAlertsData(user.id)` → `<AlertsView initial={…} />`.

### Read helper (the one DB delta, read-only)
`getAlertsData(userId): Promise<{ rules: AlertRule[]; notifications: AlertNotificationVM[] }>` — `alert_rules` (by user, order `position`) + `alert_notifications` (by user, newest-first) **left-joined to `problems`** so each notification carries its `slug` (null for digest/weekly). `AlertNotificationVM = AlertNotification & { slug: string | null }`. Read-only. (Reuses nothing to write; `getUnreadNotificationCount` already exists for the top-bar bell but the feed needs the rows.)

### Ephemeral write model (inherited, A1/4.5)
`AlertsView` is the one client island (`"use client"`), seeded once from `initial` into `useState({ rules, notifications, filter })`. Transitions: `setFilter`, `markRead(id)`, `markAllRead()`, `toggleRule(id)`, `addRule(form)`. **No server action, no fetch, no DB write, no storage.** Tier 5.5 swaps these for real per-user write server actions (TF-028).

### Feed (FR-002/005)
`alert-feed.tsx` — groups the (filtered) notifications by **Today / Yesterday / Earlier** (computed from now-relative `createdAt`, TF-023); each `notification-card.tsx` = type badge (momentum/new/wtp/digest/weekly/threshold) + unread dot + title + body + `relativeTime` + an "Open" link to `/app/problems/[slug]` when `slug` present. `filter-tabs.tsx` (client) — All / Unread / Momentum / New problems / Threshold reached, each filtering by type (Threshold reached = `threshold` + `weekly`; New problems = `new`; Unread = `!isRead`), with live counts; **client `useState`, not URL** (the screen is already a stateful island — A4).

### Rail (FR-003)
`watch-rule-row.tsx` — category-tinted name + condition + fired-count ("New" when `firedCount === 0` && never enabled→ actually `firedCount === 0` → "New") + an on/off **toggle** (accessible switch). `delivery-panel.tsx` — Email / Slack / Webhook / In-app with on/off badges, **visual-only**.

### New-rule form (FR-008)
`new-rule-form.tsx` — opened by the header "New rule": category (8) + condition-type (momentum / new / threshold / wtp) + threshold (numeric, hidden for "new"; unit suffix per type — `%` / count / count). On submit → `addRule` derives the name `"<Category> · <condition>"` and appends to rules state. Accessible form.

### Header (FR-004)
`alerts-header.tsx` — "Alerts" + "N unread · M in the last 7 days · K watch rules" (real, from state) + Mark all read + New rule (accent). Watch rules / Manage rules buttons render visual-only.

### Bundle / motion
One client island tree (`AlertsView`). Reduced-motion via the global reset. Tokens → light/dark. Feed + rail stack on mobile.

## Batching (self-run; one commit per task, gates green per task)
- **Batch 0** — route + `getAlertsData` helper + `AlertsView` scaffold (hydrate, read-only render) + header. Gate: anon `/app/alerts` → 307; tsx probe (4 rules, 7 notifs/3 unread, slugs joined); typecheck/lint/build.
- **Batch A** — feed (day-group + notification card + filter tabs) + rail (rule rows + toggles + delivery panel). Gate: build; feed + rail render the seed; Open links resolve.
- **Batch B** — ephemeral interactions: filter, mark-read / mark-all, toggle rule, new-rule form. Gate: build + a11y; reload resets.
- **Batch C** — polish + a11y (toggle switch roles, form labels, focus, menu/Escape) + §8 note (the second-write-slice inheriting 4.5; TF-028) + gates + preview.

## Slice-integrity manifest
- **NEW**: `app/app/alerts/page.tsx`; `components/app/alerts/**` (alerts-view client, alerts-header, alert-feed, notification-card, filter-tabs, watch-rule-row, new-rule-form, delivery-panel); `packages/db` `getAlertsData` + `AlertNotificationVM` (read-only).
- **EDIT**: `packages/db` queries/index; `CLAUDE.md` §8 + pointer.
- **UNCHANGED**: Tier-3 auth + middleware; 4.1 schema/seed; 4.2 shell/seam/registry; 4.3 detail; 4.5 saved; **all shared/public leaves**; public routes. **No schema/seed/migration; no DB write; no new dep.**

## Risks & follow-ups
- **TF-028** (Tier-5.5: ephemeral alert transitions → real per-user write server actions) — same follow-up as 4.5.
- **Comp divergence (minor, mine to handle):** now-relative day labels (Today/Yesterday/Earlier) + relative times instead of the comp's fixed "MAY 12 · 09:14" (which would drift under TF-023). Flag at close.
- **Rule edit/delete deferred** (A3) — "Manage rules" deeper view is out of scope.

## Process oddities
Sandbox-verifiable: anon `/app/alerts` → 307; build; tsx probe of `getAlertsData` over the seed; the **no-write grep** + integrity diff. Ephemeral interactions (filter/mark/toggle/new) are founder-run on preview (client state), but reload-reset is architecturally certain (RSC re-read + `useState` hydrate, no persistence — as proven for 4.5). HTTPS-token push.

### Founder preview checklist (page 5)
1. Header: "3 unread · 7 in the last 7 days · 4 watch rules" + Mark all read + New rule.
2. Feed: 7 items grouped by day, type badges, **3 unread** marked, bodies, now-relative times, "Open" → `/app/problems/[slug]` (digest/weekly unlinked).
3. Filter tabs (All/Unread/Momentum/New problems/Threshold reached) narrow the feed.
4. Rail: 4 rules (category · condition · toggle · fired 5/3/1/**New**) + DELIVERY (Email/Slack/Webhook/In-app, visual).
5. Mark one read → marker + count drop; Mark all read → 0 unread; toggle a rule; New rule → appears with derived name.
6. **Reload → resets to the seeded baseline** (ephemeral).
7. Keyboard; light/dark; mobile (feed + rail stack).
