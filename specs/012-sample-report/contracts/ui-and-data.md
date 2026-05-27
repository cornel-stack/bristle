# Phase 1 — UI + Data Contracts

## Canonical type module — `apps/web/src/components/problem/types.ts`

Full type tree pinned in `plan.md` decision §3. Summary of exported names:

| Name | Kind | Purpose |
|---|---|---|
| `SampleProblemSourceKey` | type alias (union) | One of: `"github" \| "hackernews" \| "stackoverflow" \| "reddit" \| "producthunt" \| "appstore" \| "playstore"` |
| `SampleProblemMomentum` | interface | `{ delta: string; windowDays: number }` |
| `SampleProblemSourceRow` | interface | `{ name: string; count: number }` |
| `SampleProblemEvidenceQuote` | interface | `{ authorHandle, source, upvotes, commentCount, timestamp, text, blurred }` |
| `SampleProblemRelatedItem` | interface | `{ slug, title, leadSnippet }` |
| `FrequencyWindow` | type alias (union) | `"7d" \| "30d" \| "90d" \| "all"` |
| `FrequencyPoint` | interface | `{ date: string; count: number }` (date = ISO yyyy-mm-dd) |
| `SampleProblemFrequencyData` | type alias | `Readonly<Record<FrequencyWindow, ReadonlyArray<FrequencyPoint>>>` |
| `SampleProblemPullQuote` | interface | `{ text: string; attribution?: string }` (matches slice-010 BlogPullQuote shape) |
| `SampleProblemBreadcrumb` | type alias | `ReadonlyArray<string>` |
| `SampleProblemBase` | interface | Common fields: slug, breadcrumb, title, momentum, firstSeenDate, firstSeenDisplay, quoteCount, sourceCount, sourceBadges, lead |
| `SampleProblemFull` | interface | `extends SampleProblemBase` + `stubBody: false` + full-report fields (pullQuote, body, sourcesBreakdown, frequencyData, evidenceQuotes, relatedProblems) |
| `SampleProblemStub` | interface | `extends SampleProblemBase` + `stubBody: true` |
| `SampleProblem` | type alias (discriminated union) | `SampleProblemFull \| SampleProblemStub` |

Discriminator: `stubBody: boolean` (true on stubs, false on the full record). TypeScript narrows on `if (problem.stubBody) {...} else {...}`.

## Data store — `apps/web/src/components/problem/sample-problems.ts`

Exports `SAMPLE_PROBLEMS: ReadonlyArray<SampleProblem>` with **5 entries** (1 full + 4 stubs).

Header marker (line 1, before imports):

```
// [PLACEHOLDER — sample problem content awaiting founder review before production launch]
```

Slug list (verbatim):

| Index | Slug | stubBody | Reach |
|---|---|---|---|
| 0 | `stripe-webhooks-vercel-cold-starts` | `false` | Direct URL only (Hero card is not a link) |
| 1 | `webhook-ordering-on-retries` | `true` | Stripe RelatedProblemsCard item 1 only |
| 2 | `llm-streaming-cdn-buffering` | `true` | Slice-005 SampleReports landing card + Stripe RelatedProblemsCard |
| 3 | `expo-ota-ios-18-4` | `true` | Slice-005 SampleReports landing card + Stripe RelatedProblemsCard |
| 4 | `pgvector-index-degradation-2m` | `true` | Slice-005 SampleReports landing card + Stripe RelatedProblemsCard |

Stripe full record content shape (per `plan.md` §4):
- `quoteCount: 47`, `sourceCount: 6`
- `sourceBadges`: 5 keys (one source omitted from the badge row)
- `sourcesBreakdown`: 4 rows summing to 47 (GitHub 26 / HN 13 / SO 3 / Other 5)
- `frequencyData`: 4 windowed datasets, total ~187 `{date, count}` points
- `evidenceQuotes`: 7 entries (5 `blurred: false` + 2 `blurred: true`)
- `relatedProblems`: 4 entries, each `slug` mapping to one of the 4 stub slugs above

## Page-local component prop contracts

