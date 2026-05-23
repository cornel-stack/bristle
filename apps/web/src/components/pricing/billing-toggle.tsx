"use client";

import { useRef, type KeyboardEvent } from "react";

export type BillingMode = "monthly" | "annual";

export interface PricingBillingToggleProps {
  value: BillingMode;
  onChange: (next: BillingMode) => void;
}

export function PricingBillingToggle({ value, onChange }: PricingBillingToggleProps) {
  const monthlyRef = useRef<HTMLButtonElement>(null);
  const annualRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange("annual");
      annualRef.current?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange("monthly");
      monthlyRef.current?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange("monthly");
      monthlyRef.current?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      onChange("annual");
      annualRef.current?.focus();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      onKeyDown={handleKeyDown}
      className="inline-flex rounded-pill border border-border-default bg-surface-card p-1"
    >
      <button
        ref={monthlyRef}
        type="button"
        role="radio"
        aria-checked={value === "monthly"}
        tabIndex={value === "monthly" ? 0 : -1}
        onClick={() => onChange("monthly")}
        className={
          value === "monthly"
            ? "rounded-pill bg-text-primary px-grid py-2 text-body-sm font-medium text-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            : "rounded-pill px-grid py-2 text-body-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        }
      >
        Monthly
      </button>
      <button
        ref={annualRef}
        type="button"
        role="radio"
        aria-checked={value === "annual"}
        tabIndex={value === "annual" ? 0 : -1}
        onClick={() => onChange("annual")}
        className={
          value === "annual"
            ? "inline-flex items-center gap-tight rounded-pill bg-text-primary px-grid py-2 text-body-sm font-medium text-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            : "inline-flex items-center gap-tight rounded-pill px-grid py-2 text-body-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        }
      >
        Annual
        <span className="rounded-pill bg-accent-bristle px-2 py-0.5 text-body-sm font-medium text-surface-card">
          -30%
        </span>
      </button>
    </div>
  );
}
