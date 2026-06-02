"use client";

// Verify-email code form island (slice 014). Wraps CodeInput + the three
// verify-email Server Actions: verifyEmailCode (form submit, useActionState),
// resendVerificationCode + useDifferentEmail (imperative, useTransition). The
// resend control shows a live 24s countdown synced to the server cooldown via
// the action's retryAfter. NOTE: useDifferentEmail is aliased on import so it
// is not mistaken for a React hook by the rules-of-hooks lint.

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import {
  resendVerificationCode,
  useDifferentEmail as runUseDifferentEmail,
  verifyEmailCode,
  type ResendCodeState,
  type VerifyCodeState,
} from "@/app/signup/verify-email/actions";

import { CodeInput } from "./code-input";

const RESEND_COOLDOWN_SECONDS = 24;
const INITIAL: VerifyCodeState = { status: "idle" };

function deriveError(state: VerifyCodeState): string | undefined {
  switch (state.status) {
    case "validation-error":
      return state.fieldErrors.code ?? state.fieldErrors.email;
    case "code-expired":
      return "That code expired. Request a new one.";
    case "too-many-attempts":
      return "Too many attempts. Request a new code.";
    case "incorrect":
      return state.remainingAttempts > 0
        ? `Incorrect code. ${state.remainingAttempts} ${state.remainingAttempts === 1 ? "attempt" : "attempts"} left.`
        : "Incorrect code. Request a new code.";
    case "rate-limited":
    case "transport-error":
      return state.message;
    default:
      return undefined;
  }
}

export function VerifyEmailCodeForm({ email }: { email: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(verifyEmailCode, INITIAL);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [busy, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(
      () => setCooldown((c) => (c <= 1 ? 0 : c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || busy) return;
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res: ResendCodeState = await resendVerificationCode(fd);
      if (res.status === "sent") {
        setCooldown(res.retryAfter);
        setNotice("A new code is on its way.");
      } else if (res.status === "cooldown") {
        setCooldown(res.retryAfter);
      } else if (res.status === "rate-limited" || res.status === "error") {
        setNotice(res.message);
      }
    });
  };

  const handleDifferentEmail = () => {
    if (busy) return;
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await runUseDifferentEmail(fd);
      if (res.status === "done") {
        router.push("/signup");
      } else if (res.status === "rate-limited" || res.status === "error") {
        setNotice(res.message);
      }
    });
  };

  const error = deriveError(state);

  return (
    <div className="flex flex-col gap-grid">
      <form
        action={formAction}
        aria-busy={pending}
        noValidate
        className="flex flex-col gap-grid"
      >
        <input type="hidden" name="email" value={email} />
        <CodeInput value={code} onChange={setCode} name="code" autoFocus />
        {error ? (
          <p role="alert" className="text-body-sm text-status-error">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          aria-busy={pending}
          className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify & continue →"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-snug text-body-sm text-text-secondary">
        <span>Didn&rsquo;t get it?</span>
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={busy}
            className="font-medium text-accent-bristle hover:underline disabled:opacity-60"
          >
            Resend code
          </button>
        )}
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={handleDifferentEmail}
          disabled={busy}
          className="font-medium text-accent-bristle hover:underline disabled:opacity-60"
        >
          Use a different email
        </button>
      </div>

      {notice ? (
        <p role="status" aria-live="polite" className="text-body-sm text-text-secondary">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
