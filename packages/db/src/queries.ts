import { and, count, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import {
  WeeklyMomentumSchema,
  isSourceKey,
  resolveBadge,
  type WeeklyMomentum,
} from "@bristle/shared";
import { getDb } from "./client";
import {
  alertNotifications,
  alertRules,
  categories,
  dashboardFixtures,
  existingSolutions,
  problemActivityLog,
  problemFrequencyPoints,
  problemPersonas,
  problemQuotes,
  problemRelated,
  problemSources,
  problems,
  savedCollections,
  usageMeters,
  userSavedProblems,
  wtpSignals,
  type Category,
  type ExistingSolution,
  type Problem,
  type ProblemActivity,
  type ProblemFrequencyPoint,
  type ProblemPersona,
  type ProblemQuote,
  type ProblemRelated,
  type ProblemSource,
  type AlertNotification,
  type AlertRule,
  type SavedCollection,
  type UsageMeter,
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

// --- Slice 4.2 (017): dashboard read helpers --------------------------------
// All read-only, all scoped to the userId resolved by the app's getAppUser() seam
// (apps/web/src/lib/app-user.ts) — never a hardcoded id. JSON payloads are parsed
// through the shared Zod contract at the boundary.

// The four KPI tiles + the greeting subhead counts.
export async function getUsageMeters(userId: string): Promise<UsageMeter[]> {
  return getDb()
    .select()
    .from(usageMeters)
    .where(eq(usageMeters.userId, userId));
}

// The sidebar's watched categories (label + displayed count + tint keys), in the
// user's watched order (= the design sidebar order), not the catalog order.
export async function getWatchedCategories(
  userId: string,
): Promise<Category[]> {
  const db = getDb();
  const [u] = await db
    .select({ watched: users.watchedCategories })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const slugs = u?.watched ?? [];
  if (slugs.length === 0) return [];
  const rows = await db
    .select()
    .from(categories)
    .where(inArray(categories.key, slugs));
  return rows.sort((a, b) => slugs.indexOf(a.key) - slugs.indexOf(b.key));
}

// The recent-activity rail: the user's own entries + global (user_id null) ones,
// newest first.
export async function getRecentActivity(
  userId: string,
  limit = 5,
): Promise<ProblemActivity[]> {
  return getDb()
    .select()
    .from(problemActivityLog)
    .where(
      or(
        eq(problemActivityLog.userId, userId),
        isNull(problemActivityLog.userId),
      ),
    )
    .orderBy(desc(problemActivityLog.createdAt))
    .limit(limit);
}

// The dashboard weekly-momentum chart payload — parsed through the shared Zod
// contract (null if absent or malformed).
export async function getWeeklyMomentum(
  userId: string,
): Promise<WeeklyMomentum | null> {
  const [row] = await getDb()
    .select()
    .from(dashboardFixtures)
    .where(
      and(
        eq(dashboardFixtures.userId, userId),
        eq(dashboardFixtures.key, "weekly_momentum"),
      ),
    )
    .limit(1);
  if (!row) return null;
  const parsed = WeeklyMomentumSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}

// The top-bar bell badge.
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(alertNotifications)
    .where(
      and(
        eq(alertNotifications.userId, userId),
        eq(alertNotifications.isRead, false),
      ),
    );
  return row?.n ?? 0;
}

// WTP signal mention-count per problem (problemId → count) — the dashboard's
// Willingness-to-pay sort needs it (wtp_signals lives off the Problem row).
// Read-only.
export async function getWtpCountsByProblem(): Promise<Record<string, number>> {
  const rows = await getDb()
    .select({ pid: wtpSignals.problemId, n: wtpSignals.mentionCount })
    .from(wtpSignals);
  return Object.fromEntries(rows.map((r) => [r.pid, r.n]));
}

// --- Slice 4.3 (018): problem-detail read helpers ----------------------------
// Both read-only and seam/id-parameterized — they take the getAppUser()-resolved
// id (the Tier-5.5 flip point), never a hardcoded id. getProblemActivity is a
// separate helper because getProblemDetail returns the 8 problem-scoped child
// sets but NOT the activity log (a distinct, lazily-read problem-scoped log).

// The viewer's saved-problem ids — powers the detail Save button's read-only
// "Saved" state. The Save toggle ships in slice 4.5; the click is inert for now.
export async function getSavedProblemIds(userId: string): Promise<Set<string>> {
  const rows = await getDb()
    .select({ pid: userSavedProblems.problemId })
    .from(userSavedProblems)
    .where(eq(userSavedProblems.userId, userId));
  return new Set(rows.map((r) => r.pid));
}

// One problem's activity log, newest first — the detail Activity tab. Read-only.
export async function getProblemActivity(
  problemId: string,
  limit = 20,
): Promise<ProblemActivity[]> {
  return getDb()
    .select()
    .from(problemActivityLog)
    .where(eq(problemActivityLog.problemId, problemId))
    .orderBy(desc(problemActivityLog.createdAt))
    .limit(limit);
}

// --- Slice 4.4 (019): library faceted-browse read helper ---------------------
// The Library is GLOBAL (all 15, all 8 categories, display-only) — no getAppUser,
// no user scoping. This one read-only helper returns the full set enriched with
// the three facet/search inputs that aren't on the Problem row: WTP presence,
// existing-solution presence, and a precomputed search haystack (title + resolved
// source labels + all quote text). Everything else the facets/columns need is
// already on the Problem row. The pure filterLibrary() engine (apps/web) consumes
// this. No schema change.

export interface LibraryProblem extends Problem {
  hasWtpSignal: boolean;
  wtpMentionCount: number; // for the reused WTP sort (0 when no signal)
  hasExistingSolution: boolean;
  searchText: string;
}

export async function getLibraryProblems(): Promise<LibraryProblem[]> {
  const db = getDb();
  const [rows, wtpRows, solRows, quoteRows] = await Promise.all([
    db.select().from(problems),
    db
      .select({ pid: wtpSignals.problemId, n: wtpSignals.mentionCount })
      .from(wtpSignals),
    db.select({ pid: existingSolutions.problemId }).from(existingSolutions),
    db
      .select({ pid: problemQuotes.problemId, text: problemQuotes.quoteText })
      .from(problemQuotes),
  ]);

  const wtpCounts = new Map(wtpRows.map((r) => [r.pid, r.n]));
  const solSet = new Set(solRows.map((r) => r.pid));
  const quotesByProblem = new Map<string, string[]>();
  for (const q of quoteRows) {
    const arr = quotesByProblem.get(q.pid);
    if (arr) arr.push(q.text);
    else quotesByProblem.set(q.pid, [q.text]);
  }

  return rows.map((p) => {
    const sourceLabels = p.sources
      .filter(isSourceKey)
      .map((k) => resolveBadge(k).label)
      .join(" ");
    const quoteText = (quotesByProblem.get(p.id) ?? []).join(" ");
    return {
      ...p,
      hasWtpSignal: wtpCounts.has(p.id),
      wtpMentionCount: wtpCounts.get(p.id) ?? 0,
      hasExistingSolution: solSet.has(p.id),
      searchText: `${p.title} ${sourceLabels} ${quoteText}`.toLowerCase(),
    };
  });
}

// --- Slice 4.5 (020): saved Kanban board read helper -------------------------
// The Saved board IS user-scoped (the demo user's saves) — read-only. Slice 4.5
// is the first WRITE slice, but the writes are EPHEMERAL/in-memory (the client
// board mutates React state; reload resets to this seeded baseline). The real
// per-user write path is wired at Tier 5.5 (TF-028). No persisting helper here.

export interface SavedBoardColumn {
  collection: SavedCollection;
  problems: Problem[];
}

export async function getSavedBoard(userId: string): Promise<SavedBoardColumn[]> {
  const db = getDb();
  const [cols, saves] = await Promise.all([
    db
      .select()
      .from(savedCollections)
      .where(eq(savedCollections.userId, userId))
      .orderBy(savedCollections.position),
    db
      .select({ collectionId: userSavedProblems.collectionId, problem: problems })
      .from(userSavedProblems)
      .innerJoin(problems, eq(userSavedProblems.problemId, problems.id))
      .where(eq(userSavedProblems.userId, userId))
      .orderBy(userSavedProblems.position),
  ]);

  const byCollection = new Map<string, Problem[]>();
  for (const s of saves) {
    if (!s.collectionId) continue;
    const arr = byCollection.get(s.collectionId);
    if (arr) arr.push(s.problem);
    else byCollection.set(s.collectionId, [s.problem]);
  }

  return cols.map((c) => ({ collection: c, problems: byCollection.get(c.id) ?? [] }));
}

// --- Slice 4.6 (021): alerts read helper -------------------------------------
// User-scoped watch rules + the notification feed. Read-only. Slice 4.6 is the
// second WRITE slice but inherits the 4.5 ephemeral model (the client island
// mutates in-memory state; reload resets to this seeded baseline; real per-user
// writes at Tier 5.5 — TF-028). No persisting helper.

export interface AlertNotificationVM extends AlertNotification {
  slug: string | null; // the linked problem's slug (null for digest/weekly)
}

export async function getAlertsData(
  userId: string,
): Promise<{ rules: AlertRule[]; notifications: AlertNotificationVM[] }> {
  const db = getDb();
  const [rules, notifRows] = await Promise.all([
    db
      .select()
      .from(alertRules)
      .where(eq(alertRules.userId, userId))
      .orderBy(alertRules.position),
    db
      .select({ notif: alertNotifications, slug: problems.slug })
      .from(alertNotifications)
      .leftJoin(problems, eq(alertNotifications.problemId, problems.id))
      .where(eq(alertNotifications.userId, userId))
      .orderBy(desc(alertNotifications.createdAt)),
  ]);

  return { rules, notifications: notifRows.map((r) => ({ ...r.notif, slug: r.slug })) };
}

// --- Slice 4.8 (023): command-palette index ----------------------------------
// Read-only slim index for the global ⌘K palette: the 15 problems (title/slug/
// category) + the 8 catalog categories (with the displayed problem_count). The
// palette is a navigator — no write.

export interface CommandIndexProblem {
  title: string;
  slug: string;
  category: string;
}
export interface CommandIndexCategory {
  key: string;
  label: string;
  count: number;
}

export async function getCommandIndex(): Promise<{
  problems: CommandIndexProblem[];
  categories: CommandIndexCategory[];
}> {
  const db = getDb();
  const [probs, cats] = await Promise.all([
    db
      .select({ title: problems.title, slug: problems.slug, category: problems.category })
      .from(problems)
      .orderBy(desc(problems.momentumPct)),
    db
      .select({ key: categories.key, label: categories.label, count: categories.problemCount })
      .from(categories)
      .orderBy(categories.position),
  ]);
  return { problems: probs, categories: cats };
}
