# Tasks: Onboarding — Role + Categories (Slice 015)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/ui-and-data.md](./contracts/ui-and-data.md) · **Quickstart**: [quickstart.md](./quickstart.md)

**Branch**: `015-onboarding` · **True baseline**: `c6f8025` (slice-014 merge `976b863` + onboarding design PNGs)

**Status**: DRAFT — held for founder shape-approval. Guard: tasks only — do NOT implement. One commit per task (CLAUDE.md §7).

---

## Task count (re-verify every claim at STOP 7 — slice-011/012/013 count-drift lesson)

**22 tasks total** — **20 commit-producing (T001–T020)** + **2 verification gates (T021–T022)**. Seven batches / seven STOPs.

| Batch | STOP | Tasks | Count | Theme |
|---|---|---|---|---|
| 0 | 1 | T001–T003 | 3 | §8 note + migration 0003 |
| A | 2 | T004–T009 | 6 | Categories constant + role-options + 4 server primitives |
| A2 | 3 | T010–T011 | 2 | 2 client islands + bundle baseline |
| B | 4 | T012–T016 | 5 | Guard helper + db helpers + 3 Server Actions + 2 pages |
| C | 5 | T017–T018 | 2 | Routing tweaks (middleware matcher + /account guard) |
| D | 6 | T019–T020 | 2 | Edge cases + polish + authoritative bundle |
| E | 7 | T021–T022 | 2 | Local gate + preview gate |

---

## STOP-1 count cross-check matrix (re-asserted verbatim at STOP 7)

| Metric | Count |
|---|---|
| Schema columns added (`users`) | **4** (role, role_custom, watched_categories `text[]`, onboarding_completed_at) |
| Migration `0003` statements | **4** (all additive, all nullable) |
| Constitution edits | **1** (T001 — §8 product-surface *note*, NOT a §3 stack change) |
| New env vars | **0** |
| New components | **6** (4 server primitives + 2 client islands) |
| Route-level client islands | **2** (RoleSelector, CategorySelector — both wrappers, no leaves) |
| New libs | **3** (`lib/onboarding/guard.ts`, `packages/shared/src/categories.ts`, `lib/onboarding/role-options.ts`) |
| New pages | **2** (`/onboarding/role`, `/onboarding/categories`) |
| Existing-file edits (routing) | **2** (`middleware.ts` matcher, `/account` guard) + db schema/queries/index |
| Lockfile changes / new deps | **0** |
| Total commits (est.) | **~22** (3 docs + 3 Batch 0 + 6 A + 2 A2 + 5 B + 2 C + 2 D + 2 E = 25 with docs; 22 task commits) |

---

## ⚠️ One discipline moment + two ROUTINE routing tweaks (reviewers: read the distinction)

**Discipline moment (1):**
1. **T002–T003 — Migration `0003`.** Third schema migration; the schema's **first `text[]` column** (`watched_categories`). All four columns are **additive + nullable** (no NOT-NULL relaxation, unlike `0002`) → **no consuming-code ripple**, so no same-batch app-code forward-port.

**ROUTINE routing tweaks (NOT discipline-change moments) — T017 + T018:**
- **T017 — `middleware.ts`**: add `"/onboarding/:path*"` to the `matcher` array. One line. The cookie-gate logic is unchanged.
- **T018 — `/account` page**: add a guard import + one `requireOnboardingComplete(user)` call. One line of logic.
- These are everyday routing wiring, not stack/contract changes — do **not** flag them as discipline events.
- **Byte-for-byte UNCHANGED (the diff MUST show zero edits here):** `apps/web/src/auth.ts`, `apps/web/src/types/next-auth.d.ts`, `apps/web/src/app/signup/verify-email/actions.ts`. The completion-routing for new users happens via the `/account` guard *after* sign-in (the verify redirect to `/login?verified=true` is correct and stays).

