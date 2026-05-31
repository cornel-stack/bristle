"use client";

// Client island #2. useActionState for signInWithCredentials. Imports only the
// LoginFormState TYPE + the action (zod runtime stays server-side). Echoes email
// on error; password never echoed.

import Link from "next/link";
import { useActionState } from "react";

import {
  signInWithCredentials,
  type LoginFormState,
} from "@/app/login/actions";

import { AuthField } from "./auth-field";

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
      className="flex flex-col gap-grid rounded-card border border-border-default bg-surface-card p-card"
    >
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" defaultValue={callbackUrl} />
      ) : null}
      {banner ? (
        <p role="alert" className="text-body-sm text-status-error">
          {banner}
        </p>
      ) : null}
      {state.status === "unverified" ? (
        <p role="alert" className="text-body-sm text-status-error">
          Please verify your email before signing in.{" "}
          <Link
            href={`/signup/verify-email-sent?email=${encodeURIComponent(state.email)}`}
            className="font-medium text-accent-bristle hover:underline"
          >
            Resend the link
          </Link>
        </p>
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
      <AuthField
        id="login-password"
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        error={fieldErrors.password}
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-body-sm text-text-secondary hover:text-text-primary"
        >
          Forgot password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
