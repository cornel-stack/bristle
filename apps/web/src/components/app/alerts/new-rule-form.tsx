"use client";

import { useState } from "react";

import { useCategories } from "@/components/app/categories/categories-context";

import { RULE_TYPE_OPTIONS, thresholdUnit, type RuleType } from "./rule-format";

// New-rule form (slice 4.6, A1) — category + condition-type + threshold (omitted
// for "any new problem"). The board derives the "<Category> · <condition>" name
// and appends the rule to in-session state (ephemeral).
export function NewRuleForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (categoryKey: string, ruleType: RuleType, threshold: number | null) => void;
  onCancel: () => void;
}) {
  const { categories } = useCategories();
  const [category, setCategory] = useState<string>("payments");
  const [ruleType, setRuleType] = useState<RuleType>("momentum");
  const [threshold, setThreshold] = useState("100");
  const needsThreshold = ruleType !== "new";
  const unit = thresholdUnit(ruleType);

  const select =
    "mt-1 w-full rounded-button border border-border-default bg-surface-card px-2 py-1.5 text-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(category, ruleType, needsThreshold ? Number(threshold) || 0 : null);
      }}
      className="flex flex-col gap-grid rounded-card border border-border-strong bg-surface-card p-grid"
      aria-label="New watch rule"
    >
      <p className="text-body-md font-medium text-text-primary">New watch rule</p>
      <label className="block text-body-sm text-text-secondary">
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={select}>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-body-sm text-text-secondary">
        Condition
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)} className={select}>
          {RULE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {needsThreshold ? (
        <label className="block text-body-sm text-text-secondary">
          Threshold{unit ? ` (${unit})` : ""}
          <input
            type="number"
            inputMode="numeric"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className={select}
          />
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          Create rule
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-button px-3 py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
