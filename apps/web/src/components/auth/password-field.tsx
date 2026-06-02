"use client";

// Labeled password input with an inline show/hide eye toggle (client component
// — the toggle needs local state). The label row supports an optional
// right-aligned node (`labelRight`) for the login page's "Forgot?" link.
//
// CLIENT NOTE: this is a leaf component imported into the form islands
// (signup-form, login-form, reset-password-form). Per the slice's island
// convention (plan D16) it counts toward the per-route bundle, not the
// route-level island budget. The eye button is keyboard-reachable and labels
// its action; the input wires label↔input (htmlFor) and error (aria-describedby
// + role="alert"), WCAG 2.2 AA.

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  /** Optional right-aligned label node, e.g. a "Forgot?" link on /login. */
  labelRight?: ReactNode;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  defaultValue?: string;
  error?: string;
  /** Forwarded input change — lets a parent drive a live strength meter. */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordField({
  id,
  name,
  label,
  labelRight,
  required,
  autoComplete,
  minLength,
  defaultValue,
  error,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-tight">
      <div className="flex items-baseline justify-between gap-snug">
        <label htmlFor={id} className="text-body-sm font-medium text-text-primary">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full rounded-button border border-border-default bg-surface-card px-snug py-2 pr-10 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-snug text-text-tertiary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-body-sm text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
