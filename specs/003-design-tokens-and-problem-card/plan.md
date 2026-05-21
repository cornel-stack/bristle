# Implementation Plan: Design Tokens + Canonical Problem Card

**Branch**: `003-design-tokens-and-problem-card` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-design-tokens-and-problem-card/spec.md`

> **HARD CONSTRAINT honored**: this is a plan only. No code is written by this command. The "proposed contents" snippets below are *illustrative shapes for review*, not files to be created yet.

## Summary

Codify Bristle's full design-token layer (CLAUDE.md §4 + §4.1a) as Tailwind v4 CSS-driven theme tokens in `apps/web`, load the three brand fonts via `next/font/google`, build the canonical `ProblemCardFull` server component (+ a pure inline-SVG `Sparkline`) in `packages/ui`, and replace the placeholder homepage with a two-card showcase that toggles Editorial Light ↔ Editorial Dark via a `data-theme` attribute on `<html>` — no `next-themes`, no charting library, no other components.

**Technical approach**: tokens live as raw CSS custom properties under `:root` (Editorial Light) and `[data-theme="dark"]` (Editorial Dark), surfaced to Tailwind utilities through an `@theme inline` block (the v4 pattern for *runtime* theme swapping); static tokens (type scale, spacing base, radius, font families) live in a plain `@theme` block. The card is a pure presentational Server Component consuming a typed prop contract; the only client code is a thin `ThemeShowcase` wrapper that owns the toggle and receives the server-rendered cards as `children`.

## Technical Context

**Language/Version**: TypeScript 5.8.x (strict), React 19.1.0, Next.js 15.5.18 (App Router), Node 20.

**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/postcss`), `next/font/google` (built into Next), `lucide-react` (locked icon set per CLAUDE.md §3/§4.6 — **new dependency this slice**, for momentum arrows). No `next-themes`, no Recharts/charting lib.

**Storage**: N/A (fixture data inline in the showcase page).

**Testing**: none added this slice (Vitest/Playwright arrive later); verification is typecheck + lint + build + Lighthouse + visual diff vs `design/Core_app.pdf` p.1.

**Target Platform**: Web (Vercel preview + production), modern evergreen browsers; mid-range mobile/4G performance budget.

**Project Type**: Web monorepo (Turborepo) — `apps/web` (Next.js) + `packages/ui` (shared components).

**Performance Goals**: Lighthouse ≥90 Performance and ≥90 Accessibility on a **local production build** (SC-008); LCP < 2.5s, initial JS < 180KB gz (CLAUDE.md §5).

**Constraints**: TS strict (no `any`); Server Components by default; Tailwind classes only (no inline `style`); no hex literals in the card; no `localStorage`/`sessionStorage`; WCAG 2.2 AA; reduced-motion respected; 4px visual tolerance vs the PDF.

**Scale/Scope**: 1 token layer (29 themeable color vars/theme + type/spacing/radius), 3 fonts, 2 new components (`ProblemCardFull`, `Sparkline`), 1 client wrapper, 1 showcase page. ~6 changed/added source files.

## Constitution Check

*Constitution = `CLAUDE.md` (the `.specify/memory/constitution.md` is an unfilled template; the project uses CLAUDE.md as its standing law).*

| Gate (CLAUDE.md) | Status | Notes |
|---|---|---|
| §3 Stack locked | PASS | Tailwind v4, Next 15 App Router, TS strict — all in stack. **`lucide-react` is the one new dependency**; it is explicitly locked in §3/§4.6, so no proposal needed (recorded as a decision). `next-themes` correctly **not** used (deferred). No charting lib. |
| §4 Design system exact | PASS | All color/type/spacing/radius values trace to §4.1, §4.1a, §4.2–§4.4 verbatim; SC-001 enforces zero diff. |
| §5 Conventions | PASS | Server Components default (card + sparkline server-rendered; only the toggle is client). kebab-case files / PascalCase components. Tailwind utilities only — sparkline color via `currentColor` + a token text-utility, geometry via SVG attributes (not CSS inline `style`). No `localStorage`. No `any`. |
| §6 Voice | PASS | Card microcopy is data-driven; no marketing copy added. |
| §9 Never-do | PASS | No edits to `design/` or the PDFs/docx; spec→plan→tasks→implement order respected; building exactly this slice; lucide is in-stack; no browser storage. |
| §10 Ambiguity | PASS | All five spec clarifications resolved (spec → Clarifications); category tints sourced from §4.1a. |

