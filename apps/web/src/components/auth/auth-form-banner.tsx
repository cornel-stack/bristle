"use client";

// Shared form-level error banner for the auth islands (slice 014 polish).
// Consistent styling (AlertCircle + status-error text on a raised card) and
// focus management: it focuses itself on mount so that when an error appears
// after a submit, keyboard + screen-reader users land on it immediately. The
// role="alert" also announces it without requiring focus. Callers can pass a
// `key` (e.g. the message) to force a remount + re-focus on a changed error.

import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function AuthFormBanner({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-snug rounded-card border border-border-default bg-surface-raised p-snug text-body-sm text-status-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
    >
      <AlertCircle
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}
