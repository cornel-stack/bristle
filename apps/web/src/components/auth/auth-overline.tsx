// Small orange caps label above the serif h1 on every auth page (server
// component). The consumer composes the full string, e.g. "CREATE ACCOUNT · 1
// OF 2" or "ACCOUNT RECOVERY · FINAL STEP" — so a single `children` prop covers
// the simple / with-counter / multi-step variants without branching.
// Sans caps tracked in the brand accent token (matches the design overlines;
// the mono treatment is reserved for the stats ticker).

import type { ReactNode } from "react";

export function AuthOverline({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-body-sm font-semibold uppercase tracking-wide text-accent-bristle">
      {children}
    </p>
  );
}