**T001 — constitution note, framed correctly:** a single-line **§8 product-surface** addition recording the `/onboarding/*` routes. The commit body MUST state this is **documentation-only audit-continuity** (the "every slice has a constitution touchpoint" pattern, for future readers grepping the § sections) — **NOT a §3 locked-stack change** (slice 015 adds no technology).

---

## Phase 0 — Constitution note + Schema (STOP 1) · T001–T003

- [X] T001 [P] Add a single-line product-surface note to `CLAUDE.md` §8 (Repository structure) recording the `apps/web/src/app/onboarding/{role,categories}` routes + the role/categories capture as Tier 3.2. **Single-purpose commit; the body MUST frame this as documentation-only audit-continuity, NOT a §3 locked-stack change (slice 015 adds no new technology).**
- [X] T002 [P] Edit `packages/db/src/auth-schema.ts`: add 4 Bristle-custom columns to `users` per data-model.md — `role` text / `role_custom` text / `watchedCategories` `text("watched_categories").array()` (first `text[]`) / `onboardingCompletedAt` timestamptz, all **nullable**. Run `pnpm --filter @bristle/db db:generate` → `packages/db/drizzle/0003_<name>.sql`; confirm exactly **4 `ADD COLUMN`** statements (incl. `watched_categories text[]`); **append the `-- ROLLBACK` block** (4 `DROP COLUMN` reverse order, per data-model.md). Schema TS edited BEFORE generate (slice-014 STOP-1 lesson). Discipline moment #1. (dep: T001 not required — independent)
- [X] T003 Apply `0003` via `pnpm --filter @bristle/db db:migrate`; run the verification query (filter `table_schema='public'`) confirming: `users` has the 4 new columns, all `is_nullable = YES`, and `watched_categories` `data_type = 'ARRAY'` (udt `text`):
  ```sql
  SELECT column_name, is_nullable, data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='users'
     AND column_name IN ('role','role_custom','watched_categories','onboarding_completed_at')
   ORDER BY column_name;
  ```
  (dep: T002)

**STOP 1 gate (HOLDS on T003)** — 4 columns present + all nullable + `watched_categories` is `text[]`; `pnpm typecheck` clean; migration `0003` + rollback committed; §8 note visible as its own commit. Re-assert the count matrix. No feature work until green.

---

## Phase A — Constants + server primitives (STOP 2) · T004–T009

All onboarding components under `apps/web/src/components/onboarding/`; server; §4 tokens only; no `"use client"`. Reuse slice-014 `AuthOverline`/`AuthFormBanner` (import from `components/auth/`).

- [X] T004 [P] Create `packages/shared/src/categories.ts` — `interface Category { slug; label; description?; iconName? }` + `CATEGORIES: ReadonlyArray<Category>` with ~18 design placeholders (Devtools, Payments, AI / ML, Auth & SSO, Deployment, Analytics, Mobile dev, DataOps, No-code / Low-code, Browsers, Security, Design tools, Email / Comms, Calendaring, Content / CMS, Education tech, Health tech, Climate), **each `// TODO`-marked**. NO count/sparkline fields (FR-016). Re-export from the package index if it has one. **FOUNDER replaces the placeholders with the real list before the STOP 2 gate (C-a).** (dep: none)
- [X] T005 [P] Create `apps/web/src/lib/onboarding/role-options.ts` — `ROLE_VALUES` (the 6 slugs) `as const`, `type Role`, `isRole(v): v is Role`, and `ROLE_OPTIONS: Record<Role, { label; description; iconName; preview }>` verbatim from spec FR-008/FR-010. (dep: none)
- [X] T006 [P] Create `components/onboarding/progress-dashes.tsx` — server; props `{ current, total }`; `total` segments, ≤`current` filled `accent-bristle`, rest `border-default`; `aria-label="Step {current} of {total}"`. (dep: none)
- [X] T007 [P] Create `components/onboarding/role-card.tsx` — server; `<label>` wrapping a visually-hidden `<input type="radio" name="role" value>`; label + description + lucide icon (1.5px); selected → orange border + filled check (design 3_1). (dep: none)
- [X] T008 [P] Create `components/onboarding/category-card.tsx` — server; `<label>` wrapping `<input type="checkbox" name="categories" value={slug}>`; name + **"Coming soon"** subline (NO count, NO sparkline — C-f/C-g); `disabled` when max-reached-and-unselected; selected → orange border + filled box. (dep: none)
- [X] T009 Create `components/onboarding/onboarding-shell.tsx` — server; props `{ step: 1|2; firstName?; children }`; header = Bristle logo + `<ProgressDashes current={step} total={2}/>` + "Step {step} of 2" + a "Skip for now" `<form action={skipOnboarding}>` submit; centered `max-w-5xl` content on `surface-canvas`. (dep: T006)

