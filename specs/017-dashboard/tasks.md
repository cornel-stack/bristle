# Tasks: Dashboard + Authenticated App Shell (Slice 4.2)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/ui-and-data.md](./contracts/ui-and-data.md) · **Quickstart**: [quickstart.md](./quickstart.md)

**Branch**: `017-dashboard` · **Base**: `462a180` (main, slice-4.1 merged)

**Status**: DRAFT — held for founder shape-approval. **DON'T-IMPLEMENT guard active**: do not `/speckit.implement`, do not write code, do not commit tasks.md until explicit go (established pattern, slices 013–016). One commit per task (CLAUDE.md §7).

---

## Task count (re-verify at STOP 5 — count-drift lesson)

**25 tasks** — 24 commit-producing + 1 doc (§8). Five batches / five STOPs.

| Batch | STOP | Tasks | Count | Theme |
|---|---|---|---|---|
| 0 | 1 | T001–T006 | 6 | App shell + auth gate + `getAppUser()` seam |
| A | 2 | T007–T011 | 5 | Read helpers + card adapter + forum icon |
| B | 3 | T012–T017 | 6 | Header + KPIs + grid + sort |
| C | 4 | T018–T021 | 4 | Weekly chart + activity rail + shell data |
| D | 5 | T022–T025 | 4 | Polish + gates + preview + §8 note |

## Count cross-check matrix (re-assert at STOP 5)

| Metric | Count |
|---|---|
| New route group | **1** (`app/(app)/`) |
| New read query helpers (`packages/db`) | **5** (usage meters, watched cats, activity, weekly momentum, unread count) |
| Card adapter | **1** (`problem-card-adapter.ts`, via `resolveBadge`) |
| Canonical-card edit | **1** (add `forum` icon/key — D6 scoped tight) |
| Client islands | **2** (`sort-tabs`, `sidebar-nav`) |
| New deps / new env vars | **0 / 0** |
| Schema / migration / seed/fixture changes | **0 / 0 / 0** |
| `ProblemCardFull` logic change | **0** (adapter wraps; only +forum icon) |

---

## ⚠️ Standing rules (read before each batch)

- **`getAppUser()` seam (T001) is the 5.5 flip point.** ONE function holds the demo-vs-session decision; for v1.0 it returns the demo user (`getUserByEmail("demo@bristle.dev")`) — **the demo-email literal lives ONLY here**. It resolves **WHICH** user's data, NOT **WHETHER** authenticated (the layout's `auth()` gate does that). **Every read helper takes the seam-resolved id — never a hardcoded id.**
- **D6 — forum icon scoped tight (T007).** ADD `forum` only; **leave the inert `ph`/`gp` keys** (the Tier-2 landing card may rely on them; the 4.x adapter never feeds them). `se→so` + `appstore→ap` mappings stand. **Verify** the rolled-up Stack Exchange badge label presents correctly — **flag if more than trivial, do NOT broaden the card edit.**
- **§9.5 — no charting dependency (T018).** The weekly chart is **hand-rolled SVG** (reuse the `Sparkline`/`buildSparklinePath` pattern). No recharts/visx.
- **KPI sparklines are DECORATIVE (T013).** Fixed, deterministic shapes — not random, not data-derived, no new column.
- **RSC-first.** Only `sort-tabs` + `sidebar-nav` are client islands; everything else is a Server Component. No localStorage (§9.6).

---

## Phase 0 — App shell + auth gate + seam (STOP 1) · T001–T006