**Result**: PASS. No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-design-tokens-and-problem-card/
├── spec.md                      # done
├── plan.md                      # this file
├── research.md                  # Phase 0 — decisions (Tailwind v4 theming, font names, RSC boundary)
├── data-model.md                # Phase 1 — prop contract + token inventory
├── quickstart.md                # Phase 1 — how to run/verify the slice
├── contracts/
│   └── problem-card-full.md     # Phase 1 — component (UI) contract
└── tasks.md                     # Phase 2 — NOT created here (/speckit.tasks)
```

### Source Code (exact file tree of changes/additions)

```text
apps/web/
├── next.config.ts               # CHANGE — add transpilePackages: ["@bristle/ui"]
├── src/app/
│   ├── globals.css              # CHANGE — replace bare @import with full token layer (@theme + @theme inline + :root + [data-theme="dark"])
│   ├── layout.tsx               # CHANGE — load 3 next/font/google fonts, attach their CSS-var classNames to <html>
│   ├── page.tsx                 # CHANGE — Server Component: fixture data + renders <ThemeShowcase> with two <ProblemCardFull> as children
│   └── theme-showcase.tsx       # ADD — "use client" wrapper: toggle button + grid; sets document.documentElement.dataset.theme
└── package.json                 # CHANGE — depend on @bristle/ui (workspace:*)

packages/ui/
├── package.json                 # CHANGE — add subpath exports + react peer + lucide-react dep (arrows only) + @types/react
├── tsconfig.json                # CHANGE — add jsx: "react-jsx" + DOM libs (justifying comment per §5)
└── src/
    ├── problem-card-full.tsx    # ADD — Server Component: the canonical card
    ├── sparkline.tsx            # ADD — pure buildSparklinePath() + <Sparkline> server component (inline SVG)
    ├── source-icons/            # ADD — inline monochrome brand marks (currentColor), no new dependency
    │   ├── github.tsx           # ADD
    │   ├── hacker-news.tsx      # ADD
    │   ├── stack-overflow.tsx   # ADD
    │   ├── product-hunt.tsx     # ADD
    │   ├── app-store.tsx        # ADD
    │   ├── google-play.tsx      # ADD
    │   └── index.tsx            # ADD — <SourceIcon source: SourceKey /> dispatch + barrel
    └── index.ts                 # CHANGE — barrel re-export of ProblemCardFull, Sparkline, SourceIcon, and types
```

> `next.config.ts` (transpilePackages), the web→ui workspace dep, and the ui `tsconfig` JSX/DOM change are **necessary additions beyond the file list in the request** — flagged here and in Decisions (D5) / Risks (R3, R4). `tailwind.config.*` is intentionally **not** created (v4 is CSS-driven).

**Structure Decision**: tokens and fonts belong to the *app* (`apps/web`) because Tailwind/PostCSS and `next/font` are app-level concerns; the reusable *components* belong to `packages/ui`. The card stays framework-agnostic (no Next imports), so `packages/ui` gains no Next dependency — only `react` (peer) and `lucide-react`.

---

## 1. Full `@theme` block structure (globals.css)

Tailwind v4 generates utilities from `@theme` namespaces (`--color-*` → `bg-/text-/border-`, `--font-*` → `font-`, `--text-*` → `text-` sizes, `--radius-*` → `rounded-`, `--spacing-*` → spacing utilities like `p-`/`gap-`/`m-`/`space-y-`). To make **colors swap at runtime** by theme, raw values live on `:root`/`[data-theme="dark"]` and are surfaced via **`@theme inline`** (so utilities emit `var(--color-…)` references rather than baked hex). Static tokens use a plain `@theme`.

**Proposed shape (illustrative — not written yet):**

```css
@import "tailwindcss";

