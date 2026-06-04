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
} from "./queries";
export type {
  ConsumeVerificationResult,
  ConsumeEmailCodeResult,
  ProblemDetail,
} from "./queries";
