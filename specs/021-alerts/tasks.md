# Tasks: Alerts — Slice 4.6

**Feature**: `specs/021-alerts/` | **Branch**: `021-alerts` | **Inputs**: spec.md · plan.md

> ## ⛔ DON'T-IMPLEMENT until green-lit. Fast cadence: self-run all batches, one commit per task, gates green per task; report at close. Second write slice — **inherits the 4.5 ephemeral model** (in-memory state, no DB write / no server action / no storage; reload resets).

## Execution model
4 batches, **~16 tasks**. Read-only DB; all writes in-memory (ephemeral).

| Batch | Theme | Tasks |
|---|---|---|
| 0 | Route + read helper + view scaffold + header | T001–T005 |
| A | Feed (cards + filter tabs) + rail (rules + delivery) | T006–T010 |
| B | Ephemeral interactions (filter / mark / toggle / new rule) | T011–T013 |
| C | Polish + a11y + §8 + gates + preview | T014–T016 |

### Count cross-check
New route 1 · `components/app/alerts/**` ~8 (alerts-view island, alerts-header, alert-feed, notification-card, filter-tabs, watch-rule-row, new-rule-form, delivery-panel) · read-only DB helper 1 (`getAlertsData`) · 0 deps/env · 0 schema/seed · client islands = 1 tree.

## Standing constraints (every task)
Ephemeral writes = **in-memory React state, no DB write, no server action, no storage** (reload resets — grep-clean like 4.5). `getAppUser` used as-is (user-scoped). New in-app components — **never edit a shared/public leaf** (empty-diff). Now-relative times (TF-023; day grouping Today/Yesterday/Earlier + relativeTime). Real counts. 5-source/registry + category tints reused. RSC-first; one client island. **No schema/seed change** — a data-only re-anchor is flagged; a new field STOPs (none needed — A2 confirmed the seed supports the design).

---

## Batch 0 — Route + read helper + scaffold + header
- [ ] **T001** Add read-only `getAlertsData(userId): Promise<{ rules: AlertRule[]; notifications: AlertNotificationVM[] }>` to `packages/db/src/queries.ts` (`alert_rules` ordered by `position` + `alert_notifications` newest-first **left-joined to `problems`** for `slug`; `AlertNotificationVM = AlertNotification & { slug: string | null }`). Read-only.
- [ ] **T002** Export `getAlertsData` + `AlertNotificationVM` from `index.ts`. (Sequential after T001.)
- [ ] **T003** Create `apps/web/src/app/app/alerts/page.tsx` — RSC: `getAppUser()` → `getAlertsData(user.id)` → `<AlertsView initial />` in the shell.
- [ ] **T004** Create `apps/web/src/components/app/alerts/alerts-view.tsx` (`"use client"`) — hydrate `initial` into `useState({rules, notifications, filter})`; read-only render this batch (interactions Batch B).
- [ ] **T005** Create `apps/web/src/components/app/alerts/alerts-header.tsx` — "Alerts" + "N unread · M in last 7 days · K watch rules" (real, from state) + Mark all read + New rule + visual Watch/Manage buttons.
- [ ] **STOP-0 gate**: anon `/app/alerts` → 307; tsx probe of `getAlertsData` (4 rules, 7 notifs / 3 unread, slugs joined, digest/weekly null slug); typecheck/lint/build.

## Batch A — Feed + rail
- [ ] **T006** [P] `notification-card.tsx` — type badge + unread dot + title + body + `relativeTime` + "Open" → `/app/problems/[slug]` (when slug; unlinked otherwise).
- [ ] **T007** `alert-feed.tsx` — group the (filtered) notifications by Today / Yesterday / Earlier (now-relative); render cards.
- [ ] **T008** [P] `filter-tabs.tsx` (client) — All / Unread / Momentum / New problems / Threshold reached + live counts; sets the view filter.
- [ ] **T009** [P] `watch-rule-row.tsx` — category·condition name + fired-count ("New" at 0) + on/off toggle (accessible switch); `delivery-panel.tsx` — Email/Slack/Webhook/In-app on/off (visual-only).
- [ ] **T010** Wire feed + filter tabs + rail (rules + delivery) into `alerts-view`. **Gate**: feed (7, grouped, 3 unread) + rail (4 rules, 5/3/1/New) render; Open links resolve; build.

## Batch B — Ephemeral interactions
- [ ] **T011** Filter (tabs narrow the feed) + mark-read (per-notification) + mark-all-read → in-memory; unread marker + header count update.
- [ ] **T012** Toggle rule on/off → in-memory.
- [ ] **T013** `new-rule-form.tsx` + `addRule` — category + condition-type + threshold (hidden for "new"; unit per type); derives `"<Category> · <condition>"`; appends to rules state. **Gate**: each interaction mutates in-session; reload resets; build + keyboard-operable.

## Batch C — Polish + a11y + §8 + gates + preview
- [ ] **T014** Light/dark + responsive (feed + rail stack on mobile).
- [ ] **T015** A11y — toggle switch roles (`role="switch"`/`aria-checked` or a labeled checkbox), form labels, filter tabs keyboard, focus rings, the new-rule form/menu focus + Escape.
- [ ] **T016** `CLAUDE.md` §8 note (second write slice; inherits the 4.5 ephemeral model verbatim; `getAlertsData`; TF-028) — doc-only. Gates 4/4; push → preview. **Slice-close report**: gates, invariants (no DB write grep, empty-diff, no schema/seed), diff scope, `getAlertsData` probe, preview URL + the page-5 checklist (incl. reload-resets + the filter/mark/toggle/new walk).

## Slice-integrity manifest
NEW: `app/app/alerts/page.tsx`; `components/app/alerts/**`; `packages/db` `getAlertsData` + `AlertNotificationVM`. EDIT: `packages/db` queries/index; `CLAUDE.md` §8. UNCHANGED: Tier-3 auth+middleware; 4.1 schema/seed; 4.2 shell/seam/registry; 4.3 detail; 4.5 saved; shared/public leaves; public routes.

## Risks & follow-ups
TF-028 (Tier-5.5 write seam — shared with 4.5). Comp divergence (mine): now-relative day labels + relative times vs the comp's fixed dates/clock-times. Rule edit/delete deferred (A3).
