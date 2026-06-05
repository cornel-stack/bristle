import type { ReactNode } from "react";

import {
  getCommandIndex,
  getUnreadNotificationCount,
  getWatchedCategories,
} from "@bristle/db";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { CategoriesProvider } from "@/components/app/categories/categories-context";
import { CommandPalette } from "@/components/app/command-palette/command-palette";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { getAppUser } from "@/lib/app-user";

// The persistent authenticated app shell — reused by every Tier-4 screen (4.2–4.8
// drop content into {children}). The middleware cookie-gate is the fast pre-check;
// this `auth()` is the authoritative gate (WHETHER signed in). `getAppUser()` is
// the separate seam resolving WHICH user's data to render (the demo user for v1.0).
// Sidebar categories + topbar unread are placeholders here; T021 wires real data.
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/app");
  const user = await getAppUser();
  const [watched, unreadCount, commandIndex] = await Promise.all([
    getWatchedCategories(user.id),
    getUnreadNotificationCount(user.id),
    getCommandIndex(),
  ]);
  // The shell-level categories seed (slice 4.9): the 8 catalog (from the command
  // index, with counts) marked `watched` by the user's watched keys. The provider
  // makes it ephemerally-extensible cross-route (sidebar / alert filter / palette).
  const watchedKeys = new Set(watched.map((c) => c.key));
  const categorySeed = commandIndex.categories.map((c) => ({
    key: c.key,
    label: c.label,
    count: c.count,
    watched: watchedKeys.has(c.key),
    isCustom: false,
  }));

  return (
    <CategoriesProvider seed={categorySeed}>
      <div className="flex min-h-dvh bg-surface-canvas">
        <AppSidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar
            user={user}
            contextLabel="Today"
            unreadCount={unreadCount}
            leftSlot={
              <MobileSidebar>
                <AppSidebar />
              </MobileSidebar>
            }
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <CommandPalette index={commandIndex} />
      </div>
    </CategoriesProvider>
  );
}
