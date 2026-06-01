"use client";

// 6-box one-time-code input (client component — focus management + paste).
// Controlled: the parent owns the joined value string and receives updates via
// onChange; completion is derived from value.length (the component never
// auto-submits — an explicit "Verify & continue" click is required, FR-011).
//
// Interaction model (R6/D14): type-to-advance, Backspace clears then retreats,
// Arrow keys navigate, paste spreads digits from the focused box rightward,
// non-digits are ignored, numeric keypad on mobile. Each box is 48px (≥ the
// 44px WCAG 2.5.5 target). A polite live region announces completion.
//
// no-JS note: this enhanced input requires JS; the verify page provides a plain
// fallback input for the JS-disabled path (wired in Batch D). When `name` is
// set, a hidden input carries the joined value for form submission.

import { useId, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  name?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function CodeInput({
  value,
  onChange,
  length = 6,
  name,
  autoFocus,
  disabled,
}: CodeInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const legendId = useId();
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");
  const complete = value.length === length;

  const focusBox = (i: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const setChar = (i: number, char: string) => {
    const next = chars.slice();
    next[i] = char;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit && raw !== "") return; // non-digit input ignored
    setChar(i, digit);
    if (digit && i < length - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (chars[i]) {
        setChar(i, "");
      } else if (i > 0) {
        e.preventDefault();
        setChar(i - 1, "");
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    const next = chars.slice();
    for (let k = 0; k < digits.length && i + k < length; k++) {
      next[i + k] = digits.charAt(k);
    }
    onChange(next.join("").slice(0, length));
    focusBox(Math.min(i + digits.length, length - 1));
  };

  return (
    <fieldset disabled={disabled} className="m-0 border-0 p-0">
      <legend id={legendId} className="sr-only">
        Enter the {length}-digit verification code
      </legend>
      <div className="flex gap-snug" role="group" aria-labelledby={legendId}>
        {chars.map((char, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={char}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of ${length}`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            className="size-12 rounded-card border border-border-default bg-surface-card text-center font-mono text-h3 text-text-primary focus-visible:border-accent-bristle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          />
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {complete
          ? "Code complete. Press Verify and continue."
          : `${value.length} of ${length} digits entered.`}
      </p>
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </fieldset>
  );
}
