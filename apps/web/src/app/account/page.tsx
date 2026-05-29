import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserByEmail } from "@bristle/db";

import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";
import { signOutAction } from "@/lib/auth/actions";
import { formatLongDate } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Account — Bristle",
  robots: { index: false, follow: false },
};

export default async function Account() {
  // Authoritative guard (middleware also redirects on missing cookie; this is
  // the real check — a stale cookie passes middleware but fails here, TOCTOU).
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/account");
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard title={`Welcome, ${user.name ?? user.email}`}>
          <div className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card">
            <dl className="flex flex-col gap-grid text-body-md">
              <div className="flex flex-col gap-tight">
                <dt className="text-body-sm text-text-secondary">Email</dt>
                <dd className="text-text-primary">{user.email}</dd>
              </div>
              <div className="flex flex-col gap-tight">
                <dt className="text-body-sm text-text-secondary">Email status</dt>
                <dd className="text-text-primary">
                  {user.emailVerified ? "Verified" : "Not verified"}
                </dd>
              </div>
              <div className="flex flex-col gap-tight">
                <dt className="text-body-sm text-text-secondary">Member since</dt>
                <dd className="text-text-primary">
                  {formatLongDate(user.createdAt)}
                </dd>
              </div>
            </dl>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-button border border-border-default bg-surface-card px-grid py-2 text-body-md font-medium text-text-primary hover:bg-surface-raised"
              >
                Sign out
              </button>
            </form>
          </div>
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