- [X] T001 [P] [US1] Create `apps/web/src/lib/app-user.ts` — `getAppUser(): Promise<User>`, the **single demo-vs-session seam** (v1.0 → `getUserByEmail("demo@bristle.dev")`; the demo-email literal lives ONLY here; Tier-5.5 one-line flip to the session user). Resolves WHICH user, not WHETHER. (dep: none)
- [X] T002 [P] [US1] Edit `apps/web/src/middleware.ts` — add `"/app/:path*"` to `config.matcher` (cookie-presence pre-check; absent → `/login?callbackUrl=<pathname>`). One line; cookie-gate logic unchanged. (dep: none)
- [X] T003 [P] [US1] Create `apps/web/src/components/app/sidebar-nav.tsx` (**client**) — the 5 nav links (Dashboard/Library/Saved/Alerts/Compare) with active state from `usePathname()` (`aria-current`), and the mobile sidebar toggle. §4 tokens. (dep: none)
- [X] T004 [P] [US1] Create `apps/web/src/components/app/app-sidebar.tsx` (server) — Bristle logo; ⌘K search affordance (visual only); `<SidebarNav>`; a CATEGORIES section (props-driven, **placeholder** until T021); Settings link pinned at bottom. Props `{ user; categories; activePath }`. (dep: T003)
- [X] T005 [P] [US1] Create `apps/web/src/components/app/app-topbar.tsx` (server) — context label ("Today"); search field (visual only); notification bell (badge from `unreadCount` prop, **placeholder** until T021, `aria-label`); avatar (user initials). Props `{ user; contextLabel; unreadCount }`. (dep: none)
- [X] T006 [US1] Create `apps/web/src/app/(app)/layout.tsx` (server) — authoritative `await auth()` gate (no session → `redirect("/login?callbackUrl=/app")`); resolve `getAppUser()`; render `<AppSidebar>` + `<AppTopbar>` + `{children}` on `surface-canvas`; light/dark via existing tokens. (dep: T001, T004, T005)

**STOP 1 gate** — local prod server: anonymous `GET /app` → **307 `/login?callbackUrl=/app`** (HTTP-verifiable, no DB session). `typecheck`/`lint` clean. The shell is a reusable layout (a future `/app/*` route inherits it). No Tier-3 auth file changed. Re-assert the seam guards.

---

## Phase A — Read helpers + card adapter + forum icon (STOP 2) · T007–T011

- [ ] T007 [P] [US1] Edit `@bristle/ui` `packages/ui/src/source-icons/index.tsx` — **add `forum` (Discourse)** to `SourceKey`, `ICONS` (a new mark), and `SOURCE_LABELS` ("Forums"). **D6 scoped tight: forum ONLY; leave `ph`/`gp` inert.** Verify the existing `so` ("Stack Overflow") label/icon still reads correctly as the rolled-up Stack Exchange badge — **if aligning it is more than trivial, FLAG it (do not broaden).** (dep: none)
- [ ] T008 [US1] Add 5 **read-only** helpers to `packages/db/src/queries.ts`: `getUsageMeters(userId)`, `getWatchedCategories(userId)` (resolve `users.watched_categories` slugs → `categories` rows w/ label+count+tint keys, ordered by `position`), `getRecentActivity(userId, limit=5)` (newest first), `getWeeklyMomentum(userId)` (read `dashboard_fixtures` key `weekly_momentum`, **parse via `WeeklyMomentumSchema`** → `WeeklyMomentum | null`), `getUnreadNotificationCount(userId)` (`alert_notifications` `is_read=false`). No writes. (dep: STOP 1)
- [ ] T009 [US1] Re-export the 5 helpers (+ any inferred types) from `packages/db/src/index.ts`. (dep: T008)
- [ ] T010 [P] [US1] Create `apps/web/src/components/app/problem-card-adapter.ts` — `(p: Problem) => ProblemCardFullProps`; category → `CategoryColor` (1:1); source keys routed through `@bristle/shared` `resolveBadge` → ProblemCard `SourceKey` (`se→so`, `appstore→ap`, `forum→forum`). **No parallel source→badge mapping.** (dep: T007)
- [ ] T011 [US1] **STOP-2 probe** (foreground `tsx`, demo id via `getUserByEmail`): each of the 5 helpers returns Elena's rows (meters 7, watched categories 7, activity 5, weekly_momentum parses, unread=3); the adapter maps a **forum-source problem** (e.g. the hero) to props with a forum badge. `typecheck`/`lint`. (dep: T009, T010)

**STOP 2 gate** — 5 read helpers return Elena's data; the card adapter renders a forum badge via `resolveBadge`; forum-only card edit (ph/gp untouched); SE-label verified-or-flagged. typecheck/lint clean.

---

## Phase B — Dashboard header + KPIs + grid + sort (STOP 3) · T012–T017

All under `apps/web/src/components/app/dashboard/`. §4 tokens; no hex.

