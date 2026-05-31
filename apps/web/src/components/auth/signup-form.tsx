"use client";

// Client island #1. Owns useActionState for createAccount. Imports only the
// SignupFormState TYPE + the action — never the zod runtime (kept out of the
// client bundle, slice-008 discipline). Echoes email/name on error; passwords
// are never echoed.

import { useActionState } from "react";

import { createAccount, type SignupFormState } from "@/app/signup/actions";

import { AuthField } from "./auth-field";

const INITIAL_STATE: SignupFormState = { status: "idle" };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    createAccount,
    INITIAL_STATE,
  );

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
      className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
    >
      {banner ? (
        <p role="alert" className="text-body-sm text-status-error">
          {banner}
        </p>
      ) : null}
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
      <AuthField
        id="signup-password"
        name="password"
        label="Password"
        type="password"
        required
        minLength={12}
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <AuthField
        id="signup-confirm"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        required
        minLength={12}
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
      />
      <AuthField
        id="signup-name"
        name="name"
        label="Name (optional)"
        type="text"
        autoComplete="name"
        defaultValue={values.name ?? ""}
        error={fieldErrors.name}
      />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
