# Contracts: UI + DB surfaces (Slice 005)

## `@bristle/ui` — new export

```ts
import { ProblemCardCompact, type ProblemCardCompactProps } from "@bristle/ui";
// also: @bristle/ui/problem-card-compact
```
Server Component (no `"use client"`). Renders a **denser** version of `ProblemCardFull`: category pill (top-left) + **small inline sparkline** (top-right), serif `text-h4` title (2-line clamp), a **tighter italic quote with a leading source avatar** (~2-line clamp), and a footer with `SourceIcon` source cluster + momentum delta + relative time. **Keeps** the quote + sparkline; **drops** the canonical's separate large-sparkline/"14-day mentions" row, the bottom "{n} quotes · {n} sources" meta line, and "Open report →". Padding 16px (< 24px), zero hex literals. Optional `href` wraps the card in a link.

**Guarantees**: additive only — `ProblemCardFull` and the design tokens are unchanged.

## `@bristle/db` — new exports (existing `getFirstProblem` preserved)

```ts
export function getProblemBySlug(slug: string): Promise<Problem>;            // throws if absent
export function getRecentProblems(opts: { limit: number; excludeSlug?: string }): Promise<Problem[]>; // empty[] on empty DB, never throws
```
Both return the existing `Problem` row type. Consumed server-side only (in `page.tsx`).

## `@bristle/shared` — new export

```ts
export const SITE_URL = "https://bristle.vercel.app" as const;
```

## Landing route metadata (`apps/web/src/app/page.tsx`)
- `metadataBase: new URL(SITE_URL)`, `title`, `description`, `openGraph: { title, description, type: "website", url: SITE_URL + "/", images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }] }`.
- `export const dynamic = "force-dynamic"`.

## Stub routes
`/pricing`,`/about`,`/blog`,`/changelog`,`/login`,`/signup` → `<ComingSoon version="…" />` + `export const metadata = { robots: { index: false, follow: false } }`. Each returns 200.
