# Feature Specification: Design Tokens + Canonical Problem Card

**Feature Branch**: `003-design-tokens-and-problem-card`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "Slice 1.3 (Tier 1): Design tokens + canonical Problem Card. Codify all Bristle design tokens from CLAUDE.md §4 as Tailwind v4 CSS custom properties; load the three brand fonts; build the canonical ProblemCardFull reference component matching Core_app.pdf page 1; replace the placeholder homepage with a two-card showcase grid plus a manual light/dark theme toggle."

## Overview

This slice turns Bristle's design system from a written specification (CLAUDE.md §4, the design brief) into living, reusable code. It delivers two things a builder can see and trust: (1) the **complete token layer** — every color, type, spacing, and radius value — wired so any future component can reference tokens instead of raw values, in both Editorial Light and Editorial Dark; and (2) the **canonical Problem Card**, the reference implementation that proves the token layer renders to the visual contract. It is the first slice with visible product UI. No data, no auth, no other components — just the design substrate and the one card that demonstrates it.

This is a **vertical slice of the design system**: the value is a demonstrable, theme-switchable card grid that any teammate can open and judge against the design PDFs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Token layer codified for both themes (Priority: P1)

A developer building any future Bristle screen can reference the full set of named design tokens — colors, typography, spacing, radii — and get the exact Editorial Light values by default and the exact Editorial Dark values when the dark theme is active, without hardcoding hex, pixel, or font values.

**Why this priority**: Every subsequent UI slice depends on this. Without a correct, complete token layer, every later component would either hardcode values (guaranteeing drift) or block. It is the foundation and the MVP of this slice — even with no card, a codified token layer that matches CLAUDE.md §4 is independently valuable.

**Independent Test**: Inspect the compiled stylesheet / `@theme` source: every Editorial Light and Editorial Dark token named in CLAUDE.md §4.1 is present with its exact hex; the type scale, spacing scale, and radius tokens from §4.2–§4.4 are present with exact values; switching the active theme swaps every color token to its Dark counterpart. Verifiable by a token-by-token diff against CLAUDE.md §4 with zero discrepancies.

**Acceptance Scenarios**:

1. **Given** the app stylesheet, **When** a token-by-token diff is run against CLAUDE.md §4.1, **Then** every Editorial Light and Editorial Dark color token is present with the exact hex and zero discrepancies are reported.
2. **Given** the default (light) theme, **When** a component references a surface/text/accent/border/status token, **Then** it resolves to the Editorial Light hex.
3. **Given** the dark theme is active, **When** the same component is rendered, **Then** every color token resolves to its Editorial Dark hex with no light values leaking through.
4. **Given** the three brand fonts, **When** the page loads, **Then** Inter (UI sans), Source Serif Pro (editorial serif), and JetBrains Mono (mono) are each available as a referenced token and applied to their respective roles.

---

### User Story 2 - Canonical Problem Card reference component (Priority: P2)

A developer (and a reviewing designer) can render the canonical Problem Card with a defined set of inputs and see it match the dashboard problem card in `design/Core_app.pdf` page 1 within a 4px tolerance — proving the token layer produces the intended visual.

**Why this priority**: This is the reference implementation of the design system. It validates that the tokens compose into the editorial look the product promises, and it becomes the pattern every later card/component copies. It depends on US1 but delivers the visible proof.

**Independent Test**: Render the card with representative inputs and compare against `Core_app.pdf` page 1: category pill (top-left, category-tinted), sparkline (top-right, brand accent), serif title, italic top-quote treatment with its source marker, and a footer row carrying source badges, the momentum delta, and a relative "last seen" time. All visual properties trace to tokens (no raw hex in the component source). Position and size match the PDF within 4px.

**Acceptance Scenarios**:

1. **Given** a complete set of card inputs, **When** the card renders, **Then** it shows — top-left — a category pill tinted to its category, and — top-right — a sparkline drawn in the brand accent color.
2. **Given** the same inputs, **When** the card renders, **Then** the problem title uses the editorial serif at the card-title scale, and the top quote renders in italic body text inside a filled `surface/raised` box with a leading circular source avatar.
3. **Given** the same inputs, **When** the card renders, **Then** the footer shows one distinct platform badge per `sources` entry, the momentum delta (number in `text/secondary` with an up arrow in `accent/validated` or a down arrow in `status/error`), and a human-relative time derived from the last-seen timestamp.
4. **Given** the card source code, **When** it is searched for hardcoded color values, **Then** zero hex color literals are found — every color flows from a token reference.
5. **Given** the card is placed in the dark theme, **When** it renders, **Then** every surface, text, border, and accent shifts to its Editorial Dark value while layout is unchanged.

