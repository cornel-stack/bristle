"use client";

import { Check, Download, Save, Share2 } from "lucide-react";
import { useState } from "react";

// Share copies the current deep-link URL — honest, since the URL IS the
// comparison (the read-slice payoff). Save view (no comparisons table) + Export
// PDF (Tier 6) render visual-only.
export function CompareShareBar() {
  const [copied, setCopied] = useState(false);

  function share() {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const secondary =
    "inline-flex items-center gap-1.5 rounded-button border border-border-default bg-surface-card px-3 py-1.5 text-body-sm font-medium text-text-primary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={secondary}>
        <Save className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Save view
      </button>
      <button type="button" className={secondary}>
        <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      >
        {copied ? (
          <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Share2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
        )}
        {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}