/* (a) Runtime-themeable colors: utilities reference vars, vars swap by theme */
@theme inline {
  /* core palette — §4.1 */
  --color-surface-canvas: var(--surface-canvas);
  --color-surface-card:   var(--surface-card);
  --color-surface-raised: var(--surface-raised);
  --color-border-default: var(--border-default);
  --color-border-strong:  var(--border-strong);
  --color-text-primary:   var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary:  var(--text-tertiary);
  --color-accent-bristle:   var(--accent-bristle);
  --color-accent-validated: var(--accent-validated);
  --color-status-warning: var(--status-warning);
  --color-status-error:   var(--status-error);
  --color-status-success: var(--status-success);
  /* category tints — §4.1a (8 × {bg,fg}) */
  --color-category-payments-bg:   var(--category-payments-bg);
  --color-category-payments-fg:   var(--category-payments-fg);
  /* …devtools, ai-ml, auth-sso, deployment, analytics, mobile, email (bg+fg each)… */

  /* font families reference next/font runtime vars → also inline */
  --font-sans:  var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-source-serif), ui-serif, Georgia, serif;
  --font-mono:  var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace;
}

/* (b) Static tokens: type scale (§4.2), spacing base (§4.3), radii (§4.4) */
@theme {
  --text-display-xl: 60px; --text-display-xl--line-height: 64px; --text-display-xl--letter-spacing: -0.025em;
  --text-display-lg: 48px; --text-display-lg--line-height: 56px; --text-display-lg--letter-spacing: -0.022em;
  --text-h1: 36px; --text-h1--line-height: 44px; --text-h1--letter-spacing: -0.02em;
  --text-h2: 28px; --text-h2--line-height: 36px; --text-h2--letter-spacing: -0.015em;
  --text-h3: 22px; --text-h3--line-height: 30px; --text-h3--letter-spacing: -0.005em;
  --text-h4: 18px; --text-h4--line-height: 26px; --text-h4--letter-spacing: 0;
  --text-body-lg: 18px; --text-body-lg--line-height: 30px;          /* serif synthesis */
  --text-body-md: 15px; --text-body-md--line-height: 24px;
  --text-body-sm: 13px; --text-body-sm--line-height: 20px; --text-body-sm--letter-spacing: 0.01em;
  --text-mono-sm: 13px; --text-mono-sm--line-height: 20px;

  /* Tailwind's default numeric spacing scale is left INTACT (4px unit: p-1=4px … p-6=24px …) — not redefined. */
  /* Additive semantic spacing tokens → p-card / gap-grid / space-y-section / p-snug / gap-tight … (values from §4.3 octave) */
  --spacing-tight: 8px;     /* minimal internal gaps (badge row, icon+label) */
  --spacing-snug: 12px;     /* compact padding */
  --spacing-grid: 16px;     /* gap between cards (§4.3 default) */
  --spacing-card: 24px;     /* card interior padding (§4.3 default) */
  --spacing-loose: 40px;    /* generous block separation */
  --spacing-section: 64px;  /* section-to-section vertical rhythm (§4.3 default) */

  --radius-button: 6px;
  --radius-card:   8px;
  --radius-modal:  12px;
  --radius-pill:   999px;
}

