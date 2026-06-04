import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  existingSolutions,
  problemFrequencyPoints,
  problemPersonas,
  problemQuotes,
  problemRelated,
  problemSources,
  problems,
  wtpSignals,
  type ExistingSolution,
  type Problem,
  type ProblemFrequencyPoint,
  type ProblemPersona,
  type ProblemQuote,
  type ProblemRelated,
  type ProblemSource,
  type WtpSignal,
} from "./schema";
import {
  passwordResetTokens,
  sessions,
  users,
  verificationTokens,
  type User,
} from "./auth-schema";

export type ConsumeVerificationResult =
  | { ok: true; email: string; name: string | null }
  | { ok: false };

/**
 * Atomically consume an email-verification token: look it up, reject if missing
 * or expired (expired rows are pruned), else mark the user verified and delete
 * the token (single-use). All in one transaction so verify + delete cannot
 * partially apply. Returns the verified user's email + name for the welcome mail.
 */
export async function consumeVerificationToken(
  token: string,
): Promise<ConsumeVerificationResult> {
  return getDb().transaction(async (tx) => {
    const [vt] = await tx
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);
    if (!vt) return { ok: false };
    if (vt.expires.getTime() < Date.now()) {
      await tx
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return { ok: false };
    }
    const now = new Date();
    const [u] = await tx
      .update(users)
      .set({ emailVerified: now, updatedAt: now })
      .where(eq(users.email, vt.identifier))
      .returning({ email: users.email, name: users.name });
    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));
    if (!u) return { ok: false };
    return { ok: true, email: u.email, name: u.name };
  });
}

// Fetches one user by (already-normalized) email, or undefined if none. Used by
// the credentials authorize() and the auth Server Actions. Keeps Drizzle query
// construction inside @bristle/db so apps/web needs no direct drizzle-orm dep.
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row;
}

// Inserts a new (unverified) credentials user. Throws on the email unique
// constraint if the address is already taken — callers treat that as a generic
// failure (no enumeration).
export async function createUser(input: {
  email: string;
  name: string | null;
  passwordHash: string;
  termsAcceptedAt?: Date | null;
  termsVersion?: string | null;
}): Promise<User> {
  const [row] = await getDb().insert(users).values(input).returning();
  if (!row) throw new Error("user insert returned no row");
  return row;
}

// --- Slice 014: 6-digit email-verification-code helpers ---------------------

// Store a fresh (hashed) verification code on a user: sets the hash + expiry and
// resets the attempt counter. Used by createAccount (initial) and resend.
export async function setEmailVerificationCode(input: {
  userId: string;
  codeHash: string;
  expires: Date;
}): Promise<void> {
  const now = new Date();
  await getDb()
    .update(users)
    .set({
      emailVerificationCode: input.codeHash,
      emailVerificationCodeExpires: input.expires,
      emailVerificationAttempts: 0,
      updatedAt: now,
    })
    .where(eq(users.id, input.userId));
}

