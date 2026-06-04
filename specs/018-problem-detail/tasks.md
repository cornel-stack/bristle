# Tasks: Problem Detail (Authenticated) — Slice 4.3

**Feature**: `specs/018-problem-detail/` | **Branch**: `018-problem-detail`
**Inputs**: plan.md · research.md · data-model.md · contracts/ui-and-data.md · quickstart.md

> ## ⛔ DON'T-IMPLEMENT GUARD — READ FIRST
> This file is a **DRAFT task list for shape-approval only**. Do **not** run `/speckit.implement`, do **not** write code, do **not** commit. Execution happens later, **batch-by-batch, one commit per task, STOP at each gate for founder review** (established pattern, slices 013–017). The founder commits on explicit go.

---

## Execution model

5 batches → 5 STOP gates. One commit per task. Each STOP holds for review; the next batch starts only on explicit go. Read-only UI slice over the slice-4.1 fixtures, inside the slice-4.2 app shell.

| Batch | STOP | Theme | Tasks | Maps to |
|---|---|---|---|---|
| 0 | 1 | Route + shell wiring + 2 read-only helpers + TF-021 | T001–T009 | US1, US2, US4 |
| A | 2 | Boundary adapter + leaf reconciliation | T010–T012 | US1 (foundation for all) |
| B | 3 | Seven tab panels (via adapter) | T013–T021 | US1, US2 |
| C | 4 | Persistent right rail | T022–T027 | US3 |
| D | 5 | Polish + a11y + gates + preview | T028–T032 | cross-cutting |

**Total: 32 tasks.**

### Count cross-check matrix (slice integrity)

| Thing | Count | Where |
|---|---|---|
| New route | 1 | `app/app/problems/[slug]/page.tsx` |
| New in-app components | 14 | `components/app/problem-detail/**` (composer, header, action-bar, tabs island, 8 panels, 4 rail parts — minus shared) |
| Boundary adapter | 1 | `lib/problem-detail-adapter.ts` |
| New read-only DB helpers | 2 | `getSavedProblemIds`, `getProblemActivity` |
| **Wrapped** leaf components (gap leaves) | 3 | evidence (`evidence-panel`+`evidence-quote-row`), source-badge row, related list |
| **Reused** public leaves (as-is) | 4 | `DonutChart`, `SourcesCard`, `FrequencyChart`, `ProblemMomentumChip` (+ `*-math`) |
| TF-021 edits | 1 | `components/app/dashboard/problem-grid.tsx` |
| New third-party deps / env | **0** | charts hand-rolled (§9.5) |
| Schema / seed / migration changes | **0** | read-only over 4.1 |
| Client islands | **1** | `detail-tabs` (`FrequencyChart` is already a client component) |

---

## Standing constraints (apply to EVERY task)

