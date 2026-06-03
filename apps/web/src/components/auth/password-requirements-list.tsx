"use client";

// Live password-requirements checklist (client component — updates as the user
// types). Four rows; the fourth ("Not used elsewhere") is purely informational
// and always inactive — we cannot verify reuse, so it never turns green. The
// list is aria-live so screen readers announce satisfaction transitions; each
// row carries an sr-only met/not-met prefix so the state is non-visual too.

import { Check } from "lucide-react";

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
  informational?: boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 12 characters", test: (pw) => pw.length >= 12 },
  { label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { label: "Contains uppercase", test: (pw) => /[A-Z]/.test(pw) },
  {
    label: "Not used elsewhere — we can't check this",
    test: () => false,
    informational: true,
  },
];

export function PasswordRequirementsList({ password }: { password: string }) {
  return (
    <ul aria-live="polite" className="flex flex-col gap-tight">
      {REQUIREMENTS.map((req) => {
        const met = !req.informational && req.test(password);
        return (
          <li
            key={req.label}
            className="flex items-center gap-snug text-body-sm"
          >
            <span className="sr-only">{met ? "Met: " : "Not met: "}</span>
            {met ? (
              <span className="flex size-4 items-center justify-center rounded-pill bg-accent-validated">
                <Check
                  className="size-3 text-surface-card"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </span>
            ) : (
              <span
                className="flex size-4 items-center justify-center"
                aria-hidden="true"
              >
                <span className="size-1.5 rounded-pill bg-text-tertiary" />
              </span>
            )}
            <span className={met ? "text-text-primary" : "text-text-tertiary"}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
