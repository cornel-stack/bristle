"use client";

// Reset-password form island (rebuilt, slice 014). useActionState for
// completePasswordReset. New password (PasswordField + live PasswordStrengthMeter
// + PasswordRequirementsList) and a confirm field that shows a green "Match"
// when the two agree. Token via hidden field. On an invalid-link result the
// formError banner pairs with a /forgot-password link. Reset keeps the confirm
// field (design 2_4); only signup dropped it.

import { Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  completePasswordReset,
  type ResetPasswordState,
} from "@/app/reset-password/[token]/actions";

import { AuthFormBanner } from "./auth-form-banner";
import { PasswordField } from "./password-field";
import { PasswordRequirementsList } from "./password-requirements-list";
import { PasswordStrengthMeter } from "./password-strength-meter";

const INITIAL_STATE: ResetPasswordState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    completePasswordReset,
    INITIAL_STATE,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

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
  const matches = password.length > 0 && password === confirm;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      noValidate
      className="flex flex-col gap-grid"
    >
      <input type="hidden" name="token" defaultValue={token} />
      {banner ? <AuthFormBanner key={banner}>{banner}</AuthFormBanner> : null}
      {formError ? (
        <AuthFormBanner>
          {formError}{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-accent-bristle hover:underline"
          >
            Request a new link
          </Link>
        </AuthFormBanner>
      ) : null}
      <div className="flex flex-col gap-tight">
        <PasswordField
          id="reset-password"
          name="password"
          label="New password"
          required
          minLength={12}
          autoComplete="new-password"
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={password} labelId="reset-pw-strength" />
      </div>
      <PasswordField
        id="reset-confirm"
        name="confirmPassword"
        label="Confirm new password"
        required
        minLength={12}
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
        onChange={(e) => setConfirm(e.target.value)}
        labelRight={
          matches ? (
            <span className="flex items-center gap-tight text-body-sm text-status-success">
              <Check className="size-4" strokeWidth={2} aria-hidden="true" />
              Match
            </span>
          ) : undefined
        }
      />
      <PasswordRequirementsList password={password} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password & sign in"}
      </button>
    </form>
  );
}