- **A2 GUARD (hard invariant):** `git diff --stat apps/web/src/components/problem/` MUST be **empty at every STOP**. Never edit a shared public leaf to fit the DB shape — the boundary adapter absorbs differences. The 3 gap leaves (`EvidenceQuote`/`EvidenceList`, `ProblemSourceBadge`, `RelatedProblemsCard`) are **wrapped** as new in-app components, not reused. `FrequencyChart` is **wrap-if-absent**: if it lacks the validation-threshold marker / "+X% vs prior period" caption, overlay it — don't edit the leaf.
- **Two read-only, seam-parameterized DB helpers:** `getSavedProblemIds(userId)` (Save state) + `getProblemActivity(problemId)` (Activity tab). `getProblemActivity` is **separate** because `getProblemDetail` returns 8 child sets but **not** `problem_activity_log`. Both take the `getAppUser()`-resolved id — **never a hardcoded id**. No schema change.
- **`getAppUser()` seam:** resolves *which* user (demo in v1.0), not *whether* authenticated. The single Tier-5.5 flip point. Both helpers consume the seam id.
- **§9.5 no new charting dep:** reuse the hand-rolled SVG `FrequencyChart`/`DonutChart`; momentum via `ProblemMomentumChip`.
- **5-source delta:** all source rendering routes `source_key` through `@bristle/shared resolveBadge` (single badge truth) — `gh→GitHub`, `hn→Hacker News`, `so`+`se→Stack Overflow` (one badge, label per slice-4.2 D6), `appstore→App Store`, `forum→Forums`. **No Product Hunt / Google Play** (even though page-2's comp donut legend lists Product Hunt). Donut slices sum to the quote total; "N sources" = distinct-source count.
- **Genuine-0 / edge:** pgvector has `wtp = null` → explicit dry empty WTP (tab + rail), not blank. Label-only related (`targetSlug = null`) → rendered **unlinked**, 0 dead links.
- **RSC-first:** Server Components by default; the only new client island is `detail-tabs`.
- **Tokens-only, no `localStorage`/`sessionStorage`, kebab-case files, lucide 1.5px, plain voice (no exclamation/emoji).**

---

## Phase / Batch 0 — Route + shell wiring + helpers + TF-021 → **STOP 1**

**Goal:** the route renders inside the gated shell with a static (pre-adapter) header/action-bar/tab-shell; both read helpers exist; dashboard cards re-pointed. **Independent test:** anonymous `/app/problems/[slug]` → 307 `/login`; signed-in (preview) the page frame renders with the four action buttons and an empty tab strip.

- [ ] **T001** [US1] Create the route `apps/web/src/app/app/problems/[slug]/page.tsx` — async Server Component, Next 15 async params (`params: Promise<{ slug: string }>`). Flow: `const user = await getAppUser()` → `const detail = await getProblemDetail(slug)` → `if (!detail) notFound()` → `const isSaved = (await getSavedProblemIds(user.id)).has(detail.problem.id)` → `const activity = await getProblemActivity(detail.problem.id)` → render `<ProblemDetail detail={detail} activity={activity} isSaved={isSaved} />`. Renders inside the existing `app/app/layout.tsx` shell. **No middleware/auth edit** (the `/app/:path*` matcher already covers `/app/problems/*`).
- [ ] **T002** [US4] Add read-only `getSavedProblemIds(userId: string): Promise<Set<string>>` to `packages/db/src/queries.ts` (`SELECT problem_id FROM user_saved_problems WHERE user_id = userId` → `Set`); export from `packages/db/src/index.ts`. Read-only; takes the seam id, never hardcoded.
- [ ] **T003** [US2] Add read-only `getProblemActivity(problemId: string, limit?: number): Promise<ProblemActivity[]>` to `packages/db/src/queries.ts` (`problem_activity_log WHERE problem_id = problemId ORDER BY created_at DESC`); export from `index.ts`. **Sequential after T002 — same file.** Separate helper because `getProblemDetail` omits the activity log.
- [ ] **T004** [US1] Create the composer skeleton `apps/web/src/components/app/problem-detail/problem-detail.tsx` — lays out `<DetailHeader>` + `<DetailActionBar>` + `<DetailTabs>` (island) + persistent rail slot; the rail is rendered **outside** the tab island. Static slots this batch.
- [ ] **T005** [P] [US1] Create `apps/web/src/components/app/problem-detail/detail-header.tsx` — breadcrumb (Library / category / title), category chip(s), demand-status chip (from `demand_status`), "First seen … · Updated … ago" (now-relative), title, `ProblemMomentumChip` (**reused leaf**), source-badge row via `@bristle/ui` source-icons + `resolveBadge` (**wrap, forum-capable** — not `ProblemSourceBadge`), and the "N quotes · N sources · N willingness-to-pay mentions" summary. Reads raw `detail` for static fields this batch (adapter wires in Batch A).
- [ ] **T006** [P] [US4] Create `apps/web/src/components/app/problem-detail/detail-action-bar.tsx` — `Save` reflects `isSaved` ("Saved"/"Save"), **click inert** this slice; `Compare` / `Alert me` / `Export` render **visual-only** (`Export` = bristle-accent primary). No writes.
- [ ] **T007** [P] [US2] Create the client island `apps/web/src/components/app/problem-detail/detail-tabs.tsx` (`"use client"`) — ARIA tablist over the 7 keys (`synthesis·frequency·evidence·solutions·wtp·related·activity`); active tab from `useSearchParams` (validate; default `synthesis`), updated via `router.replace` (no scroll); empty panel slots this batch. Roving `tabIndex`, `aria-selected`, `aria-controls`/`id`.
- [ ] **T008** [US4] Edit `apps/web/src/components/app/dashboard/problem-grid.tsx` (TF-021) — card link `/problems/[slug]` → `/app/problems/[slug]`. No other dashboard change.
- [ ] **T009** **STOP 1 gate** — `pnpm --filter web typecheck && lint && build`; anonymous `GET /app/problems/stripe-webhook-reliability` → 307 `/login?callbackUrl=…` (HTTP, sandbox); confirm public `/problems/[slug]` still builds and `git diff --stat apps/web/src/components/problem/` is **empty**. Report; **hold for review**.

---

## Phase / Batch A — Boundary adapter + leaf reconciliation → **STOP 2**

**Goal:** one adapter maps `getProblemDetail` → all reused-leaf props + in-app view models; the reuse/wrap split is verified against the real leaf contracts. **Independent test:** a tsx probe prints correct view models for the hero, a forum-source problem, the 0-WTP problem, and a label-only related entry.

- [ ] **T010** [US1] Create `apps/web/src/lib/problem-detail-adapter.ts` — `adaptProblemDetail(detail, savedIds) → DetailViewModel` (data-model §3): `donutRows{name,count}` via `resolveBadge` + `quoteTotal` + distinct `sourceCount`; `frequencyData: Record<7d/30d/90d/all,{date,count}[]>` bucketed from `problemFrequencyPoints` + `thresholdDate` (from `isThresholdMarker`) + `priorPeriodDeltaPct`; `momentum{delta,windowDays}`; `evidenceVMs{handle,sourceKey(@bristle/ui),engagementText|rating,text,relativeTime,isWtp,statedPrice?}` + `filterCounts{all,perBadge}`; `solutionVMs`; `wtpVM|null`; `personaVMs{label,count,pct}`; `relatedVMs{label, href: /app/problems/[targetSlug] | null}`; `summary{quotes,sources,wtpMentions}`; `isSaved`. **All formatting lives here** (relative-time util, `+X%`, price ranges, badge labels).
- [ ] **T011** [US1] Leaf-reconciliation check — re-read each **reused** leaf (`DonutChart`, `SourcesCard`, `FrequencyChart`, `ProblemMomentumChip`) and confirm the adapter feeds their **exact current props**. **Verify** `FrequencyChart` renders the validation-threshold marker + "N mentions · +X% vs prior period" caption; **if absent, plan a wrap (overlay) — do NOT edit the leaf.** Re-confirm the 3 gap leaves stay wrapped (no reuse). Record the verdict for STOP-2.
- [ ] **T012** **STOP 2 gate** — foreground tsx probe: `adaptProblemDetail` over the hero (Stripe), a `forum`-source problem, pgvector (`wtp = null`), and a label-only related entry; `typecheck && lint`; **A2 guard:** `git diff --stat apps/web/src/components/problem/` **empty**; report the `FrequencyChart` threshold/caption verdict (reuse vs wrap). **Hold for review.**

---

## Phase / Batch B — Seven tab panels → **STOP 3**

**Goal:** all seven panels render fully populated from fixtures via the adapter; `?tab=` deep links open each. **Independent test:** the hero renders every panel; `?tab=evidence` (and each key) opens its panel.

- [ ] **T013** [P] [US1] `panels/synthesis-panel.tsx` — `problem.synthesis` prose (serif body, §4.2).
- [ ] **T014** [P] [US1] `panels/frequency-panel.tsx` — **reuse** `FrequencyChart` via `frequencyData`; apply the STOP-2 verdict (overlay the threshold marker + "+X% vs prior period" caption if the leaf lacks them — wrap, don't edit).
- [ ] **T015** [US2] `panels/evidence-panel.tsx` — **wrap (not `EvidenceList`)**: source-filter chips `All / GH / HN / SO / Other` from `filterCounts`; renders the quote rows + "show N more".
- [ ] **T016** [US2] `panels/evidence-quote-row.tsx` — **wrap (not `EvidenceQuote`)**: handle · engagement (`engagementValue`+`engagementLabel`) **or** `rating` (stars) · WTP-signal chip where `isWtp` (+ stated price) · relative time · "show more" for long quotes; source icon via `@bristle/ui` (forum-capable). **Sequential with T015 (same feature).**
- [ ] **T017** [P] [US1] `panels/solutions-panel.tsx` — existing-solution cards: name, price range, **Direct/Adjacent/Partial** match chip, description.
- [ ] **T018** [P] [US1] `panels/wtp-panel.tsx` — mention count, price range, median, stated prices/note; **genuine-0 state** when `wtpVM = null` (dry empty copy — "No willingness-to-pay signal yet." — not blank). Built to also serve the rail (Batch C reuses its rail mode).
- [ ] **T019** [P] [US1] `panels/related-panel.tsx` — **wrap (not `RelatedProblemsCard`)**: FK'd entries link `/app/problems/[targetSlug]`; **label-only entries render unlinked**; 0 dead links.
- [ ] **T020** [P] [US2] `panels/activity-panel.tsx` — `getProblemActivity` rows: type tag (threshold_crossed / quotes_added / problem_added / saved) + title + delta label + relative time.
- [ ] **T021** **STOP 3 gate** — wire all 7 panels into `detail-tabs`; `typecheck && lint && build`; the hero renders every panel from fixtures; `?tab=evidence|frequency|solutions|wtp|related|activity` each deep-link open. **A2 diff empty.** **Hold for review.**

---

## Phase / Batch C — Persistent right rail → **STOP 4**

**Goal:** the rail (donut / WTP / personas / related) renders outside the tab island and persists across switches. **Independent test:** switch tabs → rail unchanged; donut slices sum to the quote total; pgvector shows the 0-WTP rail state.

- [ ] **T022** [US3] `rail/detail-rail.tsx` — rail composer, rendered by `problem-detail.tsx` **outside** the tab island so it persists across tab changes.
- [ ] **T023** [P] [US3] `rail/sources-rail.tsx` — **reuse** `SourcesCard` (→ `DonutChart`) via `donutRows`; 5 live sources; slices sum to `quoteTotal`; "SOURCES · N QUOTES" header + legend.
- [ ] **T024** [P] [US3] `rail/personas-rail.tsx` — "WHO'S COMPLAINING" proportion bars from `personaVMs` (label · count · pct).
- [ ] **T025** [P] [US3] `rail/related-rail.tsx` — "RELATED PROBLEMS" list sharing the related-panel link rule (app link | label-only unlinked).
- [ ] **T026** [P] [US3] WTP rail variant — reuse `wtp-panel` in its rail mode (mentions · price range · median; genuine-0 when null).
- [ ] **T027** **STOP 4 gate** — `typecheck && lint && build`; rail renders on the hero + pgvector (0-WTP rail state); rail unchanged across tab switches; donut sums = `quoteTotal`. **A2 diff empty.** **Hold for review.**

---

## Phase / Batch D — Polish + a11y + gates + preview → **STOP 5**

**Goal:** light/dark + responsive + a11y polish; gates green; preview pushed for the founder's pixel check. **Independent test:** the STOP-5 page-2 checklist (founder-run on preview).

- [ ] **T028** Light/dark parity (existing tokens, no new ones); mobile-responsive (header reflow, tab strip scroll/wrap, rail stacks under content); reduced-motion (tab/panel transitions 0ms/opacity-only).
- [ ] **T029** A11y — tablist roles (`role=tab`/`tabpanel`, `aria-selected`, `aria-controls`/`id`, roving `tabindex`, arrow/Home/End), focus rings (2px accent + 4px ring), icon-button `aria-label`s, landmarks.
- [ ] **T030** `CLAUDE.md` §8 doc-only note — the `/app/problems/[slug]` detail + boundary adapter + **wrap-not-mutate** convention + TF-021 closed + TF-024/TF-025 pointers. **Documentation only — no §3/§4/§9 rule change.**
- [ ] **T031** Gates + bundle — `pnpm typecheck && lint && build` 4/4; per-route First Load JS for `/app/problems/[slug]` (RSC-first; islands = `detail-tabs` + already-client `FrequencyChart` only).
- [ ] **T032** **STOP 5 gate** — push branch (HTTPS-token) → Vercel preview. **Verification split:** automated (sandbox) = anonymous redirect + build + data-layer probe (adapter + both helpers over seeded rows) + gates + integrity diff; **founder-run** (preview, real login) = the 9-item page-2 checklist below. Report the preview URL + the checklist. **Hold for review.**

### STOP-5 — check these against `design/Core_app.pdf` page 2 (founder, preview, light + dark + mobile)
1. Header: breadcrumb + Devtools/Payments chips + green "Validated demand" chip + "First seen … · Updated … ago" + title + ↑momentum + source-badge row + "N quotes · N sources · N willingness-to-pay mentions".
2. Action bar: Save (reflects saved state) / Compare / Alert me / Export (Export = bristle-accent primary).
3. Tab strip: seven tabs, Evidence/Solutions/WTP show counts, Synthesis default; **swapped panels** (not scroll); `?tab=evidence` deep-links.
4. Synthesis prose; Frequency chart (last-90-days, threshold marker, "+X% vs prior period", window toggles).
5. Evidence: filter chips (All/GH/HN/SO/Other) + quote rows (handle · engagement|rating · WTP chip · relative time · show-more).
6. Solutions: cards with Direct/Adjacent/Partial match chips.
7. Right rail persists across tabs: SOURCES donut (5 slices, sums to quotes) + legend; WTP panel; WHO'S COMPLAINING personas with bars; RELATED PROBLEMS.
8. Genuine-0: pgvector shows an explicit empty WTP (tab + rail); label-only related entries render unlinked; no dead links.
9. Keyboard: full tab reach + visible focus rings; reduced-motion respected; mobile reflow.

---

## Dependencies & parallelism

- **Batch order is strict** (0 → A → B → C → D); STOP-gated.
- **Within Batch 0:** T002 → T003 sequential (same file `queries.ts`). T005/T006/T007 are `[P]` (separate files) after the composer T004. T008 independent `[P]`.
- **Within Batch B:** T015 → T016 sequential (evidence feature pair). T013/T014/T017/T018/T019/T020 are `[P]` (separate panel files).
- **Within Batch C:** T023/T024/T025/T026 are `[P]` after the composer T022.
- **Adapter (T010) blocks** the data-bound parts of Batches B & C (panels/rail read view models). Batch 0's header reads raw `detail` for static fields, then re-points to the adapter once T010 lands.

## Slice-integrity manifest

- **NEW:** `apps/web/src/app/app/problems/[slug]/page.tsx`; `apps/web/src/components/app/problem-detail/**`; `apps/web/src/lib/problem-detail-adapter.ts`; `packages/db` `getSavedProblemIds` + `getProblemActivity` (read-only).
- **EDIT:** `apps/web/src/components/app/dashboard/problem-grid.tsx` (TF-021); `packages/db/src/queries.ts` + `index.ts` (export helpers); `CLAUDE.md` §8 doc-only.
- **UNCHANGED:** Tier-3 auth + `middleware.ts`; public `/problems/[slug]` route + **all** `components/problem/*` leaves (byte-for-byte); 4.1 schema/seed/migration; `ProblemCardFull` logic; `getProblemDetail`.

## Risks & follow-ups

- **`FrequencyChart` threshold/caption** — wrap-if-absent (overlay), decided at STOP-2; never edit the leaf.
- **TF-022** — source-vocab reconciliation; routing app source rendering through `@bristle/ui` icons + `resolveBadge` advances it (don't broaden scope).
- **TF-024 (new, out of scope)** — converge the wrapped leaves (`ProblemSourceBadge`/`RelatedProblemsCard`, eventually evidence) onto shared source-agnostic DB-shaped leaves once the public surface is safe to change; bundle with TF-022.
- **TF-025 (new, out of scope)** — verify the public `/problems/[slug]` data source (static `SAMPLE_PROBLEMS` vs DB) before the Tier-5.5 fixtures→live swap; a static sample won't swap with the app.
- **`getAppUser()` seam** — the single Tier-5.5 flip point; both new helpers take the seam id.

## Process oddities (carry-forward)

- **Sandbox can't hold a signed-in session.** Sandbox-verifiable: anonymous `/app/problems/[slug]` → login redirect; `pnpm build`; data-layer tsx probe; integrity diff. **Founder-run on preview** (real login): pixel fidelity vs page 2.
- **dev == prod single Supabase** — reads only; no writes, no migration.
- **HTTPS-token push:** `git push "https://x-access-token:$(gh auth token)@github.com/cornel-stack/bristle.git" 018-problem-detail`.

---

> Reminder: **DRAFT only.** No code, no `/speckit.implement`, no commit until the founder approves the shape and says go — then Batch 0, one commit per task, STOP at gate 1.
