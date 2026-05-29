import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@bristle/shared";

import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

const TITLE = "Sign up — Bristle";
const DESCRIPTION =
  "Create a Bristle account to track problems worth solving — with evidence, not vibes.";

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

export default function SignUp() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard
          title="Create your account"
          subtitle="Find problems worth solving — with evidence, not vibes."
          footer={
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-accent-bristle hover:underline"
              >
                Sign in
              </Link>
            </>
          }
        >
          <SignupForm />
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
