"use client";

// The first-run spotlight tour (slice 025) — the ONE new client island, mounted
// on the dashboard route only. Ephemeral, session-scoped (A1): a module-level
// `tourDismissed` singleton survives soft navigations (the module stays loaded)
// and resets on a hard reload (the module is re-evaluated). NO DB write, NO
// server action, NO localStorage/sessionStorage. Hand-rolled (A2): dim overlay +
// spotlight cutout + positioned bubble + 5-step machine + the shared dialog
// focus-trap — no new dependency. Targets resolve via in-app `data-tour` anchors
// (A3); the shared @bristle/ui ProblemCardFull leaf is never touched.

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { TOUR_LENGTH, TOUR_STEPS, type TourTargetKey } from "./tour-steps";

// Session-scoped flag (A1) — lives at module scope so it persists across soft
// nav and resets only on a hard reload. Tier 5.5 (TF-028) swaps it for a real
// per-user `tour_completed` read/write (a column this slice does not add).
let tourDismissed = false;

type Rect = { top: number; left: number; width: number; height: number };

const DIM = "color-mix(in srgb, var(--color-text-primary) 40%, transparent)";

function resolveRect(targetKey: TourTargetKey | undefined): Rect | null {
  if (!targetKey || typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${targetKey}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden (narrow width) → center
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function FirstRunTour() {
  const [open, setOpen] = useState(() => !tourDismissed);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_LENGTH - 1;

  const dismiss = useCallback(() => {
    tourDismissed = true;
    setOpen(false);
  }, []);
  const next = useCallback(() => {
    if (isLast) dismiss();
    else setStep((s) => s + 1);
  }, [isLast, dismiss]);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Resolve + track the active target rect (A2 reposition — the genuinely
  // uncertain hand-roll bit). Recompute on step change, resize, and scroll.
  useEffect(() => {
    if (!open) return;
    const recompute = () => setRect(resolveRect(current?.targetKey));
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [open, current?.targetKey]);

  // Shared dialog pattern (add-category modal / mobile drawer): focus the bubble
  // on open, trap Tab, Esc dismisses, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const panel = bubbleRef.current;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusable()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusable();
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [open, dismiss]);

  // Refocus the bubble's first control on each step change so keyboard + SR
  // users land inside the new step.
  useEffect(() => {
    if (!open) return;
    bubbleRef.current
      ?.querySelector<HTMLElement>(
        'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
  }, [open, step]);

  if (!open || !current) return null;

  // Bubble placement: below the target when there's room, else above; centered
  // when there's no target (closing step / missing anchor). Clamped to the
  // viewport so it never overflows on mobile.
  const PAD = 12;
  const BUBBLE_W = 360;
  let bubbleStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + PAD;
    const wouldOverflow = below + 320 > window.innerHeight;
    const top = wouldOverflow
      ? Math.max(PAD, rect.top - 320 - PAD)
      : below;
    const left = Math.min(
      Math.max(PAD, rect.left),
      Math.max(PAD, window.innerWidth - BUBBLE_W - PAD),
    );
    bubbleStyle = { top, left, width: `min(${BUBBLE_W}px, calc(100vw - 24px))` };
  } else {
    bubbleStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `min(${BUBBLE_W}px, calc(100vw - 24px))`,
    };
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim + spotlight. With a target, the cutout's box-shadow dims everything
          outside it; without one, a flat dim covers the page. pointer-events on
          the dim let clicks fall through to dismiss the tour. */}
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-card ring-2 ring-accent-bristle transition-[top,left,width,height] duration-180 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: `0 0 0 9999px ${DIM}`,
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: DIM }}
        />
      )}

      {/* Click-catcher over the dim → dismiss (matches the modal backdrop). */}
      <button
        type="button"
        aria-label="End tour"
        tabIndex={-1}
        onClick={dismiss}
        className="absolute inset-0 cursor-default"
      />

      {/* SR step announcement */}
      <div aria-live="polite" className="sr-only">
        {`Step ${step + 1} of ${TOUR_LENGTH}: ${current.title}`}
      </div>

      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        style={bubbleStyle}
        className="absolute rounded-modal border border-border-default bg-surface-card p-card shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-[top,left] duration-180 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
      >
        <div className="mb-snug flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-secondary">
            Tour · {step + 1} of {TOUR_LENGTH}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="End tour"
            className="flex size-7 items-center justify-center rounded-button text-text-secondary hover:bg-surface-raised hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <h2 id={titleId} className="font-serif text-h3 font-semibold text-text-primary">
          {current.title}
        </h2>
        <p id={bodyId} className="mt-tight text-body-sm text-text-secondary">
          {current.body}
        </p>

        {current.tip ? (
          <div className="mt-grid flex items-center gap-snug rounded-button bg-surface-raised px-snug py-2">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded border border-border-default font-mono text-mono-sm text-text-secondary"
            >
              ⌘
            </span>
            <span className="text-body-sm text-text-secondary">{current.tip}</span>
          </div>
        ) : null}

        <div className="mt-grid flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {TOUR_STEPS.map((s) => (
              <span
                key={s.index}
                className={`size-1.5 rounded-pill transition-colors ${
                  s.index === step ? "bg-accent-bristle" : "bg-border-strong"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-tight">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-button px-3 py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="rounded-button bg-accent-bristle px-3 py-1.5 text-body-sm font-medium text-surface-card transition-colors hover:bg-accent-bristle/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              {isLast ? "Done" : "Next →"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-snug block w-full rounded-button py-1 text-center text-body-sm text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          End tour and explore on my own
        </button>
      </div>
    </div>
  );
}
