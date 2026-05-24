// [PLACEHOLDER — review before production launch]
//
// All copy in this file is implementor-authored from spec FR-002 / FR-003 /
// FR-004 verbatim per the slice-008 user brief. Founder reviews and revises
// before the Tier-2 v0.2.0 tag (which ships after all of slices 2.1–2.7 land).
//
// Voice rules (CLAUDE.md §6) apply to every string here: no exclamation marks,
// no emoji, no hype register. Em-dashes are punctuation, not exclamations.

export interface AboutByline {
  publishedDate: string;
  author: string;
  readTime: string;
}

export interface AboutFounder {
  initials: string;
  name: string;
  bio: string;
}

export interface AboutContent {
  byline: AboutByline;
  paragraphs: readonly string[];
  pullQuote: string;
  // 0-based insertion index. 1 = renders the <blockquote> between paragraphs
  // 2 and 3 (i.e. after paragraphs[1] in display order).
  pullQuoteInsertAfterParagraph: number;
  founder: AboutFounder;
}

export const ABOUT_CONTENT: AboutContent = {
  byline: {
    publishedDate: "PUBLISHED 2026-05-24",
    author: "By Cornel Okoth",
    readTime: "3 min read",
  },
  paragraphs: [
    "Bristle began with a small, honest frustration. I had shipped two products to small audiences and a third to nobody at all. Each had been the result of a hunch that sounded plausible at a coffee shop and looked thin in the App Store. I did not lack ideas. I lacked evidence.",
    "The category called 'idea databases' had not aged well. The Reddit-only tools went down with API pricing. The trend products read like SEO bingo. The newsletter operators sold us their tastes for $300 a year. None of it answered the only question that mattered: where, exactly, are real builders complaining about something they would pay to make stop?",
    "So I built the tool I wanted. Bristle ingests technical and product complaints from six public sources — GitHub Issues, Hacker News, Stack Overflow, Product Hunt, Apple App Store, Google Play — and synthesizes them into reports. Each report tells you not just what hurts, but where, how often, how loudly, and increasingly: how much people would pay to fix it.",
    "The product is not 'AI-native' in any visible sense. We use machine learning to cluster duplicates and surface patterns; we do not put a chatbot on the home page. The work is editorial. Each report reads like a research journal entry because that is what it is.",
    "Bristle is a one-person company today. I have shipped to small audiences before. I am doing this one differently — with evidence, not vibes — because I want the same for you.",
  ],
  pullQuote:
    "Most product ideas die from being built before they were proven. The remedy is not more ideas — it is more evidence.",
  pullQuoteInsertAfterParagraph: 1,
  founder: {
    initials: "CO",
    name: "Cornel Okoth",
    bio: "Founder. Previously: software engineering across a few stacks; built and shipped consumer apps no one used so you don't have to.",
  },
} as const;