// Atomically bump the wrong-code attempt counter; returns the new count so the
// action can report remaining attempts. Called after a failed argon2 verify.
export async function incrementEmailVerificationAttempts(
  userId: string,
): Promise<number> {
  const [row] = await getDb()
    .update(users)
    .set({
      emailVerificationAttempts: sql`${users.emailVerificationAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ attempts: users.emailVerificationAttempts });
  return row?.attempts ?? 0;
}

export type ConsumeEmailCodeResult =
  | { ok: true; email: string; name: string | null }
  | {
      ok: false;
      reason: "not-found" | "already-verified" | "expired" | "too-many-attempts";
    };

// Atomically flip an unverified user to verified and clear the code state. The
// argon2 verify happens in the calling action (argon2 must not live in the DB
// package); this re-checks the DB-side conditions inside the transaction so a
// concurrent request cannot double-consume (TOCTOU-safe). Mirrors the
// consumeVerificationToken pattern. `maxAttempts` is passed in to avoid a
// cross-package constant import.
export async function consumeEmailVerificationCode(input: {
  userId: string;
  maxAttempts: number;
}): Promise<ConsumeEmailCodeResult> {
  return getDb().transaction(async (tx) => {
    const [u] = await tx
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!u) return { ok: false, reason: "not-found" };
    if (u.emailVerified) return { ok: false, reason: "already-verified" };
    if (u.emailVerificationAttempts >= input.maxAttempts) {
      return { ok: false, reason: "too-many-attempts" };
    }
    if (
      !u.emailVerificationCodeExpires ||
      u.emailVerificationCodeExpires.getTime() < Date.now()
    ) {
      return { ok: false, reason: "expired" };
    }
    const now = new Date();
    await tx
      .update(users)
      .set({
        emailVerified: now,
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
        emailVerificationAttempts: 0,
        updatedAt: now,
      })
      .where(eq(users.id, input.userId));
    return { ok: true, email: u.email, name: u.name };
  });
}

// Hard-delete an UNVERIFIED user by email (the "use a different email"
// affordance). The `emailVerified IS NULL` guard makes it impossible to delete a
// verified account. Returns whether a row was removed.
export async function deleteUnverifiedUserByEmail(
  email: string,
): Promise<boolean> {
  const rows = await getDb()
    .delete(users)
    .where(and(eq(users.email, email), isNull(users.emailVerified)))
    .returning({ id: users.id });
  return rows.length > 0;
}

// Inserts an email-verification token (24h TTL set by the caller).
export async function createVerificationToken(input: {
  identifier: string;
  token: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(verificationTokens).values(input);
}

// Inserts a database session row. Used by the credentials login action, which
// must create the DB session itself (Auth.js core does not persist a database
// session for the Credentials provider — see apps/web/src/auth.ts).
export async function createSession(input: {
  sessionToken: string;
  userId: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(sessions).values(input);
}

// Inserts a password-reset token (1h TTL set by the caller, used=false default).
export async function createPasswordResetToken(input: {
  userId: string;
  token: string;
  expires: Date;
}): Promise<void> {
  await getDb().insert(passwordResetTokens).values(input);
}

// Read-only validity check for the /reset-password/[token] page pre-check:
// returns true only if the token exists, is unused, and is not expired. Does NOT
// consume the token (that is consumePasswordResetToken's atomic job).
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

// Read-only: the email tied to a VALID (unused, unexpired) reset token — for the
// reset page's "Resetting password for [email]" context pill (slice 014, design
// 2_4). Returns null when the token is invalid, so the page can render its
// "no longer valid" state from the same call. consumePasswordResetToken still
// re-validates atomically at submit (this is advisory, not the boundary).
export async function getValidResetTokenEmail(
  token: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ email: users.email })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires, new Date()),
      ),
    )
    .limit(1);
  return row?.email ?? null;
}

// Atomically consume a password-reset token: re-check existence + unused +
// unexpired (TOCTOU — the page pre-check may be stale), update the user's
// password, mark the token used, and delete ALL of that user's sessions
// (log out everywhere on password change). One transaction.
export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string,
): Promise<{ ok: boolean }> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    if (!row || row.used || row.expires.getTime() < Date.now()) {
      return { ok: false };
    }
    const now = new Date();
    await tx
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: now })
      .where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, row.id));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
    return { ok: true };
  });
}

// Fetches the single problem for the homepage. Throws if none exists — a missing
// seed is a deployment defect, not a runtime empty state (Slice 1.4 non-goal).
export async function getFirstProblem(): Promise<Problem> {
  const [row] = await getDb().select().from(problems).limit(1);
  if (!row) throw new Error("No problem found — has the database been seeded?");
  return row;
}

// Fetches one problem by its stable slug. Throws if absent — same
// defect-not-empty-state semantics as getFirstProblem (used for the pinned hero).
export async function getProblemBySlug(slug: string): Promise<Problem> {
  const [row] = await getDb()
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  if (!row) throw new Error(`No problem found for slug "${slug}".`);
  return row;
}

// Fetches the most-recently-seen problems, optionally excluding one slug (used to
// keep the hero's pinned problem out of the sample row). Returns an empty array on
// an empty database — does NOT throw.
export async function getRecentProblems(opts: {
  limit: number;
  excludeSlug?: string;
}): Promise<Problem[]> {
  const { limit, excludeSlug } = opts;
  const base = getDb().select().from(problems);
  const filtered = excludeSlug
    ? base.where(ne(problems.slug, excludeSlug))
    : base;
  return filtered.orderBy(desc(problems.lastSeenAt)).limit(limit);
}

// --- Slice 015: onboarding capture helpers ----------------------------------
// All three are single-statement UPDATEs (inherently atomic). `getUserByEmail`
// above is reused for the page guards — it already returns the four new columns
// once auth-schema declares them, so no dedicated read helper is needed. The
// `role`/`categories` values are validated (enum / 3–5 known slugs) by the
// Server Actions before they reach here; this layer takes plain string inputs.

// Step 1: persist the chosen role (+ optional free-text for "other"). Does NOT
// set onboarding_completed_at — picking a role is not completing onboarding.
export async function saveUserRole(input: {
  userId: string;
  role: string;
  roleCustom?: string | null;
}): Promise<void> {
  await getDb()
    .update(users)
    .set({
      role: input.role,
      roleCustom: input.roleCustom ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));
}

// Step 2: persist the watched categories AND complete onboarding in one
// statement — the slug array and the completion timestamp land together.
export async function saveUserCategories(input: {
  userId: string;
  categories: string[];
}): Promise<void> {
  const now = new Date();
  await getDb()
    .update(users)
    .set({
      watchedCategories: input.categories,
      onboardingCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, input.userId));
}

// The "Skip for now" path: complete onboarding without recording role or
// categories. Leaves whatever partial state already exists untouched.
export async function completeOnboarding(userId: string): Promise<void> {
  const now = new Date();
  await getDb()
    .update(users)
    .set({ onboardingCompletedAt: now, updatedAt: now })
    .where(eq(users.id, userId));
}

// --- Slice 016: product read queries ----------------------------------------

// Dashboard / Library problems, momentum-descending (SC-004). Fully typed.
export async function getDashboardProblems(): Promise<Problem[]> {
  return getDb().select().from(problems).orderBy(desc(problems.momentumPct));
}

export interface ProblemDetail {
  problem: Problem;
  sources: ProblemSource[];
  quotes: ProblemQuote[];
  solutions: ExistingSolution[];
  wtp: WtpSignal | null;
  personas: ProblemPersona[];
  related: ProblemRelated[];
  frequency: ProblemFrequencyPoint[];
}

// One problem + all its child rows for the page-2 detail screen. undefined if the
// slug is unknown.
export async function getProblemDetail(
  slug: string,
): Promise<ProblemDetail | undefined> {
  const db = getDb();
  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  if (!problem) return undefined;
  const pid = problem.id;
  const [sources, quotes, solutions, wtpRows, personas, related, frequency] =
    await Promise.all([
      db.select().from(problemSources).where(eq(problemSources.problemId, pid)),
      db
        .select()
        .from(problemQuotes)
        .where(eq(problemQuotes.problemId, pid))
        .orderBy(problemQuotes.position),
      db
        .select()
        .from(existingSolutions)
        .where(eq(existingSolutions.problemId, pid))
        .orderBy(existingSolutions.position),
      db
        .select()
        .from(wtpSignals)
        .where(eq(wtpSignals.problemId, pid))
        .limit(1),
      db
        .select()
        .from(problemPersonas)
        .where(eq(problemPersonas.problemId, pid))
        .orderBy(problemPersonas.position),
      db
        .select()
        .from(problemRelated)
        .where(eq(problemRelated.problemId, pid))
        .orderBy(problemRelated.position),
      db
        .select()
        .from(problemFrequencyPoints)
        .where(eq(problemFrequencyPoints.problemId, pid))
        .orderBy(problemFrequencyPoints.observedOn),
    ]);
  return {
    problem,
    sources,
    quotes,
    solutions,
    wtp: wtpRows[0] ?? null,
    personas,
    related,
    frequency,
  };
}
