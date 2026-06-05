export { problems } from "./schema";
export type { Problem, NewProblem } from "./schema";
// Slice 016 product row types (screens 4.2–4.8 type their props against these;
// raw tables stay in @bristle/db — apps/web reads via query helpers).
export type {
  ProblemQuote,
  ProblemSource,
  ExistingSolution,
  WtpSignal,
  ProblemPersona,
  ProblemFrequencyPoint,
  ProblemRelated,
  Category,
  DashboardFixture,
  SavedCollection,
  UserSavedProblem,
  AlertRule,
  AlertNotification,
  ProblemActivity,
  UsageMeter,
} from "./schema";
export {
  users,
  accounts,
  sessions,
  verificationTokens,
  passwordResetTokens,
} from "./auth-schema";
export type {
  User,
  NewUser,
  Account,
  NewAccount,
  Session,
  NewSession,
  VerificationToken,
  NewVerificationToken,
  PasswordResetToken,
  NewPasswordResetToken,
} from "./auth-schema";
// Slice 5.1 (migration 0005) — the pipeline's raw_items capture table. Exposed
// for the contract generator + future (5.5) JS-side reads; the Tier-5 Python
// ingester writes it via asyncpg, not this client.
export { rawItems } from "./pipeline-schema";
export type { RawItem, NewRawItem } from "./pipeline-schema";
export { getDb } from "./client";
export {
  getFirstProblem,
  getProblemBySlug,
  getRecentProblems,
  getUserByEmail,
  createUser,
  createVerificationToken,
  consumeVerificationToken,
  createSession,
  createPasswordResetToken,
  isPasswordResetTokenValid,
  getValidResetTokenEmail,
  consumePasswordResetToken,
  setEmailVerificationCode,
  incrementEmailVerificationAttempts,
  consumeEmailVerificationCode,
  deleteUnverifiedUserByEmail,
  saveUserRole,
  saveUserCategories,
  completeOnboarding,
  getDashboardProblems,
  getProblemDetail,
  getUsageMeters,
  getWatchedCategories,
  getRecentActivity,
  getWeeklyMomentum,
  getUnreadNotificationCount,
  getWtpCountsByProblem,
  getSavedProblemIds,
  getProblemActivity,
  getLibraryProblems,
  getSavedBoard,
  getAlertsData,
  getCommandIndex,
} from "./queries";
export type {
  ConsumeVerificationResult,
  ConsumeEmailCodeResult,
  ProblemDetail,
  LibraryProblem,
  SavedBoardColumn,
  AlertNotificationVM,
  CommandIndexProblem,
  CommandIndexCategory,
} from "./queries";
