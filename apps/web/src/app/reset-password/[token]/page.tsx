import type { Metadata } from "next";
import { Mail } from "lucide-react";
import Link from "next/link";

import { getValidResetTokenEmail } from "@bristle/db";

import { AuthOverline } from "@/components/auth/auth-overline";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password — Bristle",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Read-only pre-check: the email for the context pill, or null if the link is
  // invalid. completePasswordReset re-validates atomically at submit (TOCTOU).
  const email = await getValidResetTokenEmail(token);

  return (
    <AuthSplitLayout editorialSide="right">
      <div className="flex flex-col gap-grid">
        <AuthOverline>ACCOUNT RECOVERY · FINAL STEP</AuthOverline>
        <h1 className="font-serif text-h1 font-semibold text-text-primary">
          Choose a new password.
        </h1>
        {email ? (
          <>
            <p className="flex items-center gap-snug rounded-card border border-border-default bg-surface-raised p-snug text-body-sm text-text-secondary">
              <Mail
                className="size-4 shrink-0 text-text-tertiary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Resetting password for{" "}
              <span className="font-medium text-text-primary">{email}</span>
            </p>
            <ResetPasswordForm token={token} />
          </>
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
      </div>
    </AuthSplitLayout>
  );
}
