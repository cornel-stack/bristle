// [PLACEHOLDER — article content awaiting founder review before production launch]
//
// One featured article (full body — 2-paragraph lead, 4 numbered sections,
// inline pull-quote on section 1, inline figure on section 1) plus six
// stub-body articles (each carries card metadata + a single stubLead
// paragraph; BlogPostBody renders these as the stub treatment per FR-011).
//
// All seven articles use authorName "Cornel Okoth" and authorInitials "CO"
// per clarification (f) / FR-021 (overrides the design's Elena Hwang /
// Jules Marin placeholder bylines). displayDate is a fixed pre-formatted
// string per article (clarification (g) / FR-022) — no runtime Intl.

import type { BlogArticle } from "./types";

export const BLOG_ARTICLES: ReadonlyArray<BlogArticle> = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. FEATURED — full body, 4 sections, inline pull-quote + figure
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "what-50000-github-issues-reveal-about-developer-pain",
    category: "data-analysis",
    date: "2026-05-08",
    displayDate: "MAY 8 2026",
    title: "What 50,000 GitHub issues reveal about developer pain.",
    summary:
      "We analyzed every closed-as-wontfix issue across the 200 most-starred repos. The patterns are not where you expect.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 9,
    featured: true,
    stubBody: false,
    pullQuote: {
      text: "17% of closed-wontfix issues never receive a third opinion.",
      attribution: "— from the analysis",
    },
    body: {
      lead: [
        "The first answer most product tools give you is 'look at trends.' That answer is wrong. Trends tell you what people are talking about. They do not tell you what people are frustrated by. Those are different surfaces with different motivations, and you build different things from them.",
        "For this analysis we sampled every issue closed-as-wontfix across the 200 most-starred repositories on GitHub from 2024 through Q1 2026. The dataset is 50,318 issues, 416,440 comments, and a long aftermath of arguments. Three patterns emerged that we did not expect.",
      ],
    },
    sections: [
      {
        id: "scope-refusals",
        title: "One: most refusals are about scope, not capability.",
        railTitle: "Scope refusals",
        paragraphs: [
          "Maintainers close issues when they could fix them, but the fix would take the project somewhere they do not want it to go. This is the gap where products are born. The closed-wontfix label is the closest thing the open source ecosystem has to a 'yes, but not here' signal.",
          "The implication for builders: closed-wontfix is your idea backlog. We rank our reports partly on this.",
        ],
        pullQuote: {
          text: "The closed-wontfix label is the closest thing the open source ecosystem has to a 'yes, but not here' signal.",
          attribution: "— from the analysis",
        },
        figure: {
          eyebrow: "FIGURE 1 · WONTFIX CLOSURES BY CATEGORY",
          caption:
            "Devtools and developer-experience closures grew 4.1× while infrastructure stayed flat.",
          placeholderText:
            "Chart placeholder — line chart, 24-month rising trend",
        },
      },
      {
        id: "comment-count",
        title: "Two: comment count is the demand signal you ignore at your peril.",
        railTitle: "Comment count",
        paragraphs: [
          "An issue that closes with three comments is a non-event. An issue that closes with 80 comments — over five months, with the same five users returning — is a product. We re-ranked the dataset by sustained comment cadence and found that 17% of closed-wontfix issues never receive a third opinion, but the long tail is enormous.",
        ],
      },
      {
        id: "willingness-to-pay",
        title: "Three: willingness-to-pay leaks out in comments.",
        railTitle: "Willingness-to-pay",
        paragraphs: [
          "You will find phrases like 'I'd literally pay for this' in 2.3% of long-comment threads. The percentage sounds small. The absolute number across 50,000 issues is not. Bristle treats these phrases as a column.",
        ],
      },
      {
        id: "method-data",
        title: "Method & data.",
        railTitle: "Method & data",
        paragraphs: [
          "We pulled issues from GitHub's public API across the 200 highest-starred repositories spanning JavaScript, Python, Go, Rust, and Ruby ecosystems. Closed-as-wontfix was extracted from the issue's closing label; comments were tokenized and classified for sentiment, willingness-to-pay phrases, and back-and-forth cadence.",
          "The full anonymized dataset is available to Pro and Team subscribers in the methods download — including the SQL queries we used and the labeled training set for the willingness-to-pay classifier.",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2-7. SIX SECONDARY ARTICLES — stub body (stubLead only, sections empty)
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "three-signals-that-separate-a-product-from-a-feature",
    category: "product-strategy",
    date: "2026-05-01",
    displayDate: "MAY 1 2026",
    title: "Three signals that separate a product from a feature.",
    summary:
      "You can read 200 complaints and still build the wrong thing. Here is the heuristic we use to tell which clusters are products.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 6,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "You can read 200 complaints and still build the wrong thing. Here is the heuristic we use to tell which clusters are products — and which are just features the maintainer should have shipped years ago.",
    },
    sections: [],
  },
  {
    slug: "how-we-tracked-4m-unmet-demand-developer-tool-60-days",
    category: "indie-hacker",
    date: "2026-04-22",
    displayDate: "APR 22 2026",
    title: "How we tracked $4M in unmet demand for one developer tool in 60 days.",
    summary:
      "A case study using the willingness-to-pay column you have been ignoring.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 7,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "A case study using the willingness-to-pay column you have been ignoring. Sixty days, one developer tool, one spreadsheet we wish we had built sooner.",
    },
    sections: [],
  },
  {
    slug: "vercel-cold-starts-shared-hosting-cpu-limits",
    category: "devtools",
    date: "2026-04-14",
    displayDate: "APR 14 2026",
    title: "Vercel cold starts are the new shared-hosting CPU limits.",
    summary:
      "A frequency chart, a momentum chart, and three quotes that should worry the serverless industry.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 5,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "A frequency chart, a momentum chart, and three quotes that should worry the serverless industry. The pattern from 2014 is back, just with smaller granularity.",
    },
    sections: [],
  },
  {
    slug: "why-pricing-pages-worst-place-discover-demand",
    category: "product-strategy",
    date: "2026-04-03",
    displayDate: "APR 3 2026",
    title: "Why pricing pages are the worst place to discover demand.",
    summary:
      "Comparing what people say they will pay versus what they actually say in support tickets.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 8,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "Comparing what people say they will pay versus what they actually say in support tickets. The two numbers are not the same and the gap is where most product mistakes live.",
    },
    sections: [],
  },
  {
    slug: "field-notes-32-paid-customer-interviews",
    category: "indie-hacker",
    date: "2026-03-27",
    displayDate: "MAR 27 2026",
    title: "Field notes from 32 paid customer interviews.",
    summary:
      "A small experiment, with verbatim transcripts. The hits and the duds.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 11,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "A small experiment, with verbatim transcripts. The hits and the duds — and a heuristic for which question always produces a usable answer.",
    },
    sections: [],
  },
  {
    slug: "app-store-reviews-most-underused-product-research-surface",
    category: "data-analysis",
    date: "2026-03-20",
    displayDate: "MAR 20 2026",
    title: "App Store reviews are the most under-used product research surface.",
    summary:
      "They are public, attributed, time-stamped, and ignored by every tool that calls itself 'AI-native'.",
    authorName: "Cornel Okoth",
    authorInitials: "CO",
    readTimeMinutes: 6,
    featured: false,
    stubBody: true,
    body: {
      lead: [],
      stubLead:
        "They are public, attributed, time-stamped, and ignored by every tool that calls itself 'AI-native.' The result is one of the most overlooked datasets in product research.",
    },
    sections: [],
  },
];
