// Split-screen container for the auth pages (server component). A precise 50/50
// CSS Grid: the dark editorial panel on `editorialSide`, the light form panel on
// the other. `order` utilities flip the visual side without reordering the DOM.
//
// RESPONSIVE (design is desktop-only): below md (768px) the editorial panel is
// HIDDEN and the form panel takes the full width (spec R9). Nothing functional
// lives in the editorial panel, so hiding it (rather than a brand strip) is the
// simpler, lower-risk choice — documented here as the made decision.

import type { ReactNode } from "react";

import { EditorialPanel } from "./editorial-panel";

interface AuthSplitLayoutProps {
  editorialSide?: "left" | "right";
  /** Override the editorial content; defaults to the canonical <EditorialPanel />. */
  editorial?: ReactNode;
  children: ReactNode;
}

export function AuthSplitLayout({
  editorialSide = "left",
  editorial = <EditorialPanel />,
  children,
}: AuthSplitLayoutProps) {
  const editorialLeft = editorialSide === "left";
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-surface-canvas md:grid-cols-2">
      <aside
        className={`hidden md:block ${editorialLeft ? "md:order-1" : "md:order-2"}`}
      >
        {editorial}
      </aside>
      <div
        className={`flex items-center justify-center p-loose ${
          editorialLeft ? "md:order-2" : "md:order-1"
        }`}
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
