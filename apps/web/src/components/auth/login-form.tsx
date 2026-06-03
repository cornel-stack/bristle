"use client";

// Login form island (rebuilt, slice 014). useActionState(signInWithCredentials).
// Adds "Keep me signed in" (rememberMe) + the "Forgot?" link via PasswordField's
// labelRight slot. The unverified-state nudge now points at the new code-verify
// page (/signup/verify-email) — resolving the T026 dangler. OAuth row / divider
// / overline / heading are server-rendered in the page. Echoes email on error.

import Link from "next/link";
import { useActionState } from "react";

import {
  signInWithCredentials,
  type LoginFormState,
} from "@/app/login/actions";

import { AuthField } from "./auth-field";
import { AuthFormBanner } from "./auth-form-banner";
import { PasswordField } from "./password-field";

const INITIAL_STATE: LoginFormState = { status: "idle" };

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
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
      className="flex flex-col gap-grid"
    >
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" defaultValue={callbackUrl} />
      ) : null}
      {banner ? <AuthFormBanner key={banner}>{banner}</AuthFormBanner> : null}
      {state.status === "unverified" ? (
        <AuthFormBanner>
          Verify your email before signing in.{" "}
          <Link
            href={`/signup/verify-email?email=${encodeURIComponent(state.email)}`}
            className="font-medium text-accent-bristle hover:underline"
          >
            Enter your code
          </Link>
        </AuthFormBanner>
      ) : null}
      <AuthField
        id="login-email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        defaultValue={values.email ?? ""}
        error={fieldErrors.email}
      />
      <PasswordField
        id="login-password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
        error={fieldErrors.password}
        labelRight={
          <Link
            href="/forgot-password"
            className="text-body-sm text-text-secondary hover:text-text-primary"
          >
            Forgot?
          </Link>
        }
      />
      <label className="flex items-center gap-snug text-body-sm text-text-secondary">
        <input
          type="checkbox"
          name="rememberMe"
          className="size-4 accent-accent-bristle"
        />
        Keep me signed in
      </label>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}