/* (c) Raw values — Editorial Light default */
:root {
  --surface-canvas: #FAFAF7; --surface-card: #FFFFFF; --surface-raised: #F4F2EA;
  --border-default: #E8E6DF; --border-strong: #D9D7CE;
  --text-primary: #1A1A19; --text-secondary: #6B6B65; --text-tertiary: #9A9A93;
  --accent-bristle: #C2410C; --accent-validated: #064E3B;
  --status-warning: #B45309; --status-error: #991B1B; --status-success: #166534;
  /* §4.1a light */
  --category-payments-bg: #E3F2EB; --category-payments-fg: #1F6B47;
  --category-devtools-bg: #FBE9DC; --category-devtools-fg: #C2410C;
  --category-ai-ml-bg: #ECE7F7; --category-ai-ml-fg: #5B3C99;
  --category-auth-sso-bg: #E4EDF9; --category-auth-sso-fg: #1F4E8F;
  --category-deployment-bg: #DFF0EE; --category-deployment-fg: #0F6E68;
  --category-analytics-bg: #F6EAD6; --category-analytics-fg: #8A5512;
  --category-mobile-bg: #F8E6EC; --category-mobile-fg: #A12648;
  --category-email-bg: #E9EBF0; --category-email-fg: #3D4860;
}

