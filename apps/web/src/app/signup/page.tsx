import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@bristle/shared";

import { AuthOverline } from "@/components/auth/auth-overline";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { OAuthButtonRow } from "@/components/auth/oauth-button-row";
import { OrEmailDivider } from "@/components/auth/or-email-divider";
import { SignupForm } from "@/components/auth/signup-form";

const TITLE = "Create your Bristle account — Bristle";
const DESCRIPTION =
  "Create your Bristle account — no card required. Find problems worth solving, with evidence, not vibes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL + "/signup",
    images: [{ url: SITE_URL + "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function SignUpPage() {
  return (
    <AuthSplitLayout editorialSide="left">
      <div className="flex flex-col gap-grid">
        <AuthOverline>CREATE ACCOUNT · 1 OF 2</AuthOverline>
        <div className="flex flex-col gap-tight">
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            Start your research journal.
          </h1>
          <p className="text-body-md text-text-secondary">
            Create your account · no card required
          </p>
        </div>
        <OAuthButtonRow />
        <OrEmailDivider />
        <SignupForm />
        <p className="text-body-sm text-text-secondary">
          Have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-bristle hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
