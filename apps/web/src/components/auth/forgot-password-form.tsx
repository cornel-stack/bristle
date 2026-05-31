"use client";

// Client island #3. useActionState for requestPasswordReset. On success the
// form is replaced by the neutral "if an account exists…" message (no
// enumeration); only rate-limited surfaces as an error.

import { useActionState } from "react";

import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/forgot-password/actions";

import { AuthField } from "./auth-field";

const INITIAL_STATE: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );

  if (state.status === "success") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-card border border-border-default bg-surface-card p-card text-body-md text-text-secondary"
      >
        If an account exists for {state.email}, a reset link is on its way.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      aria-busy={pending}
      noValidate
      className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
    >
      {state.status === "rate-limited" ? (
        <p role="alert" className="text-body-sm text-status-error">
          {state.message}
        </p>
      ) : null}
      <AuthField
        id="forgot-email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