**STOP 2 gate** — each primitive renders in isolation with §4 tokens; `OnboardingShell` shows the header + "Step N of **2**"; cards show the selected state + "Coming soon"; **the `CATEGORIES` placeholders are replaced with the founder's real list (no `// TODO` left)**; typecheck/lint clean; no `"use client"` introduced.

---

## Phase A2 — Client islands (STOP 3) · T010–T011

Under `components/onboarding/`; `"use client"`; dependency-free (plain substring search — no fuzzy lib, D7).

- [X] T010 [P] Create `components/onboarding/role-selector.tsx` — `useActionState(saveRole)` + `useState` selected role; renders the 6 `RoleCard`s; reveals an "other" `<textarea name="roleCustom" maxLength={200}>` when "other" picked; shows the per-role **preview line** (`ROLE_OPTIONS[role].preview`); footer "← Back" + "Continue → categories"; `AuthFormBanner` for errors. (dep: T005, T007)
- [X] T011 [P] Create `components/onboarding/category-selector.tsx` — `useActionState(saveCategories)` + `useState` selected slugs (seeded from an `initial?` prop for resume); search input (placeholder `Search {CATEGORIES.length} categories…`, subtitle **"Showing all"**); filtered grid of `CategoryCard`s; selected-pills row (each removable) + counter "{N} of 5 selected" + hint ("pick N more to continue" <3 / "pick N more to unlock instant alerts" 3–4 / "max reached" 5); enforce 3≤N≤5 (Continue disabled <3, 6th prevented); submit **"Finish →"**. (dep: T004, T008)

