import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CallbackProgressPoller } from "@/components/auth/callback-progress-poller";
import { GitHubMark, GoogleMark } from "@/components/auth/oauth-button-row";

export const metadata: Metadata = {
  title: "Signing in… — Bristle",
  robots: { index: false, follow: false },
};

const PROVIDERS = { google: "Google", github: "GitHub" } as const;
type Provider = keyof typeof PROVIDERS;

function isProvider(value: string): value is Provider {
  return value === "google" || value === "github";
}

export default async function OAuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { provider } = await params;
  if (!isProvider(provider)) notFound(); // defends against unknown providers in the URL

  const { callbackUrl } = await searchParams;
  const destination =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/account";

  // Common fast path: the Auth.js OAuth callback already created the session +
  // cookie before redirecting here, so auth() resolves it and we skip the UI
  // entirely (also covers clicking an OAuth button while already signed in).
  const session = await auth();
  if (session?.user) redirect(destination);

  const label = PROVIDERS[provider];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-canvas p-loose">
      <div className="flex w-full max-w-md flex-col items-center gap-grid text-center">
        {/* Spinning orange ring around the Bristle ◆ ↔ provider composite. */}
        <div className="relative flex size-20 items-center justify-center">
          <svg
            className="absolute inset-0 size-20 animate-spin motion-reduce:animate-none"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              className="stroke-border-default"
              strokeWidth="2"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              className="stroke-accent-bristle"
              strokeWidth="2"
              strokeDasharray="50 176"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex items-center gap-tight">
            <span
              className="size-3 rotate-45 bg-accent-bristle"
              aria-hidden="true"
            />
            <span aria-hidden="true" className="text-body-sm text-text-tertiary">
              ↔
            </span>
            {provider === "google" ? <GoogleMark /> : <GitHubMark />}
          </div>
        </div>

        <h1 className="font-serif text-h2 font-semibold text-text-primary">
          Signing you in with {label}…
        </h1>
        <p className="text-body-md text-text-secondary">
          Exchanging tokens. This usually takes under a second. If it stalls,
          you&rsquo;ll be redirected to sign in manually.
        </p>

        <div className="w-full rounded-card border border-border-default bg-surface-card p-card text-left">
          <p className="mb-snug font-sans text-body-sm font-semibold uppercase tracking-wide text-accent-bristle">
            Status
          </p>
          <CallbackProgressPoller provider={provider} callbackUrl={destination} />
        </div>

        <Link
          href="/login"
          className="text-body-sm font-medium text-accent-bristle hover:underline"
        >
          Taking too long? Sign in with email →
        </Link>
      </div>
    </main>
  );
}
