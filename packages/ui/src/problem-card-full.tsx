// Canonical problem card — the reference implementation of the Bristle design
// system. Pure presentational Server Component: no "use client", no hooks, no
// browser APIs. Every color flows from a design token (no hex literals).
import { ArrowDown, ArrowUp } from "lucide-react";
import { Sparkline } from "./sparkline";
import { SourceIcon, SOURCE_LABELS, type SourceKey } from "./source-icons";

export type { SourceKey };

export type CategoryColor =
  | "payments"
  | "devtools"
  | "ai-ml"
  | "auth-sso"
  | "deployment"
  | "analytics"
  | "mobile"
  | "email";

export interface ProblemCardFullProps {
  title: string;
  category: string;
  categoryColor: CategoryColor;
  momentum: number;
  sparkline: number[];
  topQuote: string;
  quoteSource: SourceKey;
  sources: SourceKey[];
  lastSeenIso: string;
}

// Static, fully-spelled utility strings so Tailwind's scanner detects each class
// (no runtime interpolation → no purge misses).
const CATEGORY_CLASSES: Record<CategoryColor, string> = {
  payments: "bg-category-payments-bg text-category-payments-fg",
  devtools: "bg-category-devtools-bg text-category-devtools-fg",
  "ai-ml": "bg-category-ai-ml-bg text-category-ai-ml-fg",
  "auth-sso": "bg-category-auth-sso-bg text-category-auth-sso-fg",
  deployment: "bg-category-deployment-bg text-category-deployment-fg",
  analytics: "bg-category-analytics-bg text-category-analytics-fg",
  mobile: "bg-category-mobile-bg text-category-mobile-fg",
  email: "bg-category-email-bg text-category-email-fg",
};
const CATEGORY_NEUTRAL = "bg-surface-raised text-text-secondary";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ProblemCardFull({
  title,
  category,
  categoryColor,
  momentum,
  sparkline,
  topQuote,
  quoteSource,
  sources,
  lastSeenIso,
}: ProblemCardFullProps) {
  const categoryClass = CATEGORY_CLASSES[categoryColor] ?? CATEGORY_NEUTRAL;

  return (
    <article className="rounded-card border border-border-default bg-surface-card p-card">
      {/* Header: category pill + sparkline */}
      <div className="flex items-start justify-between gap-grid">
        <span
          className={`rounded-pill px-snug py-1 text-body-sm font-medium ${categoryClass}`}
        >
          {category}
        </span>
        <span className="text-accent-bristle">
          <Sparkline values={sparkline} />
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-snug font-serif text-h3 text-text-primary">{title}</h3>

      {/* Quote block: filled raised box + leading source avatar */}
      <div className="mt-snug flex gap-snug rounded-card bg-surface-raised p-grid">
        <span
          role="img"
          aria-label={SOURCE_LABELS[quoteSource]}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-surface-card text-text-secondary"
        >
          <SourceIcon source={quoteSource} className="size-3.5" />
        </span>
        <p className="font-serif text-body-md italic text-text-secondary">
          &ldquo;{topQuote}&rdquo;
        </p>
      </div>

      {/* Footer: source badges + momentum + relative time */}
      <div className="mt-grid flex items-center justify-between text-body-sm">
        <div className="flex -space-x-1.5">
          {sources.map((source, i) => (
            <span
              key={`${source}-${i}`}
              role="img"
              aria-label={SOURCE_LABELS[source]}
              className="inline-flex size-5 items-center justify-center rounded-pill bg-surface-raised text-text-secondary ring-2 ring-surface-card"
            >
              <SourceIcon source={source} className="size-3" />
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-text-secondary">
          {momentum > 0 && <ArrowUp className="size-3.5 text-accent-validated" aria-hidden="true" />}
          {momentum < 0 && <ArrowDown className="size-3.5 text-status-error" aria-hidden="true" />}
          <span>
            {momentum > 0 ? "+" : ""}
            {momentum}%
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatRelative(lastSeenIso)}</span>
        </div>
      </div>
    </article>
  );
}
