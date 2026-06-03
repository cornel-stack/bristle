import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserByEmail } from "@bristle/db";

import { auth } from "@/auth";
import { AuthOverline } from "@/components/auth/auth-overline";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { RoleSelector } from "@/components/onboarding/role-selector";
import { requireOnboardingIncomplete } from "@/lib/onboarding/guard";
import { isRole } from "@/lib/onboarding/role-options";

import { saveRole, skipOnboarding } from "../actions";

export const metadata: Metadata = {
  title: "Choose your role — Bristle",
  robots: { index: false, follow: false },
};

// Onboarding Step 1 (design 3_1). Server component: authoritative auth() (the
// middleware cookie-gate is the fast pre-check), load the user, and bounce a
// completed user to /account (the edge can't read completion state). The static
// overline/h1/subhead render here; RoleSelector is the only client island.
export default async function OnboardingRolePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/onboarding/role");
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect("/login?callbackUrl=/onboarding/role");
  requireOnboardingIncomplete(user);

  // First whitespace token of the name; null/empty → no comma (FR-009).
  const firstName = user.name?.split(" ")[0] || null;
  const overline = firstName
    ? `WELCOME TO BRISTLE, ${firstName.toUpperCase()}`
    : "WELCOME TO BRISTLE";

  return (
    <OnboardingShell currentStep={1} skipAction={skipOnboarding}>
      <div className="flex flex-col gap-loose">
        <div className="flex flex-col items-center gap-tight text-center">
          <AuthOverline>{overline}</AuthOverline>
          <h1 className="font-serif text-h1 font-semibold text-text-primary">
            What are you trying to do?
          </h1>
          <p className="max-w-2xl text-body-md text-text-secondary">
            Tells us how to rank your feed, which signals to lead with, and what
            to suggest you save.
          </p>
        </div>
        <RoleSelector
          action={saveRole}
          initialRole={user.role && isRole(user.role) ? user.role : null}
          initialRoleCustom={user.roleCustom}
        />
      </div>
    </OnboardingShell>
  );
}
