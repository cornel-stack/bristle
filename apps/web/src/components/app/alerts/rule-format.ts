import { CATEGORY_LABELS, type CategoryKey } from "@bristle/shared";

// The watch-rule condition vocabulary (slice 4.6, A1) — the same 4 seeded rule
// types. Used to derive a new rule's "<Category> · <condition>" name (seeded
// rules render their stored name). WTP is a mention COUNT (> N mentions), not
// dollars.
export type RuleType = "momentum" | "new" | "threshold" | "wtp";

export const RULE_TYPE_OPTIONS: { value: RuleType; label: string }[] = [
  { value: "momentum", label: "Momentum over threshold" },
  { value: "new", label: "Any new problem" },
  { value: "threshold", label: "Weekly count over threshold" },
  { value: "wtp", label: "WTP mentions over threshold" },
];

export function thresholdUnit(ruleType: RuleType): string | null {
  if (ruleType === "momentum") return "%";
  if (ruleType === "new") return null; // no threshold
  return "mentions/count";
}

export function ruleCondition(ruleType: string, threshold: number | null): string {
  switch (ruleType) {
    case "momentum":
      return `momentum > +${threshold ?? 0}%`;
    case "new":
      return "any new problem";
    case "threshold":
      return `weekly count > ${threshold ?? 0}`;
    case "wtp":
      return `WTP mentions > ${threshold ?? 0}`;
    default:
      return ruleType;
  }
}

export function deriveRuleName(
  categoryKey: string,
  ruleType: string,
  threshold: number | null,
): string {
  const cat = CATEGORY_LABELS[categoryKey as CategoryKey] ?? categoryKey;
  return `${cat} · ${ruleCondition(ruleType, threshold)}`;
}
