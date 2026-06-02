"use client";

// 4-segment password strength meter (client component — updates live as the
// user types). Scoring is delegated to the pure `scorePassword` lib so the
// component stays presentational. Filled segments share the current score's
// colour (matches the design — not a per-segment gradient). The qualitative
// label carries an optional `labelId` so a consuming form can wire it into the
// password input's aria-describedby.

import { scorePassword, type StrengthScore } from "@/lib/auth/password-score";

const SEGMENT_COLOR: Record<Exclude<StrengthScore, 0>, string> = {
  1: "bg-status-error",
  2: "bg-status-warning",
  3: "bg-status-success",
  4: "bg-accent-validated",
};

interface PasswordStrengthMeterProps {
  password: string;
  /** id applied to the label <p> so the consumer can reference it. */
  labelId?: string;
}

export function PasswordStrengthMeter({
  password,
  labelId,
}: PasswordStrengthMeterProps) {
  const { score, label } = scorePassword(password);
  return (
    <div className="flex flex-col gap-tight">
      <div
        className="flex gap-tight"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={`h-1 flex-1 rounded-pill ${
              score > 0 && seg <= score
                ? SEGMENT_COLOR[score as Exclude<StrengthScore, 0>]
                : "bg-border-default"
            }`}
          />
        ))}
      </div>
      {label ? (
        <p
          id={labelId}
          aria-live="polite"
          className="text-body-sm text-text-secondary"
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
