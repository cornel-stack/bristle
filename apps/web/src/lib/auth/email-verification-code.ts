// Server-only foundation for the 6-digit email-verification code flow.
// Codes are hashed with argon2id (reusing the password wrapper) — NOT a fast
// hash: a 6-digit code has only 10^6 values, so a leaked SHA-256 would be
// brute-forced in microseconds; argon2's cost is what protects a leaked row
// (plan D11 / R1). The runtime cost is irrelevant here — one verify per attempt,
// capped at 5 and rate-limited.

import "server-only";

import { randomInt } from "node:crypto";

import { hashPassword, verifyPassword } from "./password";

/** Code lifetime: 10 minutes (spec C-e). */
export const CODE_TTL_MS = 10 * 60 * 1000;
/** Wrong-code attempts allowed per code before a fresh code is required (C-g). */
export const CODE_MAX_ATTEMPTS = 5;
/** Minimum gap between resend requests, per email (C-f). */
export const RESEND_COOLDOWN_MS = 24 * 1000;
/** Terms-of-Service version captured at signup (C-j). */
export const TERMS_VERSION = "2026-05-31";

/** A cryptographically-random 6-digit code, zero-padded (e.g. "047918"). */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** argon2id hash of a code (constant-time verify; never store the plaintext). */
export function hashCode(code: string): Promise<string> {
  return hashPassword(code);
}

/** Constant-time check of a submitted code against its stored argon2 hash. */
export function verifyCode(input: string, storedHash: string): Promise<boolean> {
  return verifyPassword(storedHash, input);
}

/** Absolute expiry for a code issued now. */
export function codeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}
