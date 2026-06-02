import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@bristle/shared";

import { AuthOverline } from "@/components/auth/auth-overline";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtonRow } from "@/components/auth/oauth-button-row";
import { OrEmailDivider } from "@/components/auth/or-email-divider";

const TITLE = "Sign in — Bristle";
const DESCRIPTION = "Sign in to your Bristle account.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/login",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string;
    reset?: string;
    callbackUrl?: string;
  }>;
}) {
  const { verified, reset, callbackUrl } = await searchParams;
  const notice = verified
    ? "Email verified — please sign in."
    : reset
      ? "Password updated — please sign in."
      : undefined;

  return (
    <AuthSplitLayout editorialSide="right">
      <div className="flex flex-col gap-grid">
        <AuthOverline>WELCOME BACK</AuthOverline>
        <div className="flex flex-col gap-tight">
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            Sign in to Bristle.
          </h1>
          <p className="text-body-md text-text-secondary">
            Sign in to your research journal.
          </p>
        </div>
        {notice ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-card border border-border-default bg-surface-raised p-snug text-body-sm text-status-success"
          >
            {notice}
          </p>
        ) : null}
        <OAuthButtonRow />
        <OrEmailDivider />
        <LoginForm callbackUrl={callbackUrl} />
        <p className="text-body-sm text-text-secondary">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent-bristle hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
