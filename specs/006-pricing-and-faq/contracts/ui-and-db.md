# Contracts: UI + DB surfaces (Slice 006)

## `@bristle/db` — **no change**

This slice does not modify, add, or remove any DB query helper. The slice-005 surface (`getFirstProblem`, `getProblemBySlug`, `getRecentProblems`, `getDb`) is preserved as-is. Neither new route reads from the database.

## `@bristle/ui` — **no API change; one new top-level dep**

No new components exported. No existing exports modified. The package's `dependencies` gain one entry:

```json
"dependencies": {
  "lucide-react": "1.16.0",
  "@radix-ui/react-accordion": "^1.x"
}
```

This is the only specific Radix primitive package needed this slice. Future consumers (Tier 3+) inherit it via `@bristle/ui`'s dependency graph.

## `@bristle/shared` — **no change**

`SITE_URL` is consumed (not modified) by both new routes' `metadata` exports.

## New app-local components (no public package surface)

These live under `apps/web/src/components/{pricing,faq}/` — page-specific, not re-exported.

### Pricing components

```ts
// tier-data.ts (server-side TS module, no JSX)
export interface Tier { /* see data-model.md */ }
export const TIERS: readonly Tier[];                    // 3 instances

// compare-data.ts (server-side TS module, no JSX)
export type CompareCell = string | { kind: "check" } | { kind: "dash" };
export interface CompareRow { /* see data-model.md */ }
export const COMPARE_ROWS: readonly CompareRow[];       // 9 instances

// billing-section.tsx ("use client")
export function PricingBillingSection(): JSX.Element;
//   owns useState<"monthly"|"annual">; renders Toggle + 3× TierCard

// billing-toggle.tsx ("use client")
export interface PricingBillingToggleProps {
  value: "monthly" | "annual";
  onChange: (next: "monthly" | "annual") => void;
}
export function PricingBillingToggle(props: PricingBillingToggleProps): JSX.Element;
//   radiogroup with arrow-key nav; "-30%" badge on Annual pill

// tier-card.tsx (server component)
export interface TierCardProps { tier: Tier; billingMode: "monthly" | "annual"; }
export function TierCard(props: TierCardProps): JSX.Element;
//   computes displayedMonthly = Math.round(tier.monthlyPriceUsd * 0.7) when annual,
//   else tier.monthlyPriceUsd; shows "billed annually" caption in annual mode only.

// compare-table.tsx (server component)
export function CompareTable(): JSX.Element;
//   renders COMPARE_ROWS as a <table>; Pro column header uses text-accent-bristle;
//   string cells render as-is; {kind:"check"} → lucide Check at stroke-[1.5];
//   {kind:"dash"} → em-dash.

// hero.tsx (server component)
export function PricingHero(): JSX.Element;

// enterprise-card.tsx (server component)
export function EnterpriseCard(): JSX.Element;
//   outline "Contact sales →" → /contact (out-of-scope-known-404 until slice 2.3)
```

### FAQ components

```ts
// faq-data.ts (server-side TS module, no JSX)
//   FILE HEADER COMMENT: "Policy claims needing founder sign-off (FR-012a):" + bullets
//   (the same bullets are mirrored into the PR description under the same heading)
export type FaqSection = "pricing" | "data-sources" | "privacy" | "cancellation" | "api";
export interface FaqItem { id: string; question: string; answer: string; section: FaqSection; }
export const FAQ_ITEMS: readonly FaqItem[];             // 12 instances; faq-q-1 verbatim

// accordion.tsx ("use client")
export function FaqAccordion(): JSX.Element;
//   <Accordion.Root type="single" collapsible defaultValue="faq-q-1">
//   each <Accordion.Item value="faq-q-N" data-section="..." data-faq-item id="faq-q-N">
//   ESC-to-close via onKeyDown wrapper on Root.

// scroll-spy-rail.tsx ("use client")
export function FaqScrollSpyRail(): JSX.Element;
//   IntersectionObserver with rootMargin "-80px 0px -55% 0px", threshold 0
//   active = topmost intersecting [data-faq-item]'s data-section; sticky if not, keep previous
//   click handler → scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" })
//   layout: vertical sticky rail (md+); horizontal pill row with role="tablist" (<md)

// still-stuck-card.tsx (server component)
export function StillStuckCard(): JSX.Element;
//   static; below the rail; "Contact support →" → /contact

// faq-body.tsx (server component)
export function FaqBody(): JSX.Element;
//   2-col container: left = <FaqScrollSpyRail/> + <StillStuckCard/>; right = <FaqAccordion/>

// hero.tsx (server component)
export function FaqHero(): JSX.Element;

// bottom-cta.tsx (server component)
export function FaqBottomCta(): JSX.Element;
//   "Email a human at support@bristle.dev." → mailto:support@bristle.dev
//   "Open a ticket →" → /contact (out-of-scope-known-404)
```

## Route metadata exports

### `apps/web/src/app/pricing/page.tsx`

```ts
import { SITE_URL } from "@bristle/shared";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Pricing — Bristle",
  description: "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%.",
  openGraph: {
    title: "Pricing — Bristle",
    description: "Three plans for finding real problems worth solving. Cancel any time, annual saves 30%.",
    type: "website",
    url: SITE_URL + "/pricing",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};
// NO robots field → indexable by default (FR-017)
```

### `apps/web/src/app/faq/page.tsx`

```ts
import { SITE_URL } from "@bristle/shared";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FAQ — Bristle",
  description: "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API.",
  openGraph: {
    title: "FAQ — Bristle",
    description: "Answers to the most common questions about Bristle's data sources, pricing, privacy, and API.",
    type: "website",
    url: SITE_URL + "/faq",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};
// NO robots field → indexable by default (FR-017)
```

Both routes export their default async Server Component composing the slice-005 `TopNav` + the per-page sections + the slice-005 `SiteFooter`.

## One-line diff to a shipped slice-005 file

`apps/web/src/components/landing/site-footer.tsx` line 27:

```diff
- { label: "Help center", href: "/help" },
+ { label: "Help center", href: "/faq" },
```

Explicit mandate from FR-016. Ships in its own commit for reviewability.

## Out-of-scope-known-404 CTAs (consumed by this slice; not 2.2 defects)

- `/contact` — Enterprise card, FAQ rail Still-Stuck card, FAQ bottom CTA. Becomes real in slice 2.3.
- `/signup` — all three tier-card CTAs. Slice-005 stub; Tier 3 overwrites.
- `mailto:support@bristle.dev` — FAQ bottom CTA. Not a route; the browser handles it.
