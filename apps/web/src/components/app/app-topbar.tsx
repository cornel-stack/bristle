// Persistent top bar (server component). Context label, the command-palette
// trigger (the functional ⌘K search — slice 4.8), a notification bell badged with
// the unread count, and the user avatar (initials). §4 tokens, no hex.
import type { ReactNode } from "react";

import type { User } from "@bristle/db";
import { Bell } from "lucide-react";
import Link from "next/link";

import { CommandPaletteTrigger } from "@/components/app/command-palette/command-palette-trigger";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function AppTopbar({
  user,
  contextLabel,
  unreadCount,
  leftSlot,
}: {
  user: User;
  contextLabel: string;
  unreadCount: number;
  leftSlot?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border-default bg-surface-card px-loose py-snug">
      <div className="flex items-center gap-snug">
        {leftSlot}
        <span className="text-body-md font-medium text-text-primary">
          {contextLabel}
        </span>
      </div>
      <div className="flex items-center gap-grid">
        <CommandPaletteTrigger />
        <Link
          href="/app/alerts"
          aria-label={`Notifications — ${unreadCount} unread`}
          className="relative flex size-9 items-center justify-center rounded-button text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <Bell className="size-5" strokeWidth={1.5} aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent-bristle px-1 text-body-sm font-semibold leading-none text-surface-card">
              {unreadCount}
            </span>
          ) : null}
        </Link>
        <Link
          href="/account"
          aria-label={`Account — ${user.name ?? user.email}`}
          className="flex size-8 items-center justify-center rounded-pill bg-accent-validated text-body-sm font-medium text-surface-card"
        >
          {initials(user.name)}
        </Link>
      </div>
    </header>
  );
}
