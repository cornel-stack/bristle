# Phase 1 Contracts: UI & Data (Slice 015 — Onboarding)

Route table + gating, Server-Action contracts, middleware/guard rules, component prop contracts, and the categories/role constants shape. Schema lives in `../data-model.md`; decisions in `../plan.md`.

---

## 1. Route table

| Route | Kind | Render | Auth gate (middleware) | Completion guard (page) | Metadata |
|---|---|---|---|---|---|
| `/onboarding/role` | Page + Server Action | ƒ Dynamic | session cookie required → else `/login?callbackUrl=/onboarding/role` | completed → `/account` | noindex |
| `/onboarding/categories` | Page + Server Action | ƒ Dynamic | session cookie required | completed → `/account`; no saved role → `/onboarding/role` | noindex |
| `/account` (existing) | Page + Server Action | ƒ Dynamic | session cookie required (unchanged) | **NEW:** incomplete → `/onboarding/role` | noindex (unchanged) |

Status expectations (gate): `/onboarding/role` + `/onboarding/categories` for a signed-in incomplete user → 200; signed-out → 302 → `/login?callbackUrl=…`; signed-in completed → 302 → `/account`; `/account` signed-in incomplete → 302 → `/onboarding/role`.

---

## 2. Middleware (`apps/web/src/middleware.ts`) — delta only

```text
// UNCHANGED logic: cookie-presence only; absent → /login?callbackUrl=<pathname>.
export const config = {
  matcher: ["/account/:path*", "/onboarding/:path*"],  // + "/onboarding/:path*"
};
```
The middleware does NOT read completion state (edge, no DB — R2). That is the page guards' job.

## 3. Page guards (`lib/onboarding/guard.ts`) — server-side, DB-aware

A shared helper used by the three pages, reading the full user via `getUserByEmail`:
```text
requireOnboardingIncomplete(user): if user.onboardingCompletedAt != null → redirect("/account")
requireOnboardingComplete(user):   if user.onboardingCompletedAt == null → redirect("/onboarding/role")
requireRoleChosen(user):           if !user.role → redirect("/onboarding/role")
```
- `/onboarding/role` page: `auth()` → user (via getUserByEmail) → `requireOnboardingIncomplete(user)`.
- `/onboarding/categories` page: → `requireOnboardingIncomplete(user)` → `requireRoleChosen(user)`.
- `/account` page: → `requireOnboardingComplete(user)` (the new line; otherwise unchanged).

Each page also independently re-checks signed-in (`auth()` authoritative — TOCTOU, slice-013 pattern); the middleware is the fast pre-check.

---

## 4. Server-Action contracts (`app/onboarding/actions.ts`)

All `"use server"`, async-only. Order: read session (authoritative `auth()`) → Zod validate → persist → `redirect()` (outside try/catch). Errors surface via the discriminated state and the slice-014 `AuthFormBanner`.

### 4.1 `saveRole(prev, formData)`
- Input (Zod): `{ role ∈ ROLE_VALUES, roleCustom? }`; `roleCustom` required (non-empty, ≤200) iff `role === "other"`.
- Flow: `auth()` → userId; parse → on invalid (esp. missing custom for "other") → `validation-error`; `saveUserRole({ userId, role, roleCustom })` → `redirect("/onboarding/categories")`.
- State: `{status:"idle"} | {status:"validation-error", fieldErrors:{role?|roleCustom?}, values} | {status:"transport-error", message}`.

### 4.2 `saveCategories(prev, formData)`
- Input (Zod): `{ categories: string[] }` — parsed from the form (repeated `categories` values or a hidden joined field); 3 ≤ length ≤ 5; every slug ∈ `CATEGORIES`; deduped.
- Flow: `auth()` → userId; parse → on out-of-range/unknown-slug → `validation-error`; `saveUserCategories({ userId, categories })` (sets `watched_categories` + `onboarding_completed_at` atomically) → `redirect("/account")`.
- State: `{status:"idle"} | {status:"validation-error", message, values:string[]} | {status:"transport-error", message}`.