| Component | Prop signature | Server/Client |
|---|---|---|
| `SampleBanner` | `()` (no props) | Server |
| `ProblemBreadcrumb` | `{ breadcrumb: SampleProblemBreadcrumb }` | Server |
| `ProblemMomentumChip` | `{ momentum: SampleProblemMomentum }` | Server |
| `ProblemSourceBadge` | `{ source: SampleProblemSourceKey }` | Server |
| `ProblemHero` | `{ problem: SampleProblem }` (reads title, momentum, sourceBadges, firstSeenDisplay, quoteCount, sourceCount) | Server |
| `ProblemPullQuote` | `{ quote: SampleProblemPullQuote }` | Server |
| `ProblemBody` | `{ problem: SampleProblem }` (branches on stubBody) | Server |
| `DonutChart` | `{ rows: ReadonlyArray<SampleProblemSourceRow>; total: number; ariaLabel: string }` | Server |
| `SourcesCard` | `{ problem: SampleProblemFull }` (renders eyebrow + DonutChart + breakdown list) | Server |
| `RelatedProblemsCard` | `{ items: ReadonlyArray<SampleProblemRelatedItem> }` | Server |
| `FrequencyChart` | `{ data: SampleProblemFrequencyData }` | **CLIENT** |
| `EvidenceQuote` | `{ quote: SampleProblemEvidenceQuote }` | Server |
| `EvidenceCTA` | `()` (no props) | Server |
| `EvidenceList` | `{ quotes: ReadonlyArray<SampleProblemEvidenceQuote> }` | Server |
| `ProblemLayout` | `{ problem: SampleProblem }` | Server |

## Pure helper contracts

| File | Exports | Behavior |
|---|---|---|
| `donut-math.ts` | `polarToCartesian(cx, cy, r, angleDeg) → {x, y}` | -90° rotation so 0° = North (12 o'clock). |
|  | `describeArc(cx, cy, outerR, innerR, startAngle, endAngle) → string` | Builds an SVG `<path d>` string for one donut segment. |
|  | `buildDonutSegments({rows, total, cx, cy, outerRadius, innerRadius}) → Array<{name, count, pct, path}>` | Sorts rows DESC, accumulates angles, returns per-segment path string + pct rounded to integer. |
| `frequency-math.ts` | `buildLinePath(points) → {pathD, dots, xTicks, yTicks}` | Y-axis scaled to max-count + 10% headroom; X-axis evenly spaced; returns SVG path string + dot array + x-tick labels at FEB 11 / MAR 13 / APR 12 / MAY 10 + y-tick array. |
|  | `calculateAxisTicks(points)` (if extracted) | Returns label positions for x-axis. |

## Route metadata contract — `/problems/[slug]`

```ts
export async function generateStaticParams() {
  return SAMPLE_PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const problem = SAMPLE_PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};
  return {
    metadataBase: new URL(SITE_URL),
    title: `${problem.title} — Bristle`,
    description: problem.stubBody
      ? "Sample problem report — full report forthcoming."
      : truncate(problem.lead, 155),
    openGraph: {
      title: `${problem.title} — Bristle`,
      description: /* same as above */,
      type: "article",
      url: `${SITE_URL}/problems/${problem.slug}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
  };
}
```

Unknown slug → `notFound()` → HTTP 404.

## Cross-slice link contract

| Source slice | Source file | Reference | Slice 012 destination |
|---|---|---|---|
| 005 | `apps/web/src/components/landing/sample-reports.tsx:28` | `href={`/problems/${problem.slug}`}` × 3 | `/problems/llm-streaming-cdn-buffering`, `/problems/expo-ota-ios-18-4`, `/problems/pgvector-index-degradation-2m` (stub pages) |
| 005 | `apps/web/src/components/landing/hero.tsx` | `<ProblemCardFull problem={hero} />` (NO `href`) | (none — direct URL only) |
| 012 | `apps/web/src/components/problem/related-problems-card.tsx` | 4 `<a href="/problems/{slug}">` | `/problems/webhook-ordering-on-retries`, `/problems/llm-streaming-cdn-buffering`, `/problems/expo-ota-ios-18-4`, `/problems/pgvector-index-degradation-2m` |
| 012 | `apps/web/src/components/problem/sample-banner.tsx` | `<Link href="/signup">` | `/signup` (slice-005 known soft-404; auth-tier slice will replace) |
| 012 | `apps/web/src/components/problem/evidence-cta.tsx` | `<a href="/signup">` | `/signup` (same) |
