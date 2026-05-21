# Research: Design Tokens + Canonical Problem Card

Phase 0 decisions. Each resolves a "how" the spec left open. Format: Decision / Rationale / Alternatives.

## D1 — Runtime theme swapping via `@theme inline` + var indirection
- **Decision**: themeable colors are raw CSS vars on `:root` / `[data-theme="dark"]`; Tailwind utilities reference them through an `@theme inline` block. Static tokens (type scale, spacing, radius, font families) use a plain `@theme`.
- **Rationale**: plain `@theme --color-x: #hex` bakes hex into compiled utilities → cannot restyle at runtime. `inline` emits `var(--x)` so flipping the attribute restyles existing classes; no `dark:` duplication.
- **Alternatives**: (a) `@custom-variant dark` + `dark:` utilities everywhere — rejected (verbose, doubles class lists, fights the token model). (b) Two separate compiled stylesheets — rejected (heavier, FOUC).

## D2 — `Source_Serif_4` is the importable name for "Source Serif Pro"
- **Decision**: import `Source_Serif_4` from `next/font/google` for the editorial serif role.
- **Rationale**: Google Fonts renamed "Source Serif Pro" → "Source Serif 4"; `next/font/google` exposes the current name only.
- **Alternatives**: self-host the legacy "Source Serif Pro" files — rejected (defeats `next/font` optimization; brief permits the locked Source Serif choice, and SS4 is the same superfamily).

## D3 — Additive semantic spacing tokens (default scale intact) — REVISED
- **Decision**: leave Tailwind v4's **default numeric spacing scale intact** (4px unit: `p-1`=4px … `p-6`=24px …) and add an *additive* semantic set in the `--spacing-*` namespace: `--spacing-tight` 8, `--spacing-snug` 12, `--spacing-grid` 16, `--spacing-card` 24, `--spacing-loose` 40, `--spacing-section` 64 → utilities `p-card`, `gap-grid`, `space-y-section`, `p-snug`, `gap-tight`, etc. Values drawn from the §4.3 octave; the three concrete layout tokens (card 24, grid 16, section 64) match §4.3 defaults.
- **Rationale**: user pivot — semantic names that read as intent, **without** shadowing/redefining Tailwind's numeric utilities (so `p-24` keeps its stock meaning and nothing surprises downstream). Component-specific tokens (button/field padding) are deferred — §4.3 gives no explicit values, so they're added when those components are built rather than invented now.
- **Alternatives**: px-valued numeric names (`--spacing-24`) — rejected per pivot (shadowed defaults). Single `--spacing` base unit — rejected (user wants named semantic tokens).

## D4 — Client wrapper with server `children` for the RSC boundary
- **Decision**: `page.tsx` (server) renders the cards and passes them as `children` to a `"use client"` `ThemeShowcase`.
- **Rationale**: keeps `ProblemCardFull` server-rendered (SC-003) while the toggle is client; React does not client-bundle `children` passed as props.
- **Alternatives**: make `page.tsx` a client component importing the card — rejected (would turn the card into a client component, violating SC-003).

## D5 — Necessary plumbing beyond the requested file list
- **Decision**: also change `apps/web/next.config.ts` (`transpilePackages: ["@bristle/ui"]`), `apps/web/package.json` (depend on `@bristle/ui`), and `packages/ui/tsconfig.json` (JSX + DOM libs).
- **Rationale**: the package ships `.tsx` source (`main: ./src/index.ts`); Next must transpile it, web must depend on it, and the ui tsconfig must support JSX/DOM to typecheck.
- **Alternatives**: pre-compile `packages/ui` to JS — rejected (adds a build step the monorepo doesn't have yet; transpilePackages is the standard Next monorepo path).

## D6 — Source badges as inline SVG brand marks — REVISED
- **Decision**: six small monochrome SVG marks in `packages/ui/src/source-icons/` (`github, hacker-news, stack-overflow, product-hunt, app-store, google-play`), each ~20–30 lines using `currentColor`; `index.tsx` exports `<SourceIcon source: SourceKey />` dispatching to the right mark. The badge wrapper sets color; the icon fills with `currentColor`. No new dependency.
- **Rationale**: user pivot — wants recognizable brand marks, not letters, without adding `simple-icons`. Inline `currentColor` SVG keeps the badge token-driven and dependency-free, and reuses one primitive for both footer badges and the quote avatar.
- **Note**: marks are simple recognizable glyphs, not pixel-exact corporate logos.
- **Alternatives**: lettered chips (prior plan) — rejected per pivot. `simple-icons` dependency — rejected (out of §3 stack).

## D7 — `lucide-react` lives in `packages/ui`, only for momentum arrows
- **Decision**: add `lucide-react` to `packages/ui` (used for `ArrowUp`/`ArrowDown`); `apps/web` need not depend on it directly.
- **Rationale**: the arrows live in the card (ui package); §3/§4.6 lock lucide as the icon set, so it is pre-approved.
- **Alternatives**: inline SVG arrows (no dependency) — viable; rejected to honor §4.6 "Lucide … functional." Flagged for review since it differs from "inline SVG everything."

## D8 — Relative time computed at render against `Date.now()`
- **Decision**: pure `formatRelative(iso)` helper, evaluated server-side at render.
- **Rationale**: deterministic given input; fine for a static showcase; no client clock needed.
- **Alternatives**: client-side live-updating time — rejected (would require client JS in the card, breaking SC-003).
