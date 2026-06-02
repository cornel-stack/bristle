"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  consumeEmailVerificationCode,
  getUserByEmail,
  incrementEmailVerificationAttempts,
  setEmailVerificationCode,
} from "@bristle/db";
import { SITE_URL } from "@bristle/shared";

import { verifyCodeSchema } from "@/components/auth/auth-schemas";
import {
  CODE_MAX_ATTEMPTS,
  codeExpiry,
  generateCode,
  hashCode,
  RESEND_COOLDOWN_MS,
  verifyCode,
} from "@/lib/auth/email-verification-code";
import {
  sendVerificationCodeEmail,
  sendWelcomeEmail,
} from "@/lib/auth-emails";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

const RESEND_COOLDOWN_SECONDS = Math.round(RESEND_COOLDOWN_MS / 1000);

/**
 * Discriminated state for VerifyEmailCodeForm (useActionState). Order of checks:
 * rate-limit → zod → lookup → attempts/expiry gates → argon2 verify → consume.
 * A missing/already-verified user is reported as a generic "incorrect" (no
 * enumeration of who exists or who is already verified).
 */
export type VerifyCodeState =
  | { status: "idle" }
  | {
      status: "validation-error";
      fieldErrors: Partial<Record<"email" | "code", string>>;
      values: { email?: string };
    }
  | { status: "rate-limited"; message: string }
  | { status: "code-expired"; email: string }
  | { status: "too-many-attempts"; email: string }
  | { status: "incorrect"; remainingAttempts: number; email: string }
  | { status: "transport-error"; message: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function verifyEmailCode(
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const code = formData.get("code")?.toString() ?? "";

  // 1) Rate limit (per IP) — the per-code 5-attempt cap is enforced below.
  const ip = clientIp(await headers());
  if (!check({ key: `verify-code:${ip}`, ...RATE_LIMITS.verifyCode }).allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again later.",
    };
  }

  // 2) Validate.
  const parsed = verifyCodeSchema.safeParse({ email, code });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<"email" | "code", string>> = {};
    for (const key of ["email", "code"] as const) {
      const msg = flat[key]?.[0];
      if (msg) fieldErrors[key] = msg;
    }
    return { status: "validation-error", fieldErrors, values: { email } };
  }

  // 3) Lookup. Missing user / already-verified / no outstanding code → generic
  // "incorrect" (no enumeration).
  const user = await getUserByEmail(parsed.data.email);
  if (!user || user.emailVerified || !user.emailVerificationCode) {
    return { status: "incorrect", remainingAttempts: CODE_MAX_ATTEMPTS, email };
  }

  // 4) Attempt + expiry gates.
  if (user.emailVerificationAttempts >= CODE_MAX_ATTEMPTS) {
    return { status: "too-many-attempts", email };
  }
  if (
    !user.emailVerificationCodeExpires ||
    user.emailVerificationCodeExpires.getTime() < Date.now()
  ) {
    return { status: "code-expired", email };
  }

  // 5) argon2 verify + atomic consume (transport).
  let consumed: Awaited<ReturnType<typeof consumeEmailVerificationCode>>;
  try {
    const ok = await verifyCode(parsed.data.code, user.emailVerificationCode);
    if (!ok) {
      const attempts = await incrementEmailVerificationAttempts(user.id);
      return {
        status: "incorrect",
        remainingAttempts: Math.max(0, CODE_MAX_ATTEMPTS - attempts),
        email,
      };
    }
    consumed = await consumeEmailVerificationCode({
      userId: user.id,
      maxAttempts: CODE_MAX_ATTEMPTS,
    });
  } catch (err) {
    console.error("[verify-email] verifyEmailCode failed:", err);
    return { status: "transport-error", message: GENERIC_ERROR };
  }

  if (!consumed.ok) {
    // Rare TOCTOU race — map the re-check reason back to a state.
    if (consumed.reason === "too-many-attempts") {
      return { status: "too-many-attempts", email };
    }
    if (consumed.reason === "expired") return { status: "code-expired", email };
    return { status: "incorrect", remainingAttempts: 0, email };
  }

  // 6) Best-effort welcome mail (structured result never throws), then redirect
  // outside any try/catch so redirect()'s control-flow throw is not caught.
  await sendWelcomeEmail({
    email: consumed.email,
    name: consumed.name,
    signInUrl: `${SITE_URL}/login`,
  });
  redirect("/login?verified=true");
}

/** State for the resend control; `retryAfter` drives the client countdown. */
export type ResendCodeState =
  | { status: "idle" }
  | { status: "sent"; retryAfter: number }
  | { status: "cooldown"; retryAfter: number }
  | { status: "rate-limited"; message: string }
  | { status: "error"; message: string };

// Issue a fresh code, enforcing a 24s per-email cooldown (server-side, not just
// the client countdown) plus a per-IP cap. Behaves identically for an unknown or
// already-verified email (reports "sent" without doing work — no enumeration).
export async function resendVerificationCode(
  formData: FormData,
): Promise<ResendCodeState> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  if (!email) return { status: "error", message: GENERIC_ERROR };

  const cooldown = check({
    key: `resend-code:${email}`,
    limit: 1,
    windowMs: RESEND_COOLDOWN_MS,
  });
  if (!cooldown.allowed) {
    return {
      status: "cooldown",
      retryAfter: cooldown.retryAfter ?? RESEND_COOLDOWN_SECONDS,
    };
  }

  const ip = clientIp(await headers());
  if (!check({ key: `resend-code-ip:${ip}`, ...RATE_LIMITS.verifyCode }).allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again later.",
    };
  }

  const user = await getUserByEmail(email);
  if (!user || user.emailVerified) {
    return { status: "sent", retryAfter: RESEND_COOLDOWN_SECONDS };
  }

  try {
    const code = generateCode();
    await setEmailVerificationCode({
      userId: user.id,
      codeHash: await hashCode(code),
      expires: codeExpiry(),
    });
    await sendVerificationCodeEmail({ email, name: user.name, code });
  } catch (err) {
    console.error("[verify-email] resendVerificationCode failed:", err);
    return { status: "error", message: GENERIC_ERROR };
  }
  return { status: "sent", retryAfter: RESEND_COOLDOWN_SECONDS };
}