### 4.3 `skipOnboarding(formData)`
- Flow: `auth()` → userId; `completeOnboarding(userId)` (sets `onboarding_completed_at` only) → `redirect("/account")`.
- State: minimal (`{status:"idle"} | {status:"error", message}`); invoked from the shell's "Skip for now" form/button.

---

## 5. Component prop contracts

Server unless marked **(client)**. §4 tokens; no inline style. Reuses slice-014 `AuthOverline` + `AuthFormBanner`.

| Component | Props (intended) | Notes |
|---|---|---|
| `onboarding-shell` | `{ step: 1\|2; firstName?: string; children }` | Header: Bristle logo, `<ProgressDashes current={step} total={2}/>`, "Step {step} of 2", "Skip for now" (a `<form action={skipOnboarding}>` submit so it works server-side). Centered `max-w-5xl` content on `surface-canvas`. |
| `progress-dashes` | `{ current: number; total: number }` | `total` segments; segments ≤ `current` filled `accent-bristle`, rest `border-default`. `aria-label="Step {current} of {total}"`. |
| `role-card` | `{ value; label; description; icon; selected }` | `<label>` wrapping a visually-hidden `<input type="radio" name="role" value={value}>`. Selected → orange border + filled check (design 3_1). lucide icon at 1.5px. |
| `category-card` | `{ slug; label; selected; disabled? }` | `<label>` wrapping `<input type="checkbox" name="categories" value={slug}>`. Subline "Coming soon" (no count, no sparkline — C-f/C-g). `disabled` when max reached and not already selected. Selected → orange border + filled box. |
| `role-selector` **(client)** | `{}` | `useActionState(saveRole)`; `useState` selected role; renders the 6 `RoleCard`s; reveals an "other" `<textarea name="roleCustom" maxLength={200}>` when "other" picked; shows the per-role **preview line** (ROLE_OPTIONS[role].preview); footer "← Back" + "Continue → categories". |
| `category-selector` **(client)** | `{ initial?: string[] }` | `useActionState(saveCategories)`; `useState` selected slugs (seeded from `initial` for resume); search `<input>` (placeholder `Search {CATEGORIES.length} categories…`, "Showing all" subtitle); filtered grid of `CategoryCard`s; selected-pills row (each removable) + counter "{N} of 5 selected" + hint (pick N more to continue / …to unlock instant alerts / max reached); 3≤N≤5 enforced (Continue disabled <3, 6th prevented); submit "Finish →". |

Client-island budget: **2** route-level islands (`role-selector`, `category-selector`); `RoleCard`/`CategoryCard`/`OnboardingShell`/`ProgressDashes` are server. Well within the §5 posture.

---

## 6. Constants contracts

### `packages/shared/src/categories.ts`
```ts
export interface Category { slug: string; label: string; description?: string; iconName?: string; }
export const CATEGORIES: ReadonlyArray<Category> = [ /* ~18 placeholders, each // TODO (founder replaces) */ ];
```
No `activeProblemCount` / `updatedAt` / trend fields (deferred — FR-016, TF-009). Consumed by `CategorySelector` (grid + search) and `saveCategories` (slug validation).

### `lib/onboarding/role-options.ts`
```ts
export const ROLE_VALUES = ["indie_founder","product_manager","agency_studio","innovation_lab","researcher","other"] as const;
export type Role = (typeof ROLE_VALUES)[number];
export function isRole(v: string): v is Role { return (ROLE_VALUES as readonly string[]).includes(v); }
export const ROLE_OPTIONS: Record<Role, { label; description; iconName; preview }>;  // verbatim copy from spec FR-008/FR-010
```

---

## 7. Constants (single source)

`ONBOARDING_TOTAL_STEPS = 2` · `CATEGORIES_MIN = 3` · `CATEGORIES_MAX = 5` (Starter) · `ROLE_CUSTOM_MAX = 200` · `TERMS`-style values reused from slice 014 where relevant. Step h1s (from design, C-m): "What are you trying to do?" / "Which categories should we watch?".
