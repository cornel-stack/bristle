import type { Metadata } from "next";
import Link from "next/link";

import { isPasswordResetTokenValid } from "@bristle/db";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

export const metadata: Metadata = {
  title: "Reset password — Bristle",
  robots: { index: false, follow: false },
};

export default async function ResetPassword({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // UX pre-check: show the invalid state immediately rather than after the user
  // types a new password. completePasswordReset still re-validates atomically
  // (TOCTOU), so this read-only check is advisory, not the security boundary.
  const valid = await isPasswordResetTokenValid(token);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard
          title="Set a new password"
          subtitle={
            valid ? "Choose a new password for your account." : undefined
          }
        >
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="rounded-card border border-border-default bg-surface-card p-card">
              <p className="text-body-md text-text-secondary">
                This reset link is no longer valid.{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-accent-bristle hover:underline"
                >
                  Request a new one
                </Link>
                .
              </p>
            </div>
          )}
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
