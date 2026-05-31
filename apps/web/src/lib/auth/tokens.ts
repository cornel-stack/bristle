// Cryptographic token helpers for email verification + password reset.
// 32 bytes of CSPRNG randomness, base64url-encoded (URL-safe, no padding) so
// the token drops straight into a query string or path segment.

import { randomBytes } from "node:crypto";

/** A 32-byte (256-bit) base64url token, e.g. for verify / reset links. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Absolute expiry `Date` for a token issued now, `ms` milliseconds out. */
export function expiresIn(ms: number): Date {
  return new Date(Date.now() + ms);
}

/** Common TTLs in milliseconds. */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
