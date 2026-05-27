// Shared SampleProblem + sub-shapes for slice-012 Sample report detail page.
//
// SampleProblem is a true DISCRIMINATED UNION over the `stubBody` literal
// boolean — `SampleProblemFull` (stubBody: false) carries the complete
// problem-report payload (lead + pullQuote + body + sourcesBreakdown +
// frequencyData + evidenceQuotes + relatedProblems); `SampleProblemStub`
// (stubBody: true) carries only the hero-meta fields needed to render the
// stub-treatment page. The union shape lets TypeScript narrow on
// `if (problem.stubBody) { ... } else { ... }` so ProblemBody + ProblemLayout
// can read full-report fields WITHOUT non-null assertions.
//
// This is an intentional improvement on the slice-010 BlogArticle pattern,
// which used `stubBody: boolean` + optional `pullQuote?`/`body.stubLead?`
// + empty `sections: []` for stubs — requiring runtime nullability checks
// at every consumer. The slice-012 discriminator catches data-store mistakes
// (e.g. a stub entry accidentally setting `pullQuote`) at compile time.
//
// The data store at sample-problems.ts exports SAMPLE_PROBLEMS:
// ReadonlyArray<SampleProblem> with exactly 5 entries (1 full + 4 stubs).
// /problems/[slug]/page.tsx's `generateStaticParams` enumerates the 5 slugs.

export type SampleProblemSourceKey =
  | "github"
  | "hackernews"
  | "stackoverflow"
  | "reddit"
  | "producthunt"
  | "appstore"
  | "playstore";

export interface SampleProblemMomentum {
  /** Pre-formatted delta string, e.g. "+312%". The number is the load-bearing fact (CLAUDE.md §6). */
  delta: string;
  windowDays: number;
}

export interface SampleProblemSourceRow {
  /** Display name as it appears in the breakdown list, e.g. "GitHub", "Hacker News", "Stack Overflow", "Other". */
  name: string;
  count: number;
}

export interface SampleProblemEvidenceQuote {
  authorHandle: string;
  source: SampleProblemSourceKey;
  upvotes: number;
  commentCount: number;
  /** Pre-formatted absolute or relative timestamp, e.g. "Mar 12" / "5 days ago". Compile-time string (no runtime Intl). */
  timestamp: string;
  text: string;
  /** When true, EvidenceQuote applies Tailwind blur-sm to the quote text only; author row stays sharp. */
  blurred: boolean;
}

export interface SampleProblemRelatedItem {
  slug: string;
  title: string;
  /** Short single-line teaser (~80-120 chars). */
  leadSnippet: string;
}

export type FrequencyWindow = "7d" | "30d" | "90d" | "all";

export interface FrequencyPoint {
  /** ISO yyyy-mm-dd. */
  date: string;
  count: number;
}

/** Keyed at the type level so FrequencyChart consumers can't read an unknown window without a compile error. */
export type SampleProblemFrequencyData = Readonly<
  Record<FrequencyWindow, ReadonlyArray<FrequencyPoint>>
>;

export interface SampleProblemPullQuote {
  text: string;
  attribution?: string;
}

/**
 * Tuple of breadcrumb labels rendered as plain text with " / " separators.
 * Typically 3-level: ["Library", "<Section>", "<Subsection>"].
 */
export type SampleProblemBreadcrumb = ReadonlyArray<string>;

/** Fields shared by full + stub variants. */
export interface SampleProblemBase {
  /** kebab-case; 3 of 4 stub slugs match slice-004 packages/db/src/seed.ts verbatim (link-flip targets). */
  slug: string;
  breadcrumb: SampleProblemBreadcrumb;
  title: string;
  momentum: SampleProblemMomentum;
  /** ISO yyyy-mm-dd. */
  firstSeenDate: string;
  /** Pre-formatted display label, e.g. "Feb 8". Compile-time string. */
  firstSeenDisplay: string;
  quoteCount: number;
  sourceCount: number;
  /** Up to 5 source keys rendered as small circular badges in the hero meta row. No overflow indicator. */
  sourceBadges: ReadonlyArray<SampleProblemSourceKey>;
  /** Single-sentence problem teaser. Renders in the hero meta region + drives full-problem Metadata description. */
  lead: string;
}

/** Full problem detail — all design-page-7 sections render. */
export interface SampleProblemFull extends SampleProblemBase {
  stubBody: false;
  pullQuote: SampleProblemPullQuote;
  body: string;
  sourcesBreakdown: ReadonlyArray<SampleProblemSourceRow>;
  frequencyData: SampleProblemFrequencyData;
  evidenceQuotes: ReadonlyArray<SampleProblemEvidenceQuote>;
  relatedProblems: ReadonlyArray<SampleProblemRelatedItem>;
}

/** Stub problem — renders only the hero + "Full problem report forthcoming." caption. */
export interface SampleProblemStub extends SampleProblemBase {
  stubBody: true;
}

/**
 * Discriminated union over `stubBody`. TypeScript narrows on
 * `if (problem.stubBody) { ... } else { ... }` — full-report fields
 * are accessible without non-null assertions on the `else` branch.
 */
export type SampleProblem = SampleProblemFull | SampleProblemStub;
