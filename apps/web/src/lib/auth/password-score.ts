// Pure, dependency-free password-strength scoring (NO zxcvbn — plan D7/R5).
// Advisory UX only: the authoritative floor is the server-side >=12-char rule.
// Weighting: length is the dominant factor (a long passphrase carries real
// entropy even at low character-class diversity), then class diversity, then a
// penalty for trivial repeats/sequences. Pure function — no DOM, no side
// effects — so it is unit-testable and reusable on the server if needed.

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: StrengthScore;
  label: string;
}

const LABELS: Record<StrengthScore, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong — 12+ chars, mixed case, one number",
  4: "Excellent — passphrase-style passwords resist 4M× more attempts.",
};

function characterClasses(pw: string): number {
  let n = 0;
  if (/[a-z]/.test(pw)) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/\d/.test(pw)) n++;
  if (/[^a-zA-Z0-9]/.test(pw)) n++;
  return n;
}

function hasTrivialSequence(pw: string): boolean {
  if (/(.)\1\1/.test(pw)) return true; // 3+ identical chars in a row
  const s = pw.toLowerCase();
  for (let i = 0; i + 2 < s.length; i++) {
    const a = s.charCodeAt(i);
    const b = s.charCodeAt(i + 1);
    const c = s.charCodeAt(i + 2);
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true;
  }
  return false;
}

export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };

  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (password.length >= 16) points++;

  const classes = characterClasses(password);
  if (classes >= 2) points++;
  if (classes >= 3) points++;

  if (hasTrivialSequence(password)) points = Math.max(1, points - 2);

  let score: StrengthScore;
  if (points <= 1) score = 1;
  else if (points === 2) score = 2;
  else if (points <= 4) score = 3;
  else score = 4;

  // Passphrase path: 20+ clean chars rate Excellent regardless of class mix.
  if (password.length >= 20 && !hasTrivialSequence(password)) score = 4;

  return { score, label: LABELS[score] };
}
