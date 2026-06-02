"use client";

// Signup form island (rebuilt, slice 014). Owns useActionState(createAccount)
// + the live password value for the strength meter. Name+email in a responsive
// 2-col grid, single password field (no confirm — design 2_1), Terms checkbox.
// The OAuth row / OR-EMAIL divider / overline / heading are server-rendered in
// the page. Imports only the SignupFormState TYPE + the action (zod stays
// server-side). Echoes name/email on error; password is never echoed.

import Link from "next/link";
import { useActionState, useState } from "react";

import { createAccount, type SignupFormState } from "@/app/signup/actions";

import { AuthField } from "./auth-field";
import { AuthFormBanner } from "./auth-form-banner";
import { PasswordField } from "./password-field";
import { PasswordStrengthMeter } from "./password-strength-meter";

const INITIAL_STATE: SignupFormState = { status: "idle" };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    createAccount,
    INITIAL_STATE,
  );
  const [password, setPassword] = useState("");

  const values =
    state.status === "validation-error" || state.status === "transport-error"
      ? state.values
      : {};
  const fieldErrors =
    state.status === "validation-error" ? state.fieldErrors : {};
  const banner =
    state.status === "rate-limited"
      ? state.message
      : state.status === "transport-error"
        ? state.message
        : state.status === "validation-error"
          ? state.formError
          : undefined;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      noValidate
      className="flex flex-col gap-grid"
    >
      {banner ? <AuthFormBanner key={banner}>{banner}</AuthFormBanner> : null}
      <div className="grid grid-cols-1 gap-grid sm:grid-cols-2">
        <AuthField
          id="signup-name"
          name="name"
          label="Full name"
          type="text"
          autoComplete="name"
          defaultValue={values.name ?? ""}
          error={fieldErrors.name}
        />
        <AuthField
          id="signup-email"
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values.email ?? ""}
          error={fieldErrors.email}
        />
      </div>
      <div className="flex flex-col gap-tight">
        <PasswordField
          id="signup-password"
          name="password"
          label="Password"
          required
          minLength={12}
          autoComplete="new-password"
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={password} labelId="signup-pw-strength" />
      </div>
      <div className="flex flex-col gap-tight">
        <label className="flex items-start gap-snug text-body-sm text-text-secondary">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 size-4 accent-accent-bristle"
            aria-invalid={fieldErrors.terms ? true : undefined}
            aria-describedby={fieldErrors.terms ? "signup-terms-error" : undefined}
          />
          <span>
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-medium text-accent-bristle hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-accent-bristle hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors.terms ? (
          <p
            id="signup-terms-error"
            role="alert"
            className="text-body-sm text-status-error"
          >
            {fieldErrors.terms}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account →"}
      </button>
    </form>
  );
}
