// Full-width centered chrome for the two onboarding steps (server component,
// designs 3_1 + 3_2). Header: brand lockup (left), step progress + "Step N of 2"
// + "Skip for now" (right); centered max-w-5xl content on surface/canvas. NOT the
// split-screen auth layout — onboarding is full-width.
//
// "Skip for now" is a <form action={skipAction}> submit, not an anchor: the skip
// is a server-side mutation (completeOnboarding), and a server-action form is the
// Auth.js-v5 pattern carried from slice 014 (anchors can't trigger the action).
// The action is injected by the page (Batch B passes skipOnboarding) so the shell
// stays decoupled and buildable on its own. Two steps this slice → total hardcoded
// to 2 (the deferred tour would make it 3). Token-driven, no hex.

import type { ReactNode } from "react";

import { ProgressDashes } from "./progress-dashes";

interface OnboardingShellProps {
  currentStep: 1 | 2;
  skipAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}

export function OnboardingShell({
  currentStep,
  skipAction,
  children,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-canvas">
      <header className="flex items-center justify-between px-loose py-card">
        {/* Brand lockup — rotated-square diamond + serif wordmark (matches nav). */}
        <div className="flex items-center gap-snug">
          <span
            className="size-3 rotate-45 bg-accent-bristle"
            aria-hidden="true"
          />
          <span className="font-serif text-h4 font-semibold text-text-primary">
            Bristle
          </span>
        </div>
        <div className="flex items-center gap-grid">
          <ProgressDashes current={currentStep} total={2} />
          <span className="text-body-sm text-text-secondary">
            Step {currentStep} of 2
          </span>
          <form action={skipAction}>
            <button
              type="submit"
              className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Skip for now
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-loose py-section">
        <div className="w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