- [ ] T012 [P] [US1] Create `dashboard-header.tsx` (server) — **LIVE** time-of-day greeting ("Good morning/afternoon/evening, {firstName}.") + date line from the clock; data subhead "N new mentions across your 7 categories since yesterday. M problems crossed momentum thresholds." (N/M from `getUsageMeters`). Props `{ name; meters }`. (dep: STOP 2)
- [ ] T013 [P] [US1] Create `kpi-sparkline.tsx` + `kpi-card.tsx` (server) — `kpi-card` props `{ label; value; delta?; quota?; secondary? }`; `kpi-sparkline` renders a **DECORATIVE fixed deterministic** shape per variant (NOT random, NOT data). (dep: STOP 2)
- [ ] T014 [P] [US2] Create `sort-tabs.tsx` (**client**) — Momentum / Frequency / Newest / Willingness-to-pay; updates `?sort=` (default `momentum`) via `next/navigation`; active tab styled. (dep: STOP 2)
- [ ] T015 [US1] Create `problem-grid.tsx` (server) — props `{ problems }`; render the **top 6** via the active sort (in-memory sort of the 15 by `momentum_pct`/`mention_count_60d`/`first_seen_at`/WTP), each `ProblemCardFull` (via the T010 adapter) wrapped in `<Link href={"/problems/" + slug}>`. (dep: T010)
- [ ] T016 [P] [US1] Create `header-actions.tsx` (server) — Filter / Export digest / + Add category buttons per design, **visual-only** (non-functional this slice). (dep: STOP 2)
- [ ] T017 [US1] Create `apps/web/src/app/(app)/page.tsx` (server, `/app`) — read `getAppUser()` → `getUsageMeters` + `getDashboardProblems()`; compose `<DashboardHeader>`, the 4 `<KpiCard>`s, the `<SortTabs>` + "All 7 · **87 problems match · last 14d**" (literal) line, `<ProblemGrid sort=?>`, `<HeaderActions>`. `metadata` noindex. (dep: T012, T013, T014, T015, T016)

**STOP 3 gate** — `/app` renders the header (live greeting + data subhead), 4 KPIs (14/+27% · 3 · 28/50 · 7·3-unread), the sort line + literal match count, and the 6-card grid (Momentum top-6 Stripe→Fly.io, each linking to `/problems/[slug]`). Sort tabs re-order. typecheck/lint. (Interactive confirm at STOP 5 preview.)

---

## Phase C — Weekly chart + activity rail + shell data (STOP 4) · T018–T021

- [ ] T018 [P] [US1] Create `dashboard/weekly-momentum-chart.tsx` (server) — **HAND-ROLLED SVG (no charting dep, §9.5)**, reusing the `Sparkline`/`buildSparklinePath` pattern: per-category polylines + a **dashed projection** polyline + the editorial caption + an "Open in Library →" link (target: the Library route, 4.4). Reduced-motion (static). Props `{ data: WeeklyMomentum }`. (dep: STOP 2)
- [ ] T019 [P] [US1] Create `dashboard/activity-rail.tsx` (server) — from `getRecentActivity`: each entry's type tag (threshold / new / saved), title, delta label, relative time. Props `{ entries }`. (dep: STOP 2)
- [ ] T020 [US1] Wire `<WeeklyMomentumChart>` (from `getWeeklyMomentum`) + `<ActivityRail>` (from `getRecentActivity`) into `app/(app)/page.tsx`. (dep: T017, T018, T019)
- [ ] T021 [US1] Wire the **shell's real data**: `app/(app)/layout.tsx` passes `getWatchedCategories()` → `<AppSidebar>` (7 categories + counts + tints), `getUnreadNotificationCount()` → `<AppTopbar>` bell badge, and the `getAppUser()` name/initials → greeting + avatar. (dep: T006, T008)

**STOP 4 gate** — weekly chart renders the seeded series + dashed projection + caption; activity rail renders the 5 seeded entries with tags + relative times; sidebar lists the 7 watched categories with counts, the bell shows unread = 3. typecheck/lint.

---

## Phase D — Polish + gates + preview (STOP 5) · T022–T025

