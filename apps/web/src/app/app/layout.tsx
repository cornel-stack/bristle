import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
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

  return (
    <div className="flex min-h-dvh bg-surface-canvas">
      <AppSidebar categories={[]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} contextLabel="Today" unreadCount={0} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
