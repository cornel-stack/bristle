"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUserByEmail } from "@bristle/db";

import { loginSchema, type LoginInput } from "@/components/auth/auth-schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/** Non-password values echoed back on error. */
export interface LoginRawValues {
  email?: string;
}

/**
 * Discriminated state for LoginForm (plan §8). Order: rate-limit → zod →
 * credential check → email-verified gate → session creation. `formError` carries
 * the generic credential message (no enumeration: bad email and bad password are
 * indistinguishable). `unverified` routes the form to the resend nudge (C-c).
 */
export type LoginFormState =
  | { status: "idle" }
  | {
      status: "validation-error";
      fieldErrors: Partial<Record<keyof LoginInput, string>>;
      formError?: string;
      values: LoginRawValues;
    }
  | { status: "rate-limited"; message: string }
  | { status: "unverified"; email: string }
  | { status: "transport-error"; message: string; values: LoginRawValues };

const GENERIC_CREDENTIALS = "That email or password is not correct.";

export async function signInWithCredentials(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const raw: LoginRawValues = { email: formData.get("email")?.toString() ?? "" };
  const callbackUrl = formData.get("callbackUrl")?.toString() ?? "";

  // 1) Rate limit (per IP).
  const ip = clientIp(await headers());
  if (!check({ key: `login:${ip}`, ...RATE_LIMITS.login }).allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again in a minute.",
    };
  }

  // 2) Validate.
  const parsed = loginSchema.safeParse({
    email: raw.email,
    password: formData.get("password")?.toString() ?? "",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
    for (const k of ["email", "password"] as const) {
      const m = flat[k]?.[0];
      if (m) fieldErrors[k] = m;
    }
    return { status: "validation-error", fieldErrors, values: raw };
  }
  const { email, password } = parsed.data;

  // 3) Credential check. On a missing user we still run a hash to keep timing
  // comparable to the user-exists path (enumeration defense — login is the
  // primary attack surface, so we equalize here rather than just documenting).
  let userId: string | undefined;
  let emailVerified = false;
  try {
    const user = await getUserByEmail(email);
    if (user) {
      if (await verifyPassword(user.passwordHash, password)) {
        userId = user.id;
        emailVerified = user.emailVerified !== null;
      }
    } else {
      await hashPassword(password);
    }
  } catch (err) {
    console.error("[login] lookup/verify failed:", err);
    return {
      status: "transport-error",
      message: "Something went wrong. Please try again.",
      values: raw,
    };
  }

  if (!userId) {
    return {
      status: "validation-error",
      fieldErrors: {},
      formError: GENERIC_CREDENTIALS,
      values: raw,
    };
  }

  // 4) Email-verified gate.
  if (!emailVerified) {
    return { status: "unverified", email };
  }

  // 5) Create the DB session (Credentials path; see lib/auth/session.ts).
  try {
    await createUserSession(userId);
  } catch (err) {
    console.error("[login] session creation failed:", err);
    return {
      status: "transport-error",
      message: "Something went wrong. Please try again.",
      values: raw,
    };
  }

  // 6) Redirect — only internal paths (open-redirect guard).
  const dest =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/account";
  redirect(dest);
}
