"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createVerificationToken, getUserByEmail } from "@bristle/db";
import { SITE_URL } from "@bristle/shared";

import { generateToken, expiresIn, VERIFY_TOKEN_TTL_MS } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/auth-emails";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Re-send the verification email (C-f). Always redirects back with ?resent=1
 * regardless of whether the email maps to an unverified user — no enumeration.
 * Only does work when under the (shared signup) rate limit and the user exists
 * and is still unverified. Plain form action (no client island).
 */
export async function resendVerification(formData: FormData) {
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase();
  const limit = check({ key: `signup:${clientIp(await headers())}`, ...RATE_LIMITS.signup });

  if (limit.allowed && email) {
    const user = await getUserByEmail(email);
    if (user && user.emailVerified === null) {
      const token = generateToken();
      await createVerificationToken({
        identifier: email,
        token,
        expires: expiresIn(VERIFY_TOKEN_TTL_MS),
      });
      await sendVerificationEmail({
        email,
        name: user.name,
        verifyUrl: `${SITE_URL}/signup/verify-email?token=${token}`,
      });
    }
  }

  redirect(
    `/signup/verify-email-sent?email=${encodeURIComponent(email)}&resent=1`,
  );
}