---

### User Story 3 - Theme-switchable showcase homepage (Priority: P3)

A teammate opening the running app sees a showcase: two Problem Cards side by side in Editorial Light, and a control that switches the whole page to Editorial Dark and back, with both cards re-rendering in the dark palette — a one-screen demonstration that the token system works end to end.

**Why this priority**: It makes US1 and US2 demonstrable without any product scaffolding, and gives reviewers a single URL to judge the design system. It is the thinnest possible harness; it intentionally uses a throwaway manual toggle rather than the real theme system (deferred).

**Independent Test**: Open the homepage; confirm two cards render in light; activate the toggle; confirm the page's theme marker flips to dark and both cards visibly switch to the Editorial Dark palette; toggle back and confirm return to light.

**Acceptance Scenarios**:

1. **Given** the homepage on first load, **When** it renders, **Then** two Problem Cards appear side by side in Editorial Light and a theme toggle control is visible.
2. **Given** the homepage, **When** the toggle is activated, **Then** the document's theme marker is set to dark and both cards re-render in Editorial Dark.
3. **Given** the homepage in dark, **When** the toggle is activated again, **Then** the page returns to Editorial Light.

---

### Edge Cases

- **Sparkline with flat or single-value series**: a 14-point series where all values are equal must still render a valid (flat) line, not a divide-by-zero gap or empty SVG.
- **Negative or zero momentum**: the momentum delta must render with the correct sign and treatment for negative (e.g. "−12%") and zero ("0%") values, not only positive.
- **Long title / long quote**: titles and quotes longer than the card width must wrap or truncate gracefully without breaking the 4px-tolerance layout or overflowing neighbors.
- **Very recent / very old last-seen**: relative time must read sensibly across ranges (minutes, hours, days) including "just now" and multi-day spans.
- **Theme toggle and reduced motion**: the light↔dark switch must respect reduced-motion preferences (instant or opacity-only), per the motion rules.
- **Unknown category color**: a category value outside the defined set must fall back to a neutral pill rather than render an undefined/transparent color.
- **Footer with one source vs many**: a single-entry `sources` list renders one badge (no "+N"); a long list must render distinct badges without overflowing the footer (collapsing to "+N sources" if needed).

## Requirements *(mandatory)*

### Functional Requirements

**Token layer (US1)**

- **FR-001**: The system MUST define every Editorial Light color token named in CLAUDE.md §4.1 (`surface/*`, `border/*`, `text/*`, `accent/*`, `status/*`) with its exact hex value, as the default theme.
- **FR-002**: The system MUST define every Editorial Dark color token from CLAUDE.md §4.1 with its exact hex value, applied when the dark theme is active.
- **FR-003**: Theme selection MUST be driven by an explicit document-level marker (a `dark` theme attribute on the document root), not by the operating-system color-scheme media query.
- **FR-004**: The system MUST define typography tokens per CLAUDE.md §4.2 — three font-family roles (UI sans, editorial serif, mono) and the modular type scale from `display/xl` through `mono/sm`, each with its specified size, line-height, and letter-spacing.
- **FR-005**: The system MUST load the three brand fonts (Inter, Source Serif Pro, JetBrains Mono), Latin subset, weights 400/500/600/700, and expose each as a referenceable token used by the type roles.
- **FR-006**: The system MUST define the spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128) and the border-radius tokens (6px buttons, 8px cards, 12px modals/option-cards, 999px pills) per CLAUDE.md §4.3–§4.4 as named tokens.
- **FR-007**: All tokens MUST be expressed through the project's CSS-driven theming approach (no separate JS-based design-config file).
- **FR-007a**: The system MUST define a **category-tint token group** — a paired background+foreground tint for each of the 8 category keys (`payments, devtools, ai-ml, auth-sso, deployment, analytics, mobile, email`), in both Editorial Light and Editorial Dark (8 × 2 themes × {bg, fg}), matching the exact hex values in **CLAUDE.md §4.1a (Category tints)**. These tints are low-saturation and warm-compatible, with `devtools` anchored to `accent/bristle` and each fg-on-bg pair meeting WCAG AA. They are part of the SC-001 "zero diff vs §4" check.

**Canonical Problem Card (US2)**

