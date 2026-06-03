import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserByEmail } from "@bristle/db";

import { auth } from "@/auth";
import { AuthOverline } from "@/components/auth/auth-overline";
import { CategorySelector } from "@/components/onboarding/category-selector";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  requireOnboardingIncomplete,
  requireRoleChosen,
} from "@/lib/onboarding/guard";

import { saveCategories, skipOnboarding } from "../actions";

export const metadata: Metadata = {
  title: "Pick your categories — Bristle",
  robots: { index: false, follow: false },
};

// Onboarding Step 2 (design 3_2). Server component: authoritative auth(), bounce
// a completed user to /account, and a user with no saved role back to step 1
// (resume). The static overline/h1/subhead (incl. the /pricing upgrade link)
// render here; CategorySelector is the only client island.
export default async function OnboardingCategoriesPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/onboarding/categories");
  }
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect("/login?callbackUrl=/onboarding/categories");
  requireOnboardingIncomplete(user);
  requireRoleChosen(user);

  return (
    <OnboardingShell currentStep={2} skipAction={skipOnboarding}>
      <div className="flex flex-col gap-loose">
        <div className="flex flex-col items-center gap-tight text-center">
          <AuthOverline>PICK AT LEAST 3</AuthOverline>
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            Which categories should we watch?
          </h1>
          <p className="text-body-md text-text-secondary">
            Your Starter plan tracks 5 categories.{" "}
            <Link
              href="/pricing"
              className="text-accent-bristle hover:underline"
            >
              Upgrade to Pro
            </Link>{" "}
            for unlimited.
          </p>
        </div>
        <CategorySelector
          action={saveCategories}
          initialSelected={user.watchedCategories ?? []}
        />
      </div>
    </OnboardingShell>
  );
}
