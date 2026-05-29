// Server-only password hashing. `import "server-only"` makes any accidental
// client import a build error — argon2 is a native module and must never reach
// the browser bundle. @node-rs/argon2's hash() defaults to the argon2id variant
// (verified: output begins `$argon2id$`), which is the OWASP-recommended choice.

import "server-only";

import { hash, verify } from "@node-rs/argon2";

/** Hash a plaintext password with argon2id (library defaults). */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/**
 * Verify a plaintext password against a stored argon2 hash.
 * Returns false (never throws) on any malformed-hash error so callers can
 * treat it as a failed credential check.
 */
export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
