import Link from "next/link";
import { ProblemCardFull, type CategoryColor, type SourceKey } from "@bristle/ui";
import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";
import type { Problem } from "@bristle/db";

export function Hero({ problem }: { problem: Problem }) {
  const key = problem.category as CategoryKey;
  return (
    <section className="mx-auto grid max-w-6xl gap-loose px-grid py-section md:grid-cols-2 md:items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-pill bg-surface-raised px-snug py-1 text-body-sm text-text-secondary">
          <span className="size-2 rounded-pill bg-accent-validated" aria-hidden="true" />
          Now ingesting 6 sources · 142k problems indexed
        </span>
        <h1 className="mt-grid font-serif text-display-lg text-text-primary">
          Find real problems worth solving.
        </h1>
        <p className="mt-grid max-w-xl text-body-md text-text-secondary">
          Bristle ingests builder pain from GitHub, Hacker News, Stack Overflow, Product Hunt,
          and the App Stores, then synthesizes it into evidence-backed problem reports ranked
          by frequency, momentum, and willingness-to-pay.
        </p>
        <div className="mt-loose flex flex-wrap items-center gap-snug">
          <Link href="/signup" className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card">
            Start free →
          </Link>
          <a href="#sample" className="rounded-button border border-border-default px-grid py-2 text-body-md font-medium text-text-secondary">
            See sample problems
          </a>
        </div>
        <p className="mt-snug text-body-sm text-text-tertiary">
          No credit card · Cancel anytime · 7-day Pro trial
        </p>
      </div>
      <div className="md:justify-self-end">
        <ProblemCardFull
          title={problem.title}
          category={CATEGORY_LABELS[key]}
          categoryColor={problem.category as CategoryColor}
          momentum={problem.momentumPct}
          sparkline={problem.sparkline}
          topQuote={problem.topQuote}
          quoteSource={problem.quoteSource as SourceKey}
          sources={problem.sources as SourceKey[]}
          lastSeenIso={problem.lastSeenAt.toISOString()}
        />
      </div>
    </section>
  );
}
