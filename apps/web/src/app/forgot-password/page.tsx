import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { TopNav } from "@/components/landing/top-nav";

export const metadata: Metadata = {
  title: "Forgot password — Bristle",
  robots: { index: false, follow: false },
};

export default function ForgotPassword() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-grid py-16">
        <AuthCard
          title="Reset your password"
          subtitle="Enter your email and we will send a reset link."
          footer={
            <>
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-medium text-accent-bristle hover:underline"
              >
                Sign in
              </Link>
            </>
          }
        >
          <ForgotPasswordForm />
        </AuthCard>
      </main>
      <SiteFooter />
    </>
  );
}
