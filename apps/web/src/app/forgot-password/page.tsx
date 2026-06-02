import type { Metadata } from "next";
import Link from "next/link";

import { AuthOverline } from "@/components/auth/auth-overline";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Bristle",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout editorialSide="left">
      <div className="flex flex-col gap-grid">
        <AuthOverline>ACCOUNT RECOVERY</AuthOverline>
        <div className="flex flex-col gap-tight">
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            Reset your password.
          </h1>
          <p className="text-body-md text-text-secondary">
            Enter the email associated with your account. We&rsquo;ll send a
            reset link valid for 30 minutes.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="flex items-center justify-between text-body-sm">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary"
          >
            ← Back to sign in
          </Link>
          <Link
            href="/contact"
            className="font-medium text-accent-bristle hover:underline"
          >
            Contact support
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
