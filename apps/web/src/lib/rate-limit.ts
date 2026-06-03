// In-memory, per-instance rate limiter for the auth Server Actions.
//
// LIMITATION (documented, accepted for v1): the counter lives in a module-scope
// Map on a single server instance. Multiple Vercel function instances each keep
// their own counter, so the effective global limit scales with instance count.
// Acceptable for an indie-product launch; the tracked follow-up is Upstash Redis
// (or equivalent) distributed limiting before traffic warrants it.
//
// No setInterval/timer: expired buckets are pruned lazily on read, keeping the
// module side-effect-free at import time.

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

export interface RateLimitInput {
  /** Stable key, e.g. `signup:1.2.3.4`. */
  key: string;
  /** Max allowed hits within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets, present only when blocked. */
  retryAfter?: number;
}

/**
 * Record one hit against `key` and report whether it is allowed. The first hit
 * in a fresh window opens a bucket; subsequent hits increment it until `limit`
 * is exceeded, after which `allowed` is false until `resetAt`.
 */
export function check({ key, limit, windowMs }: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true };
  }

  return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
}

/** Extract the client IP from forwarding headers, with a stable fallback. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? "unknown";
}

/** Per-action limits (count / window). */
export const RATE_LIMITS = {
  signup: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 / hour
  login: { limit: 5, windowMs: 60 * 1000 }, // 5 / minute
  forgot: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 / hour
  // 10 / min per IP — a coarse abuse cap; the precise 5-attempts-per-code limit
  // is enforced by the email_verification_attempts column (slice 014).
  verifyCode: { limit: 10, windowMs: 60 * 1000 },
} as const;
