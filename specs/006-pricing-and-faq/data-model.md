# Data Model: Pricing + FAQ

**No database schema change. No new query helpers. No DB reads at all this slice.**

Both pages are content-static. The "data" this slice introduces is TypeScript constants colocated with their consumers under `apps/web/src/components/{pricing,faq}/`. The shapes below are the typed contracts those constants conform to.

## Pricing

### `Tier` — `apps/web/src/components/pricing/tier-data.ts`

```ts
export interface Tier {
  name: "Starter" | "Pro" | "Team";
  eyebrow: string;                  // ALL-CAPS render of the name
  monthlyPriceUsd: number;          // source of truth; annual = round(× 0.7)
  tagline: string;
  ctaLabel: string;                 // "Choose Starter" | "Start Pro trial" | "Choose Team"
  ctaHref: string;                  // "/signup" for all three (slice-005 stub)
  ctaVariant: "primary" | "outline";
  isMostPopular: boolean;
  features: string[];               // bullet list per the design
}
```

#### Three instances (fixed values from the design)

| field | Starter | Pro (highlighted) | Team |
|---|---|---|---|
| `name` | `"Starter"` | `"Pro"` | `"Team"` |
| `eyebrow` | `"STARTER"` | `"PRO"` | `"TEAM"` |
| `monthlyPriceUsd` | `29` | `79` | `199` |
| `tagline` | per design subhead | per design subhead | per design subhead |
| `ctaLabel` | `"Choose Starter"` | `"Start Pro trial"` | `"Choose Team"` |
| `ctaHref` | `"/signup"` | `"/signup"` | `"/signup"` |
| `ctaVariant` | `"outline"` | `"primary"` | `"outline"` |
| `isMostPopular` | `false` | `true` | `false` |
| `features` | per design bullet list | per design bullet list | per design bullet list |

Annual display: `Math.round(monthlyPriceUsd * 0.7)` → Starter `$20/month`, Pro `$55/month`, Team `$139/month`, each with a "billed annually" caption.

### `CompareRow` — `apps/web/src/components/pricing/compare-data.ts`

```ts
export type CompareCell = string | { kind: "check" } | { kind: "dash" };

export interface CompareRow {
  label: string;
  starter: CompareCell;
  pro: CompareCell;
  team: CompareCell;
}
```

#### Nine instances (fixed values per FR-006)

| `label` | `starter` | `pro` | `team` |
|---|---|---|---|
| "Tracked categories" | `"5"` | `"Unlimited"` | `"Unlimited"` |
| "Saved problems" | `"50"` | `"Unlimited"` | `"Unlimited"` |
| "Alert delivery" | `"Daily email"` | `"Email · in-app · API"` | `"Email · Slack · webhook"` |
| "Comparison view" | `{kind:"dash"}` | `"Up to 4"` | `"Up to 4"` |
| "API access" | `{kind:"dash"}` | `"50k req/mo"` | `"200k req/mo"` |
| "Team seats" | `"1"` | `"1"` | `"5 included"` |
| "Shared collections" | `{kind:"dash"}` | `{kind:"dash"}` | `{kind:"check"}` |
| "SSO" | `{kind:"dash"}` | `{kind:"dash"}` | `{kind:"check"}` |
| "Support" | `"Community"` | `"Priority email"` | `"Dedicated CSM"` |

Rendering: `string` → as-is; `{kind:"check"}` → `<Check className="size-4 stroke-[1.5]" aria-label="included"/>`; `{kind:"dash"}` → em-dash character `—`.

The Pro column header (in `compare-table.tsx`) gets `text-accent-bristle` per FR-006.

## FAQ

### `FaqItem` + `FaqSection` — `apps/web/src/components/faq/faq-data.ts`

```ts
export type FaqSection =
  | "pricing"
  | "data-sources"
  | "privacy"
  | "cancellation"
  | "api";

export interface FaqItem {
  id: string;        // "faq-q-1" … "faq-q-12" (stable; shared with the scroll-spy rail anchors)
  question: string;
  answer: string;    // FR-012 locks faq-q-1; the other 11 are implementor-authored per voice + FR-012a
  section: FaqSection;
}
```

#### Twelve instances (FR-011 order)

| `id` | `question` (paraphrased) | `section` | answer authority |
|---|---|---|---|
| `faq-q-1` | Where does Bristle get its data? | `data-sources` | **FR-012 verbatim** |
| `faq-q-2` | Is reading App Store reviews legal? | `data-sources` | implementor (voice) |
| `faq-q-3` | Can I cancel any time? | `cancellation` | implementor (voice) |
| `faq-q-4` | What about GDPR? | `privacy` | implementor (voice) |
| `faq-q-5` | Do you offer a refund? | `pricing` | implementor (voice) — **FR-012a triggers if refund-window claim** |
| `faq-q-6` | How fresh is the data? | `data-sources` | implementor (voice) — **FR-012a triggers if exact cadence claim** |
| `faq-q-7` | Does the API include synthesis text? | `api` | implementor (voice) |
| `faq-q-8` | Is there a free tier? | `pricing` | implementor (voice) — **FR-012a triggers if free-tier rule claim** |
| `faq-q-9` | Can I request a new category? | `api` | implementor (voice) — **FR-012a triggers if SLA claim** |
| `faq-q-10` | How do you cluster duplicates? | `data-sources` | implementor (voice) |
| `faq-q-11` | Will I see clusters from my own GitHub issues? | `privacy` | implementor (voice) — **FR-012a triggers if retention/residency claim** |
| `faq-q-12` | Can I export data? | `api` | implementor (voice) |

The locked answer for `faq-q-1`:
> *"We ingest from six public sources via official APIs and approved scrapers: GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, and Google Play. We never use private channels or content behind authentication walls."*

File header carries the `Policy claims needing founder sign-off (FR-012a)` comment block listing any triggered items (or `None this PR.`). The PR description mirrors that block under the identical heading.

### `RailSection` — `apps/web/src/components/faq/scroll-spy-rail.tsx`

```ts
interface RailSection { id: FaqSection; label: string; }
const SECTIONS: readonly RailSection[] = [
  { id: "pricing",      label: "Pricing" },
  { id: "data-sources", label: "Data sources" },
  { id: "privacy",      label: "Privacy" },
  { id: "cancellation", label: "Cancellation" },
  { id: "api",          label: "API" },
] as const;
```

Five instances, in design order. The `FaqSection` union is the same one `FaqItem.section` consumes — typo'd section in `faq-data.ts` is a compile error, not a runtime "active never updates" silent failure.

## Cross-references

- `Tier.ctaHref` and the Enterprise card target → known stubs: `/signup` (slice-005, becomes real in Tier 3), `/contact` (becomes real in slice 2.3).
- `FaqItem.section` → must match a `RailSection.id` (enforced by the shared `FaqSection` union).
- `faq-q-1` is the `<Accordion.Root defaultValue>` and the `setActive` initial value for the scroll-spy rail (so the rail's `data-sources` pill is highlighted on first paint, matching the open accordion item).

## What this slice does NOT touch

- `packages/db` query helpers (`getFirstProblem`, `getProblemBySlug`, `getRecentProblems`) — preserved, unused this slice.
- `packages/ui` exports (`ProblemCardFull`, `ProblemCardCompact`, `Sparkline`, `SourceIcon`) — preserved, unused this slice.
- `packages/shared` exports (`SITE_URL`, `CATEGORY_LABELS`, etc.) — `SITE_URL` consumed by both new `metadata` objects; nothing modified.
- Tokens, fonts, motion config — preserved, consumed via Tailwind utilities only.
- `problems` table — no rows added/changed; no migrations.
