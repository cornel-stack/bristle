import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";

// §4.1a category-tint pill for the Library table. Mirrors the canonical card's
// CATEGORY_CLASSES — both reference the same `category-<key>-{bg,fg}` design
// tokens (the single token source); this is presentation glue, not a parallel
// vocabulary.
const CATEGORY_CLASSES: Record<string, string> = {
  payments: "bg-category-payments-bg text-category-payments-fg",
  devtools: "bg-category-devtools-bg text-category-devtools-fg",
  "ai-ml": "bg-category-ai-ml-bg text-category-ai-ml-fg",
  "auth-sso": "bg-category-auth-sso-bg text-category-auth-sso-fg",
  deployment: "bg-category-deployment-bg text-category-deployment-fg",
  analytics: "bg-category-analytics-bg text-category-analytics-fg",
  mobile: "bg-category-mobile-bg text-category-mobile-fg",
  email: "bg-category-email-bg text-category-email-fg",
};

export function CategoryChip({ categoryKey }: { categoryKey: string }) {
  const label = CATEGORY_LABELS[categoryKey as CategoryKey] ?? categoryKey;
  const cls = CATEGORY_CLASSES[categoryKey] ?? "bg-surface-raised text-text-secondary";
  return (
    <span className={`inline-block whitespace-nowrap rounded-pill px-2 py-0.5 text-body-sm font-medium ${cls}`}>
      {label}
    </span>
  );
}
