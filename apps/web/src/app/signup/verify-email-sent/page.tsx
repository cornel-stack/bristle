import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

import { resendVerification } from "./actions";

export const metadata: Metadata = {
  title: "Check your email — Bristle",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailSent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string }>;
}) {
  const { email, resent } = await searchParams;
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard
          title="Check your inbox"
          subtitle={
            email
              ? `We sent a verification link to ${email}.`
              : "We sent you a verification link."
          }
        >
          <div className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card">
            <p className="text-body-md text-text-secondary">
              The link expires in 24 hours. Open it to finish setting up your
              account.
            </p>
            {resent ? (
              <p
                role="status"
                aria-live="polite"
                className="text-body-sm text-status-success"
              >
                A new link is on its way.
              </p>
            ) : null}
            <form action={resendVerification}>
              <input type="hidden" name="email" defaultValue={email ?? ""} />
              <button
                type="submit"
                className="rounded-button border border-border-default bg-surface-card px-grid py-2 text-body-md font-medium text-text-primary hover:bg-surface-raised"
              >
                Resend verification email
              </button>
            </form>
          </div>
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