- [ ] T022 [US1] Polish pass: light/dark parity (every region), mobile-responsive (sidebar collapses to a toggle, grid reflows to 1 col, chart + rail stack), reduced-motion, a11y (nav landmark + `aria-current`, bell `aria-label`, visible focus rings, the grid links keyboard-reachable). (dep: STOP 4)
- [ ] T023 Add a `CLAUDE.md` §8 **documentation note** — the `/app` shell + `getAppUser()` seam convention (the 5.5 flip point) + the TF-021/TF-022 pointers. **GUARDRAIL: documentation note ONLY — no §3/§4/§9 rule change.** (dep: none — independent) **[doc-only]**
- [ ] T024 **Local gate + data probe**: `pnpm typecheck && pnpm lint && pnpm build` (4/4); per-route First Load JS for `/app` (RSC-first; islands = `sort-tabs` + `sidebar-nav` only); foreground probe re-confirms the read layer; **automated checks**: anonymous `/app` → 307 `/login`; slice-integrity diff matches the manifest. (dep: T022)
- [ ] T025 [US1] Push branch → Vercel preview. **STOP-5 report MUST include the preview URL + the "check these against page 1" list** (founder-run, real login → Elena's data): (1) 4 KPIs 14/+27% · 3 · 28/50 · 7·3-unread; (2) sort tabs re-order, Momentum top-6 Stripe→Fly.io; (3) ProblemCard render + `/problems/[slug]` links incl. a **forum badge** on a forum-source card; (4) weekly chart (lines + dashed projection + caption); (5) activity rail tags/times; (6) sidebar 7 categories + counts, active nav, bell unread=3; (7) light + dark parity; (8) mobile reflow. Greeting/date are dynamic (A3) — not pixel-matched. (dep: T024)

**STOP 5 gate** — typecheck/lint/build 4/4; bundle RSC-first; automated checks green (redirect + build + data layer + integrity); preview deployed; the founder-run page-1 fidelity checklist delivered. Slice 4.2 done — shell ready for 4.3–4.8.

---

## Dependencies & parallelism

- **Intra-batch [P]**: Batch 0 — T001/T002/T003 [P]; T004 dep T003; T005 [P]; T006 dep T001+T004+T005. Batch A — T007 [P]; T008→T009 (same file); T010 [P] dep T007; T011 dep T009+T010. Batch B — T012/T013/T014/T016 [P]; T015 dep T010; T017 dep T012–T016. Batch C — T018/T019 [P]; T020 dep T017+T018+T019; T021 dep T006+T008. Batch D — T022 dep STOP 4; T023 [P]; T024 dep T022; T025 dep T024.
- **STOP gates** hold for founder review between batches.

## Slice-integrity diff scope (re-assert at STOP 5)

- **NEW**: `apps/web/src/app/(app)/{layout,page}.tsx`; `apps/web/src/components/app/**` (sidebar, topbar, sidebar-nav, adapter, dashboard/*); `apps/web/src/lib/app-user.ts`.
- **EDIT**: `apps/web/src/middleware.ts` (matcher); `packages/db/src/{queries,index}.ts` (read-only helpers); `packages/ui/src/source-icons/index.tsx` (+forum); `CLAUDE.md` (§8 note).
- **UNCHANGED**: Tier-3 auth (`auth.ts`, `next-auth.d.ts`, onboarding); slice-4.1 schema/seed/migration; `ProblemCardFull` logic (only +forum icon). **0 new deps, 0 new env, 0 schema/seed/migration.**

## Risks & follow-ups

- **TF-021** — re-point the problem cards from `/problems/[slug]` (public sample) to the authenticated detail in **slice 4.3**.
- **TF-022** — fully reconcile the canonical card's source vocabulary to the 4.1 registry (drop `ph`/`gp`; route the card's badge rendering through `resolveBadge`) once the Tier-2 landing card's source usage is confirmed safe to change.
- **`getAppUser()` is the 5.5 demo→real-user flip point** — no screen or helper may bypass it.
- **Risk**: a charting dep sneaking in → mitigated (hand-rolled SVG, §9.5).

## Process-oddity carry-forwards

- **dev==prod single Supabase** — the seeded reads are read-only and safe.
- **Sandbox can't hold a signed-in session** → interactive fidelity (KPIs/sort/links/chart/rail with Elena's data) is **founder-run on preview with a real signup**; the anonymous `/app`→login redirect IS locally HTTP-verifiable.
- **RSC-first** (defer client JS; islands = sort-tabs + sidebar-nav). `noUncheckedIndexedAccess`. HTTPS-token git push (SSH refused).
