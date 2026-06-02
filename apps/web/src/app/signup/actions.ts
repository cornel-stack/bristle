"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createUser,
  getUserByEmail,
  setEmailVerificationCode,
} from "@bristle/db";

import { signupSchema, type SignupInput } from "@/components/auth/auth-schemas";
import { hashPassword } from "@/lib/auth/password";
import {
  generateCode,
  hashCode,
  codeExpiry,
  TERMS_VERSION,
} from "@/lib/auth/email-verification-code";
import { sendVerificationCodeEmail } from "@/lib/auth-emails";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/** Non-password values echoed back to the form on any error path. */
export interface SignupRawValues {
  email?: string;
  name?: string;
}

/**
 * Discriminated state consumed by SignupForm via useActionState (plan §8).
 * Order of checks in the action: rate-limit → zod → uniqueness → transport.
 * `formError` carries non-field messages (e.g. the generic duplicate-email
 * result, kept indistinguishable from other create failures — no enumeration).
 * Passwords are never echoed.
 */
export type SignupFormState =
  | { status: "idle" }
  | {
      status: "validation-error";
      fieldErrors: Partial<Record<keyof SignupInput, string>>;
      formError?: string;
      values: SignupRawValues;
    }
  | { status: "rate-limited"; message: string }
  | { status: "transport-error"; message: string; values: SignupRawValues };

const GENERIC_CREATE_ERROR =
  "We could not create your account right now. Please try again.";

export async function createAccount(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const raw: SignupRawValues = {
    email: formData.get("email")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
  };

  // 1) Rate limit (per IP) — before any work.
  const ip = clientIp(await headers());
  const limit = check({ key: `signup:${ip}`, ...RATE_LIMITS.signup });
  if (!limit.allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again later.",
    };
  }

  // 2) Validate.
  const termsValue = formData.get("terms")?.toString();
  const parsed = signupSchema.safeParse({
    email: raw.email,
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
    name: raw.name ? raw.name : undefined,
    terms: termsValue === "on" || termsValue === "true",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
    for (const key of [
      "email",
      "password",
      "confirmPassword",
      "name",
      "terms",
    ] as const) {
      const msg = flat[key]?.[0];
      if (msg) fieldErrors[key] = msg;
    }
    return { status: "validation-error", fieldErrors, values: raw };
  }
  const { email, password, name } = parsed.data;

  // 3) Uniqueness — generic failure on a taken email (no enumeration).
  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      status: "validation-error",
      fieldErrors: {},
      formError: GENERIC_CREATE_ERROR,
      values: raw,
    };
  }

  // 4) Create user (capturing Terms acceptance) + issue a 6-digit code + send
  // the code email (transport). A credentials user always gets a passwordHash;
  // the schema-level nullable passwordHash is only for OAuth users (D15).
  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      name: name ?? null,
      passwordHash,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    });
    const code = generateCode();
    await setEmailVerificationCode({
      userId: user.id,
      codeHash: await hashCode(code),
      expires: codeExpiry(),
    });
    // Email send is best-effort: the account exists regardless, and the verify
    // page offers a rate-limited resend. A not-configured/transport failure is
    // logged by the sender, not surfaced as a hard error.
    await sendVerificationCodeEmail({ email, name: name ?? null, code });
  } catch (err) {
    console.error("[signup] createAccount failed:", err);
    return { status: "transport-error", message: GENERIC_CREATE_ERROR, values: raw };
  }

  // 5) Success — outside try/catch so redirect()'s control-flow throw is not caught.
  redirect(`/signup/verify-email?email=${encodeURIComponent(email)}`);
}
