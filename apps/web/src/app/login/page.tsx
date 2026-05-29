import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@bristle/shared";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

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

export default async function Login({
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
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard
          title="Sign in"
          subtitle="Welcome back."
          footer={
            <>
              New to Bristle?{" "}
              <Link
                href="/signup"
                className="font-medium text-accent-bristle hover:underline"
              >
                Create an account
              </Link>
            </>
          }
        >
          {notice ? (
            <p
              role="status"
              aria-live="polite"
              className="text-body-sm text-status-success"
            >
              {notice}
            </p>
          ) : null}
          <LoginForm callbackUrl={callbackUrl} />
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