**STOP 3 gate (bundle baseline #1)** — selectors update live; min/max + 6th-prevented work; search filters case-insensitively; "Finish →" present. **Bundle measurement #1**: island-cost baseline (the per-route number isn't authoritative until pages wire them in Batch B). Watch if trending >110 KB route impact; investigate if clearly >130 KB.

---

## Phase B — Guard + db helpers + actions + pages (STOP 4) · T012–T016

- [X] T012 [P] Add db helpers to `packages/db/src/queries.ts` + re-export from `index.ts`: `saveUserRole({userId, role, roleCustom})` (sets role/role_custom, NOT completed_at), `saveUserCategories({userId, categories})` (sets watched_categories + onboarding_completed_at atomically), `completeOnboarding(userId)` (sets onboarding_completed_at only — the Skip path). (dep: STOP 1)
- [X] T013 [P] Create `apps/web/src/lib/onboarding/guard.ts` — three `(user: User) => void` helpers that call `redirect()` (side-effect, throws NEXT_REDIRECT) when their condition holds, per contracts §3: `requireOnboardingIncomplete(user)` → `/account` if completed; `requireOnboardingComplete(user)` → `/onboarding/role` if not; `requireRoleChosen(user)` → `/onboarding/role` if `!user.role`. Consumed by both `/onboarding/*` pages (T015/T016) AND `/account` (T018) — single source. (dep: STOP 1)
- [X] T014 Create `apps/web/src/app/onboarding/actions.ts` — `"use server"`, async-only. `saveRole(prev, fd)` (Zod: role ∈ ROLE_VALUES, roleCustom required iff other ≤200 → `saveUserRole` → redirect `/onboarding/categories`); `saveCategories(prev, fd)` (Zod: 3–5 known slugs, deduped → `saveUserCategories` → redirect `/account`); `skipOnboarding(fd)` (`completeOnboarding` → redirect `/account`). Redirects outside try/catch. **Commit body MUST include the 3 state contracts verbatim** (contracts §4). (dep: T012, T004, T005)
- [X] T015 [US1] Create `apps/web/src/app/onboarding/role/page.tsx` — server; `auth()` → `getUserByEmail` → `requireOnboardingIncomplete(user)`; `OnboardingShell step={1} firstName={firstName(user.name)}` (overline "WELCOME TO BRISTLE[, {FIRSTNAME}]", h1 "What are you trying to do?", subhead) + `<RoleSelector/>`; noindex. (dep: T013, T009, T010, T014)
- [ ] T016 [US1] Create `apps/web/src/app/onboarding/categories/page.tsx` — server; `auth()` → `getUserByEmail` → `requireOnboardingIncomplete(user)` → `requireRoleChosen(user)`; `OnboardingShell step={2}` (overline "PICK AT LEAST 3", h1 "Which categories should we watch?", subhead with Starter-5 + "Upgrade to Pro" → `/pricing`) + `<CategorySelector initial={user.watchedCategories ?? []}/>`; noindex. (dep: T013, T009, T011, T014)

**STOP 4 gate** — signed-in incomplete user: `/onboarding/role` 200 → pick role → `/onboarding/categories` → pick 3–5 → `/account`; role-only-then-return resumes at categories (resume guard); skip → `/account`; "other" requires custom text; server rejects unknown slug / out-of-range count.

---

## Phase C — Routing tweaks (STOP 5) · T017–T018 · ROUTINE (not discipline moments)

- [ ] T017 [P] Edit `apps/web/src/middleware.ts` — add `"/onboarding/:path*"` to the `config.matcher` array. **One line; cookie-gate logic unchanged** (signed-out → `/login?callbackUrl=<pathname>`). (dep: none — but lands after Batch B so the gated routes exist)
- [ ] T018 Edit `apps/web/src/app/account/page.tsx` — import `requireOnboardingComplete` from `lib/onboarding/guard.ts` and call it on the loaded `user` (one line) so an onboarding-incomplete user → `/onboarding/role`. Everything else in `/account` unchanged. (dep: T013, T015 — the `/onboarding/role` redirect target must exist)

**STOP 5 gate** — all four gating rules hold (signed-out `/onboarding/*` → login; incomplete `/account` → `/onboarding/role`; complete `/onboarding/*` → `/account`; signed-out `/account` → login) for credentials AND OAuth users. **Confirm the diff shows ZERO edits to `auth.ts`, `next-auth.d.ts`, `verify-email/actions.ts`.**

---

## Phase D — Edge cases + polish + bundle recheck (STOP 6) · T019–T020

- [ ] T019 Polish + edge cases: partial-resume (role saved → resume at categories), "other" textarea required-validation + ≤200, search/min-3/max-5 enforcement, removable pills + counter/hint copy, no-name welcome fallback, `AuthFormBanner` error states across both actions, a11y (radio group single-choice / checkbox group multi-choice keyboard + non-visual state/counts), voice greps (no `!`/emoji/hype). (dep: STOP 4 + STOP 5)
- [ ] T020 **Bundle recheck #2 (authoritative)**: production build; record First Load JS for `/onboarding/role` + `/onboarding/categories`. **Watch >110 KB; HARD BLOCK >130 KB** — fix before STOP 7. (dep: T019)

**STOP 6 gate** — a11y + edge cases green; **per-route First Load JS < 110 KB** for both onboarding routes (authoritative).

---

## Phase E — Gates (STOP 7) · T021–T022

- [ ] T021 **Local gate** against a clean production build (`pnpm typecheck && pnpm lint && pnpm build`, all 4/4). Verify:
  - lockfile diff EMPTY (0 new deps); voice/token greps clean across `components/onboarding` + `app/onboarding` + `packages/shared/categories.ts`.
  - **Slice-integrity diff vs `c6f8025`**: NEW `components/onboarding/*`, `app/onboarding/*`, `lib/onboarding/{guard,role-options}.ts`, `packages/shared/categories.ts`, `drizzle/0003*` + meta; EDIT db `auth-schema/queries/index`, `middleware.ts` (matcher), `account/page.tsx` (guard), `CLAUDE.md` (§8 note). **ZERO edits to `auth.ts` / `next-auth.d.ts` / `verify-email/actions.ts`.** Any other file = flag.
  - **Cross-slice regression**: curl `/`, `/pricing`, `/faq`, `/blog`, `/problems/{slug}` signed-out → unchanged (005–014); **`/account` for a completed user renders (not redirected to onboarding)**.
  - **`CATEGORIES` placeholders replaced** (no `// TODO` left — C-a).
  - **Re-assert the STOP-1 count matrix.** (dep: T020 + all prior)
- [ ] T022 **Preview gate** — push to `015-onboarding`; on the Vercel preview (reuses slice-014 OAuth env — no new setup):
  - migration `0003` applied (4 columns live); build Ready.
  - **5 e2e walks**: (1) signup → verify → sign in → onboarding role → categories → `/account`; (2) skip on step 1 → `/account`; (3) skip on step 2 → `/account`; (4) OAuth (Google/GitHub) new user → onboarding → `/account`; (5) a completed user re-visits `/onboarding/role` → `/account`.
  - **Bundle regression** vs STOP 3/6 numbers (≤110 KB).
  - **Visual diff** of `/onboarding/role` + `/onboarding/categories` at 1280px vs `design/onboarding/3_1_Role.png` + `3_2_Categories.png` within 4px (the brief's overrides — "of 2", "Coming soon", no sparkline, "Showing all", "Finish →" — are expected deviations, NOT regressions; `3_3` tour is out of scope). (dep: T021)

**STOP 7 gate** — all SC-001…013 verified; count matrix re-asserted; 5 walks pass; integrity diff matches the manifest (no auth-config touch); both onboarding routes <110 KB; visual diff within 4px on the two in-scope designs.

---

## Dependencies & sequencing

**Cross-batch edges (linear):** **Batch 0 → A → A2 → B → C → D → E.**
- STOP 1 (schema) → everything (the `User` type + columns back the db helpers, guards, and pages).
- A (primitives + constants) → A2 (islands compose cards/options) → B (pages compose shell + islands + actions).
- **B before C is REQUIRED**: T018 (`/account` guard) redirects to `/onboarding/role`, and T017 adds `/onboarding/:path*` to the matcher — both reference routes that must already exist (Batch B). Confirmed correct ordering.
- D (polish + authoritative bundle) → E (gates).

**Intra-batch [P]:** 0 — T001/T002 [P], T003 dep T002. A — T004–T008 [P], T009 dep T006. A2 — T010 (dep T005,T007) / T011 (dep T004,T008) mutually [P]. B — T012/T013 [P]; T014 dep T012; T015 dep T013+T009+T010+T014; T016 dep T013+T009+T011+T014. C — T017 [P]; T018 dep T013+T015. D/E linear.

**Sequencing concerns:**
1. **Founder pre-action inside Batch A**: T004 ships placeholder `CATEGORIES`; the **founder replaces them before STOP 2** (gate checks no `// TODO` remains). If unreplaced, STOP 2 holds.
2. **Bundle at STOP 3 is a baseline, not the gate** — the islands aren't wired into pages until Batch B; STOP 6 (T020) is the authoritative per-route ≤110 KB gate.
3. **C strictly after B** (above) — don't let the matcher/guard land before the routes exist.

## Implementation strategy (MVP-first)

MVP = **STOP 1 → A → A2 → B**: the captured role + 3–5 categories → `/account` loop (US1) on the new pages. Gating (C), polish (D), and gates (E) harden it. Skip (US2) and the gating rules (US3/US4) ride on the same pages + the one guard helper.
