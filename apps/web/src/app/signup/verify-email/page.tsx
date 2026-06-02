import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthOverline } from "@/components/auth/auth-overline";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { VerifyEmailCodeForm } from "@/components/auth/verify-email-code-form";

export const metadata: Metadata = {
  title: "Verify your email — Bristle",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  // Nothing to verify without the email context — send them back to signup.
  if (!email) redirect("/signup");

  return (
    <AuthSplitLayout editorialSide="left">
      <div className="flex flex-col gap-grid">
        <AuthOverline>ONE MORE STEP</AuthOverline>
        <div className="flex flex-col gap-tight">
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            Verify your email.
          </h1>
          <p className="text-body-md text-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-text-primary">{email}</span>. It
            expires in 10 minutes.
          </p>
        </div>
        <VerifyEmailCodeForm email={email} />
        <p className="rounded-card border border-border-default bg-surface-raised p-snug text-body-sm text-text-secondary">
          The email comes from hello@bristle.dev. Add it to your contacts so
          future digests don&rsquo;t end up in promotions.
        </p>
      </div>
    </AuthSplitLayout>
  );
}