/* (d) Editorial Dark overrides — only the raw vars change; utilities unchanged */
[data-theme="dark"] {
  --surface-canvas: #0F0F0E; --surface-card: #1A1A19; --surface-raised: #232321;
  --border-default: #2E2E2A; --border-strong: #3A3A35;
  --text-primary: #F5F5F0; --text-secondary: #A8A89F; --text-tertiary: #6B6B65;
  --accent-bristle: #F97316; --accent-validated: #10B981;
  --status-warning: #F59E0B; --status-error: #EF4444; --status-success: #10B981;
  /* §4.1a dark */
  --category-payments-bg: #142E20; --category-payments-fg: #6FD79E;
  --category-devtools-bg: #3A1E10; --category-devtools-fg: #F97316;
  --category-ai-ml-bg: #251C3A; --category-ai-ml-fg: #B69CE6;
  --category-auth-sso-bg: #16263F; --category-auth-sso-fg: #8FB6E8;
  --category-deployment-bg: #103230; --category-deployment-fg: #5FD0C7;
  --category-analytics-bg: #332710; --category-analytics-fg: #E0B469;
  --category-mobile-bg: #34161F; --category-mobile-fg: #E891A8;
  --category-email-bg: #1E2230; --category-email-fg: #9FB0CC;
}
```

**Coverage check (for SC-001)**: 13 core color tokens + 16 category tokens = **29 themeable vars per theme**, each present in both `:root` and `[data-theme="dark"]`; 10 type-scale tokens; 6 additive semantic spacing tokens (default numeric scale left intact); 4 radii; 3 font families. A token-by-token diff script (planned in quickstart) compares these to CLAUDE.md §4.1/§4.1a/§4.2–§4.4.

## 2. Theme switching mechanism

- **Selector strategy**: explicit `[data-theme="dark"]` attribute on `<html>` (`document.documentElement`). No `prefers-color-scheme` media query (FR-003). Editorial Light is the default with **no attribute**; only the dark override block is keyed to `[data-theme="dark"]`.
- **Why `@theme inline` + var indirection**: a plain `@theme --color-x: #hex` bakes the hex into utilities at build time → cannot swap at runtime. Routing utilities through `var(--x)` and overriding `--x` under `[data-theme="dark"]` lets the *same* compiled class restyle when the attribute flips — no `dark:` variant duplication, no second class set.
- **No FOUC concern this slice**: default is light; the toggle is a deliberate manual demo. (Real no-flash theming with a pre-hydration script is `next-themes`' job, deferred.)
- **No persistence**: state is React `useState` only; nothing written to storage (CLAUDE.md §6 rule).

## 3. `next/font/google` integration

In `apps/web/src/app/layout.tsx` (Server Component):

```ts
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
const inter        = Inter({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-inter", display: "swap" });
const sourceSerif  = Source_Serif_4({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-source-serif", display: "swap" });
const jetbrainsMono= JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-jetbrains", display: "swap" });
// <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}>
```

- Each `variable` injects a CSS custom property (`--font-inter`, etc.) onto `<html>`. The `@theme inline` `--font-*` tokens reference these, so `font-sans`/`font-serif`/`font-mono` utilities resolve to the loaded faces with system fallbacks.
- **Source Serif Pro is served by Google Fonts as `Source_Serif_4`** in `next/font/google` (the family was renamed). The brief/CLAUDE.md name "Source Serif Pro" maps to this import (Decision D2 / Risk R2).
- `display: "swap"` for performance; self-hosted by Next at build (no runtime Google request → helps LCP and the perf budget).

## 4. `ProblemCardFull` component architecture

- **File**: `packages/ui/src/problem-card-full.tsx`. **Server Component** — no `"use client"`, no hooks, no browser APIs. Pure function of props → JSX (FR-012, SC-003).
- **Prop types** (exported alongside the component; see data-model.md):

```ts
export type CategoryColor = "payments" | "devtools" | "ai-ml" | "auth-sso" | "deployment" | "analytics" | "mobile" | "email";
export type SourceKey = "gh" | "hn" | "so" | "ph" | "ap" | "gp";
export interface ProblemCardFullProps {
  title: string;
  category: string;            // human label, e.g. "Payments"
  categoryColor: CategoryColor;
  momentum: number;            // signed %, e.g. 312 or -12
  sparkline: number[];         // 14-pt series
  topQuote: string;
  quoteSource: SourceKey;      // avatar inside the quote box
  sources: SourceKey[];        // footer badges, one per entry
  lastSeenIso: string;         // ISO-8601
}
```

- **Layout (matches `Core_app.pdf` p.1, 4px tolerance)** — card = `bg-surface-card border border-border-default rounded-card p-6` (24px):
  - **Header row** (`flex justify-between`): category pill top-left (`rounded-pill` + static category class); sparkline top-right (`<Sparkline>` in `accent/bristle`).
  - **Title**: `font-serif text-h3 text-text-primary`.
  - **Quote block**: filled `bg-surface-raised rounded-card p-4` box; leading circular **source avatar** (the `quoteSource` badge) + `font-serif italic text-body-md text-text-secondary` quote. **No left rule** (Q2).
  - **Footer row** (`flex justify-between text-body-sm`): left = one badge per `sources` entry (lettered circular chips); right = momentum delta (number in `text-text-secondary` + lucide `ArrowUp` in `text-accent-validated` / `ArrowDown` in `text-status-error`, none if 0) then `·` then relative time from `lastSeenIso`.
- **Category color application**: a **static** `Record<CategoryColor, string>` map of full utility strings (e.g. `payments: "bg-category-payments-bg text-category-payments-fg"`) so Tailwind's scanner sees complete class names (no runtime string interpolation → no purge misses). Unknown key → neutral fallback (`bg-surface-raised text-text-secondary`) (edge case).
- **Source badges**: a circular token-styled badge wrapping `<SourceIcon source={key} />`, which renders a small **inline monochrome brand mark** (in `packages/ui/src/source-icons/`) using `currentColor` so the badge's text color controls the fill. Six marks: `github / hacker-news / stack-overflow / product-hunt / app-store / google-play`. No brand-icon dependency added (Decision D6, revised). `quoteSource` avatar reuses the same badge + `SourceIcon` primitive. Each icon ~20–30 lines; `index.tsx` exports `<SourceIcon source: SourceKey />` dispatching to the right mark (and a neutral fallback for safety).
- **Relative time**: a small pure helper (`formatRelative(iso)`) → "12m ago / 1h ago / 3d ago / just now". Pure, deterministic given an input; computed against `Date.now()` at render (server). (Decision D8 — server-render time skew acceptable for a static showcase.)
- **Zero hex literals** (FR-013, SC-004): every color is a `*-token` utility or `currentColor`; sparkline stroke = `currentColor` set by a `text-accent-bristle` wrapper. Verified by grep in quickstart.

### `Sparkline` (packages/ui/src/sparkline.tsx)

- **Pure generator**: `buildSparklinePath(values: number[], width: number, height: number): string` — normalizes the series to the box (handles flat/single-value series without divide-by-zero → mid-line), returns an SVG `d` path string. No state, no DOM.
- **`<Sparkline>`**: Server Component rendering `<svg viewBox=… aria-hidden><path d={buildSparklinePath(...)} fill="none" stroke="currentColor" .../></svg>`. Color from the parent's `text-accent-bristle` (currentColor); size via `width`/`height` props + viewBox (SVG attributes, not CSS inline style). No Recharts (FR-011).
- Decorative → `aria-hidden="true"` (the momentum number carries the accessible meaning).

## 5. Showcase homepage architecture

The RSC boundary is the crux: the card must stay a **Server Component** while the toggle is **client**. Resolved by the "client wrapper with server children" pattern.

- **`apps/web/src/app/page.tsx`** — **Server Component** (route). Holds two fixture card datasets (inline; mirrors the PDF examples, e.g. "Stripe webhooks fail silently…", "LLM streaming chokes through CDN buffering"). Renders:
  ```tsx
  <ThemeShowcase>
    <ProblemCardFull {...fixtureA} />
    <ProblemCardFull {...fixtureB} />
  </ThemeShowcase>
  ```
  Because the cards are rendered by the server `page` and passed as `children`, they remain server-rendered even though `ThemeShowcase` is a client component (React does not re-bundle `children` it receives as props).
- **`apps/web/src/app/theme-showcase.tsx`** — **`"use client"`**. Props: `{ children: ReactNode }`. Owns `const [dark, setDark] = useState(false)`; an effect (or click handler) sets `document.documentElement.dataset.theme = dark ? "dark" : ""` (FR-017, SC-006). Renders the toggle `<button>` (labeled, keyboard-reachable, visible focus ring, `aria-pressed`) and a responsive 2-col grid (`grid gap-4 md:grid-cols-2`) wrapping `{children}`. No storage; transition respects reduced motion (CSS ≤180ms color transition, `prefers-reduced-motion` → none).
- **Why attribute on `<html>` from a client child works**: the toggle imperatively mutates `document.documentElement`; the cascade (`[data-theme="dark"]` overriding the root vars) restyles the server-rendered cards with no re-render needed.

## Per-package work breakdown

**`packages/ui`** (the reusable design-system layer):
1. Add `lucide-react` dependency (momentum arrows only) + `react`/`react-dom` peer deps; add `@types/react` dev dep for typecheck.
2. `src/source-icons/` — six monochrome `currentColor` brand marks + `index.tsx` exporting `<SourceIcon source />`.
3. `src/sparkline.tsx` — pure path generator + `<Sparkline>`.
4. `src/problem-card-full.tsx` — card, prop types, category map, source-badge primitive (uses `SourceIcon`), relative-time helper.
5. `src/index.ts` — barrel: re-export `ProblemCardFull`, `Sparkline`, `buildSparklinePath`, `SourceIcon`, and the types.
6. `package.json` — add subpath exports (`./problem-card-full`, `./sparkline`, `./source-icons`) while keeping the `.` barrel; record peer/deps.
7. `tsconfig.json` — `jsx: "react-jsx"` + DOM libs so the `.tsx` typechecks (justifying comment per §5; see Risk R3).

**`apps/web`** (the app that consumes tokens + renders the showcase):
1. `next.config.ts` — `transpilePackages: ["@bristle/ui"]` so Next compiles the package's `.tsx` source.
2. `globals.css` — full token layer (§1 above).
3. `layout.tsx` — three `next/font/google` fonts + html className.
4. `theme-showcase.tsx` — client toggle wrapper.
5. `page.tsx` — fixtures + server composition.
6. `package.json` — depend on `@bristle/ui` (`workspace:*`). lucide lives in ui, so web need not depend on it directly (Decision D7).

## Order of operations

1. **Tokens first** — `globals.css` `@theme`/`:root`/`[data-theme]`. Everything visual depends on tokens existing. (Verifiable in isolation: build emits the CSS vars.)
2. **Fonts** — `layout.tsx` font wiring + html classes; confirm `font-*` utilities resolve.
3. **`packages/ui` plumbing** — deps, `tsconfig` JSX/DOM, `package.json` exports, `transpilePackages` in web. (Compile gate before writing components.)
4. **`source-icons/`** — six brand marks + `<SourceIcon>` dispatch (no card dependency).
5. **`Sparkline`** — pure generator + component (no card dependency).
6. **`ProblemCardFull`** — consumes `SourceIcon` + `Sparkline` + tokens; the reference component.
7. **`ThemeShowcase`** (client) — toggle wrapper.
8. **`page.tsx`** — fixtures + compose cards inside ThemeShowcase.
9. **Verification gate** — typecheck + lint + prod build; grep card for hex (SC-004) and `"use client"` (SC-003); token diff vs §4 (SC-001); local prod-build Lighthouse (SC-008); visual diff vs PDF p.1 (SC-010); deploy preview parity (SC-009).

Critical path: 1 → 2 → 3 → (4, 5) → 6 → 7 → 8 → 9. The token/font work (1–2) is independent of the ui plumbing (3); `source-icons` (4) and `Sparkline` (5) are independent of each other but both precede the card (6).

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `@theme inline` + `var()` indirection misconfigured → utilities bake light hex and don't swap on `[data-theme="dark"]` | Med | High | Use `@theme inline` strictly for themeable colors; keep raw values only in `:root`/`[data-theme]`; verify by toggling and asserting computed `--color-*` changes. |
| R2 | "Source Serif Pro" not importable under that name in `next/font/google` | High | Med | Use `Source_Serif_4` (Google's current name); document the mapping; visually confirm serif renders. |
| R3 | `packages/ui` `tsconfig` lacks JSX/DOM settings → `.tsx` won't typecheck | High | Med | Add `jsx: "react-jsx"` + DOM libs to ui `tsconfig` (override base where needed, with a justifying comment per §5). |
| R4 | Next doesn't transpile `@bristle/ui` `.tsx` source → build/runtime import error | High | High | `transpilePackages: ["@bristle/ui"]` in `next.config.ts`; verify prod build resolves the import. |
| R5 | Brand marks must be drawn inline (lucide has no brand logos; no `simple-icons` dep) | Med | Low | Six small monochrome SVG marks in `source-icons/` using `currentColor`, dispatched by `<SourceIcon>`; simple recognizable glyphs, not pixel-exact corporate logos. |
| R6 | Dynamic category class names purged by Tailwind (runtime string building) | Med | High | Static `Record<CategoryColor,string>` of complete class strings so the scanner sees them; no interpolation. |
| R7 | Lighthouse perf <90 due to font loading / hydration of client wrapper | Low | Med | Self-hosted fonts via next/font + `display:swap`; client JS limited to the tiny toggle; measure on prod build (SC-008), not dev. |
| R8 | Importing `ProblemCardFull` (server) into a client `page` would force it client and break SC-003 | Med | High | Keep `page.tsx` a Server Component; pass cards as `children` to the client `ThemeShowcase` (never import the card *into* the client file). |
| R9 | 4px visual drift from PDF (pill radius, spacing, sparkline proportions) | Med | Med | Map every dimension to a token; eyeball against `Core_app.pdf` p.1 at 1:1; adjust spacing steps within the octave scale. |
| R10 | SVG sparkline color via class vs "no inline style" rule | Low | Low | `stroke="currentColor"` + `text-accent-bristle` wrapper; geometry via SVG attributes (not `style=`). |

## Complexity Tracking

No constitution violations — section intentionally empty.
