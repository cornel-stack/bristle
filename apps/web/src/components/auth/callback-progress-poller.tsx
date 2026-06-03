"use client";

// Drives the OAuth callback progress checklist and redirects once the session
// lands (client island). The common path is that the page's server-side auth()
// already saw the session and redirected before this mounts; this poller is the
// slow-connection / race fallback (FR-018).
//
// MECHANISM: polls the Auth.js session endpoint GET /api/auth/session every
// 500ms. Chosen over useSession (finicky with the v5 database strategy; needs a
// SessionProvider) and over a custom Server Action (redundant — Auth.js already
// exposes this endpoint, which reads the pinned session cookie + DB). On a
// detected session it advances to "Loading workspace" then redirects; after a
// 10s timeout it falls back to /login (C-i). The active pulse honors
// prefers-reduced-motion.

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 500;
const TIMEOUT_MS = 10_000;
const SETTLE_MS = 200;

type Phase = "creating" | "loading";
type StepState = "done" | "active" | "pending";

interface CallbackProgressPollerProps {
  provider: "google" | "github";
  callbackUrl?: string;
}

export function CallbackProgressPoller({
  provider,
  callbackUrl,
}: CallbackProgressPollerProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("creating");
  const label = provider === "google" ? "Google" : "GitHub";
  // Only honor an internal path as the destination; otherwise /account.
  const destination =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/account";

  useEffect(() => {
    let active = true;
    const timers: { settle?: ReturnType<typeof setTimeout> } = {};

    const tick = async () => {
      if (!active) return;
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const data: { user?: unknown } | null = await res.json();
        if (active && data && data.user) {
          active = false;
          setPhase("loading");
          timers.settle = setTimeout(() => router.replace(destination), SETTLE_MS);
        }
      } catch {
        // transient — keep polling until the timeout fallback
      }
    };

    const poll = setInterval(tick, POLL_MS);
    const fallback = setTimeout(() => {
      if (active) router.replace("/login");
    }, TIMEOUT_MS);
    void tick();

    return () => {
      active = false;
      clearInterval(poll);
      clearTimeout(fallback);
      if (timers.settle) clearTimeout(timers.settle);
    };
  }, [router, destination]);

  const steps: { label: string; state: StepState }[] = [
    { label: `Authenticated with ${label}`, state: "done" },
    { label: "Verifying ID token signature", state: "done" },
    {
      label: "Creating Bristle session",
      state: phase === "creating" ? "active" : "done",
    },
    {
      label: "Loading workspace",
      state: phase === "loading" ? "active" : "pending",
    },
  ];

  return (
    <ul aria-live="polite" className="flex flex-col gap-snug">
      {steps.map((step) => (
        <li
          key={step.label}
          className="flex items-center gap-snug text-body-sm"
        >
          {step.state === "done" ? (
            <span className="flex size-4 items-center justify-center rounded-pill bg-accent-validated">
              <Check
                className="size-3 text-surface-card"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </span>
          ) : step.state === "active" ? (
            <span
              aria-hidden="true"
              className="flex size-4 items-center justify-center"
            >
              <span className="size-2 animate-pulse rounded-pill bg-accent-bristle motion-reduce:animate-none" />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-4 items-center justify-center"
            >
              <span className="size-1.5 rounded-pill bg-text-tertiary" />
            </span>
          )}
          <span
            className={
              step.state === "pending" ? "text-text-tertiary" : "text-text-primary"
            }
          >
            {step.label}
            <span className="sr-only">
              {step.state === "done"
                ? " — done"
                : step.state === "active"
                  ? " — in progress"
                  : " — pending"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
