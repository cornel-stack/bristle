"use client";

// Forgot-password form island (rebuilt, slice 014). useActionState for
// requestPasswordReset. On success the form is replaced by the neutral green
// "if an account exists…" pill (no enumeration); only rate-limited surfaces as
// an error. Logic unchanged from slice 013 — presentation only.

import { Check } from "lucide-react";
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
        className="flex items-start gap-snug rounded-card border border-border-default bg-surface-raised p-card text-body-sm text-text-secondary"
      >
        <Check
          className="mt-0.5 size-4 shrink-0 text-status-success"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span>
          If an account exists for that address, a reset link is on its way.
          Check your spam folder if you don&rsquo;t see it within a minute.
        </span>
      </p>
    );
  }

  return (
    <form
      action={formAction}
      aria-busy={pending}
      noValidate
      className="flex flex-col gap-grid"
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