- **FR-008**: The system MUST provide a single canonical Problem Card component whose visual layout matches `design/Core_app.pdf` page 1 (dashboard problem card) within a 4px tolerance.
- **FR-009**: The card MUST accept a defined input contract: problem title, category label, category color key, momentum (signed percentage), a 14-point sparkline series, a top-quote string, a quote-source key, a **list of source keys** (`sources`), and a last-seen timestamp. (See Key Entities.)
- **FR-010**: The card MUST render: a category pill (top-left) tinted per the category-tint token group; a sparkline (top-right) drawn in the brand accent color; the title in the editorial serif at the card-title scale; the top quote in italic body text inside a **filled `surface/raised` box with a leading circular source avatar** (matching `Core_app.pdf` p.1 — **no** accent left rule); and a footer row carrying **one distinct platform badge per entry in `sources`**, the momentum delta, and a relative last-seen time.
- **FR-010a**: The momentum delta MUST render the numeric percentage in `text/secondary`, preceded by a direction arrow: an up arrow in `accent/validated` for positive momentum, a down arrow in `status/error` for negative momentum. The body color of the number is **not** sign-based (always `text/secondary`); zero momentum renders without an arrow.
- **FR-010b**: When a source count is surfaced (e.g. "+N sources"), the value MUST derive from `sources.length`, not a separately supplied count.
- **FR-011**: The card MUST render the sparkline as inline vector graphics produced by a pure transformation of the numeric series into a stroke path — no charting/visualization library.
- **FR-012**: The card MUST be a non-interactive, server-rendered component (no client-side interactivity directive in its source).
- **FR-013**: The card source MUST contain zero hardcoded color literals; every color MUST resolve from a design token.
- **FR-014**: The card MUST render correctly in both Editorial Light and Editorial Dark with identical layout and only palette changes.
- **FR-015**: The card MUST handle the edge cases above (flat sparkline, non-positive momentum, overflow text, relative-time ranges, unknown category) without layout breakage.

**Showcase homepage (US3)**

- **FR-016**: The homepage MUST display two Problem Card instances side by side, in Editorial Light by default.
- **FR-017**: The homepage MUST provide a theme toggle that sets/clears the document-level dark theme marker; activating it MUST re-render both cards in the active palette.
- **FR-018**: The theme toggle MUST be the only interactive (client) element introduced this slice; the canonical card itself MUST remain server-rendered. The toggle MUST NOT use the project's eventual theme-management library (deferred) and MUST NOT persist the choice to browser storage.

**Quality gates (cross-cutting)**

- **FR-019**: Type-checking, linting, and a production build of the web app MUST all succeed with no errors.
- **FR-020**: The showcase page MUST meet the project's performance and accessibility floors (see Success Criteria), including labeled controls, keyboard reach for the toggle, visible focus, and reduced-motion handling.
- **FR-021**: The deployed preview MUST render the showcase identically to local.

### Key Entities *(include if feature involves data)*

- **Design Token**: A named, themeable value in one of five color groups (surface, border, text, accent, status) plus typography (family, size, line-height, tracking), spacing, and radius. Each color token has an Editorial Light value and an Editorial Dark value; the authoritative source is CLAUDE.md §4. Tokens are referenced by name, never by raw value.

- **Problem Card input contract**: The data a single card renders.
  - `title` — the problem statement (string).
  - `category` — human label for the category (string, e.g. "Payments").
  - `categoryColor` — color key selecting the pill tint; one of `payments | devtools | ai-ml | auth-sso | deployment | analytics | mobile | email`.
  - `momentum` — signed percentage change (number) shown as the delta.
  - `sparkline` — 14-element numeric series for the trend line.
  - `topQuote` — the representative quote (string).
  - `quoteSource` — platform key for the quote's origin (the avatar inside the quote box); one of `gh | hn | so | ph | ap | gp` (GitHub, Hacker News, Stack Overflow, Product Hunt, Apple App Store, Google Play).
  - `sources` — list of platform keys (`SourceKey[]`) the problem appears in; drives the footer's distinct platform badges, one per entry. Any "+N sources" affordance derives from `sources.length`.
  - `lastSeenIso` — ISO-8601 timestamp of the most recent mention, rendered as relative time.

