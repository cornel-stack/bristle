"use server";

import { headers } from "next/headers";

import { createPasswordResetToken, getUserByEmail } from "@bristle/db";
import { SITE_URL } from "@bristle/shared";

import { forgotSchema } from "@/components/auth/auth-schemas";
import { generateToken, expiresIn, RESET_TOKEN_TTL_MS } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/auth-emails";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Forgot-password state. There is deliberately NO validation-error or
 * user-found/not-found distinction surfaced: the action ALWAYS resolves to the
 * same `success` shape (for any email, registered or not) so the response
 * cannot be used to enumerate accounts. Only `rate-limited` (keyed on IP, not
 * email — so it leaks nothing about existence) can interrupt that.
 */
export type ForgotPasswordState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "rate-limited"; message: string };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const rawEmail = formData.get("email")?.toString() ?? "";

  // Rate limit first (per IP — never reveals whether the email exists).
  if (!check({ key: `forgot:${clientIp(await headers())}`, ...RATE_LIMITS.forgot }).allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again later.",
    };
  }

  const parsed = forgotSchema.safeParse({ email: rawEmail });
  if (parsed.success) {
    const { email } = parsed.data;
    const user = await getUserByEmail(email);
    if (user) {
      const token = generateToken();
      await createPasswordResetToken({
        userId: user.id,
        token,
        expires: expiresIn(RESET_TOKEN_TTL_MS),
      });
      await sendPasswordResetEmail({
        email,
        name: user.name,
        resetUrl: `${SITE_URL}/reset-password/${token}`,
      });
    }
    // ACCEPTED v1 TIMING LEAK (R6): the found-and-send path takes longer than
    // the not-found no-op. Unlike login (which equalizes via a dummy hash),
    // /forgot-password is low-frequency, so we accept the leak rather than add a
    // dummy operation. Tracked follow-up if a security review flags it.
    return { status: "success", email };
  }

  // Even a malformed email resolves to the same generic success view.
  return { status: "success", email: rawEmail };
}
