"use client";

// Client island #4. useActionState for completePasswordReset. The token comes
// from the page (route param) via a hidden field. On an invalid-link result the
// formError banner pairs with a /forgot-password link.

import Link from "next/link";
import { useActionState } from "react";

import {
  completePasswordReset,
  type ResetPasswordState,
} from "@/app/reset-password/[token]/actions";

import { AuthField } from "./auth-field";

const INITIAL_STATE: ResetPasswordState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    completePasswordReset,
    INITIAL_STATE,
  );

  const fieldErrors =
    state.status === "validation-error" ? state.fieldErrors : {};
  const formError =
    state.status === "validation-error" ? state.formError : undefined;
  const banner =
    state.status === "rate-limited"
      ? state.message
      : state.status === "transport-error"
        ? state.message
        : undefined;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      noValidate
      className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
    >
      <input type="hidden" name="token" defaultValue={token} />
      {banner ? (
        <p role="alert" className="text-body-sm text-status-error">
          {banner}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="text-body-sm text-status-error">
          {formError}{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-accent-bristle hover:underline"
          >
            Request a new link
          </Link>
        </p>
      ) : null}
      <AuthField
        id="reset-password"
        name="password"
        label="New password"
        type="password"
        required
        minLength={12}
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <AuthField
        id="reset-confirm"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        required
        minLength={12}
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
      />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
