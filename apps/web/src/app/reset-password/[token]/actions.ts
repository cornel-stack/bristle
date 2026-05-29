"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { consumePasswordResetToken } from "@bristle/db";

import { resetSchema, type ResetInput } from "@/components/auth/auth-schemas";
import { hashPassword } from "@/lib/auth/password";
import { check, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

export type ResetPasswordState =
  | { status: "idle" }
  | {
      status: "validation-error";
      fieldErrors: Partial<Record<keyof ResetInput, string>>;
      formError?: string;
    }
  | { status: "rate-limited"; message: string }
  | { status: "transport-error"; message: string };

// Set as formError when the token is rejected; the form pairs it with a
// /forgot-password link. Local (not exported) — a "use server" module may only
// export async functions.
const INVALID_RESET_LINK = "This link is no longer valid. Request a new one.";

export async function completePasswordReset(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString() ?? "";

  // Rate limit (per IP) — same bucket as forgot-password (the consumption side).
  if (!check({ key: `forgot:${clientIp(await headers())}`, ...RATE_LIMITS.forgot }).allowed) {
    return {
      status: "rate-limited",
      message: "Too many attempts. Please try again later.",
    };
  }

  const parsed = resetSchema.safeParse({
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<keyof ResetInput, string>> = {};
    for (const k of ["password", "confirmPassword"] as const) {
      const m = flat[k]?.[0];
      if (m) fieldErrors[k] = m;
    }
    return { status: "validation-error", fieldErrors };
  }

  if (!token) {
    return { status: "validation-error", fieldErrors: {}, formError: INVALID_RESET_LINK };
  }

  let ok = false;
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    // Atomic TOCTOU-safe consume: re-check unused+unexpired, update password,
    // mark used, delete all sessions — one transaction in @bristle/db.
    ok = (await consumePasswordResetToken(token, passwordHash)).ok;
  } catch (err) {
    console.error("[reset] completePasswordReset failed:", err);
    return { status: "transport-error", message: "Something went wrong. Please try again." };
  }

  if (!ok) {
    return { status: "validation-error", fieldErrors: {}, formError: INVALID_RESET_LINK };
  }

  // Success — outside try/catch so redirect()'s control-flow throw is not caught.
  redirect("/login?reset=true");
}