- **Category-tint token group**: A mapping from each `categoryColor` key (8 keys) to a paired pill tint — `category/<name>/bg` and `category/<name>/fg` — in both Editorial Light and Editorial Dark. **Resolved (Q1, option a)**: the exact hex values are now defined in **CLAUDE.md §4.1a (Category tints)** — a documented extension to §4 (low-saturation chips, `devtools` anchored to `accent/bristle`, all pairs AA-contrast). They are covered by SC-001.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A token-by-token diff of the compiled token layer against CLAUDE.md §4 reports **zero discrepancies** for every Editorial Light and Editorial Dark color token from §4.1 **and** every category-tint token from the §4 category extension (8 keys × 2 themes × {bg, fg}).
- **SC-002**: All three brand fonts load and are each referenced as a named token used by the corresponding type role; no role falls back to a system default.
- **SC-003**: The canonical Problem Card is server-rendered — its source contains no client-interactivity directive.
- **SC-004**: The canonical Problem Card source contains **zero** hex color literals (100% of colors resolve from tokens).
- **SC-005**: The homepage renders exactly two Problem Card instances and one theme toggle control.
- **SC-006**: Activating the toggle flips the document root's theme marker to dark and both cards visibly switch to the Editorial Dark palette; deactivating returns to light.
- **SC-007**: Type-check, lint, and the web production build each complete with a zero (success) exit and no errors.
- **SC-008**: A Lighthouse run on the showcase page served from a **local production build** (`pnpm --filter web build && pnpm --filter web start`, not the dev server) scores **≥ 90** for Performance and **≥ 90** for Accessibility.
- **SC-009**: The deployed preview URL renders the showcase grid identically to the local page (same cards, same layout, same light/dark behavior) within the 4px tolerance.
- **SC-010**: The rendered card matches `design/Core_app.pdf` page 1 within a **4px** positional/size tolerance for the pill, sparkline, title, quote block, and footer row.

## Assumptions

- **Slice numbering**: This is slice **003** by the user's instruction (001 = walking skeleton; 002 = Spec Kit wiring, retroactively complete). The directory and branch use `003-design-tokens-and-problem-card`; the build plan's own ordering may label this "Slice 1.3."
- **Token source of truth**: CLAUDE.md §4 is authoritative for all token values. The spec references it rather than re-listing every hex, to avoid creating a second copy that could drift; "zero diff vs CLAUDE.md §4" is the binding check.
- **Quote treatment** (resolved Q2): the top quote renders inside a filled `surface/raised` box with a leading circular source avatar, matching `Core_app.pdf` p.1 exactly. There is **no** accent left rule.
- **Footer source badges** (resolved Q3): the contract carries `sources: SourceKey[]` plus `quoteSource: SourceKey`; the footer renders one distinct platform badge per `sources` entry, and any "+N sources" affordance derives from `sources.length`.
- **Momentum delta treatment** (resolved Q4): the number renders in `text/secondary` (not sign-based); a positive direction shows an up arrow in `accent/validated`, a negative direction a down arrow in `status/error`, zero shows no arrow.
- **Lighthouse target environment** (resolved Q5): SC-008 is measured against a **local production build** (`pnpm --filter web build && pnpm --filter web start`), not the dev server.
- **Manual toggle is throwaway**: The homepage toggle is a deliberate, temporary harness for this slice only; the real theme system (next-themes) and any persistence arrive in a later slice. No browser-storage writes this slice (project rule).
- **Scope discipline**: Only the token layer, the three fonts, the one canonical card, and the showcase homepage are built. No other components, no charting library, no data/auth/dashboard, no theme-management library.
- **Reduced motion**: The light↔dark transition follows the project motion rules (≤180ms, reduced-motion → instant/opacity-only).

## Clarifications

All five open questions were resolved by the user on 2026-05-21 and folded into the requirements above:

- **Q1 — Category palette → option (a)**: an 8-key category-tint token group (paired bg+fg, both themes) was added to **CLAUDE.md §4.1a** as a documented extension *within this slice*; SC-001 extended to cover them (FR-007a). The 16 paired hex values were derived from the design language (PDF shows near-uniform warm chips, so distinct hues are a documented extension), **approved by the user on 2026-05-21**, and authored into CLAUDE.md §4.1a.
- **Q2 — Quote block → PDF wins**: filled `surface/raised` box with a leading circular source avatar; the 4px accent left rule is dropped (FR-010).
- **Q3 — Footer badges → `sources: SourceKey[]`**: replaces `sourcesCount`; render one distinct platform badge per source; "+N sources" derives from `sources.length` (FR-009, FR-010, FR-010b).
- **Q4 — Momentum delta**: number in `text/secondary`; up arrow `accent/validated`, down arrow `status/error`; not sign-based body color (FR-010a).
- **Q5 — Lighthouse**: measured against a local production build, not the dev server (SC-008).

### Planning readiness

All clarifications are resolved and the category-tint values are authored into CLAUDE.md §4.1a (approved 2026-05-21). No outstanding gates — the spec is ready for `/speckit.plan`.
