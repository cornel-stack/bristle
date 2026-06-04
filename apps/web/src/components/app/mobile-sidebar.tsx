"use client";

// Mobile sidebar drawer (client island). Below lg, the desktop sidebar is hidden;
// this renders a hamburger in the top bar that opens the sidebar content as an
// off-canvas overlay. The sidebar itself stays a Server Component (passed as
// children). §4 tokens.
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export function MobileSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-button text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text-primary/40"
          />
          <div className="absolute left-0 top-0 h-full">
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-card flex size-9 items-center justify-center rounded-button text-text-secondary hover:bg-surface-raised"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
