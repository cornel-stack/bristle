# UI Contract: `ProblemCardFull`

The canonical reference component. Server Component, framework-agnostic, presentational only.

## Import
```ts
import { ProblemCardFull, type ProblemCardFullProps } from "@bristle/ui/problem-card-full";
// also available via the barrel: import { ProblemCardFull } from "@bristle/ui";
```

## Signature
```ts
function ProblemCardFull(props: ProblemCardFullProps): JSX.Element
```
See `data-model.md` for `ProblemCardFullProps`.

## Rendering contract (vs `design/Core_app.pdf` p.1, 4px tolerance)
1. **Container**: `surface/card` bg, 1px `border/default`, `radius-card` (8px), 24px padding.
2. **Header**: category pill (top-left, `radius-pill`, `category/<key>/bg` + `category/<key>/fg`); `<Sparkline>` (top-right, `accent/bristle` via currentColor).
3. **Title**: `font-serif`, `text-h3`, `text/primary`.
4. **Quote block**: `surface/raised` filled box, `radius-card`, 16px padding; leading circular source avatar (`quoteSource`); quote in `font-serif italic text-body-md text/secondary`. No accent left rule.
5. **Footer**: left = one circular badge per `sources` entry, each wrapping `<SourceIcon source={key} />` (inline monochrome brand mark via `currentColor`); right = momentum (number `text/secondary`; up arrow `accent/validated` / down arrow `status/error` / none if 0) `·` relative `lastSeenIso`.

## Guarantees
- **No `"use client"`** in the file (SC-003).
- **Zero hex literals** — all color via token utilities or `currentColor` (SC-004).
- **No inline `style`** — Tailwind utilities + SVG geometry attributes only.
- **Theme-agnostic** — identical layout in light/dark; only token values change (FR-014).
- **Resilient** to flat sparkline, non-positive momentum, long text, unknown category (edge cases).

## Accessibility
- Sparkline `aria-hidden` (decorative); momentum number carries meaning.
- Source badges have accessible labels (e.g. `aria-label="GitHub"`).
- Card is non-interactive (no focus traps); contrast meets AA (tokens chosen for AA).
