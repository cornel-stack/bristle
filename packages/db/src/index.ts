export { problems } from "./schema";
export type { Problem, NewProblem } from "./schema";
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
  consumePasswordResetToken,
  setEmailVerificationCode,
  incrementEmailVerificationAttempts,
  consumeEmailVerificationCode,
  deleteUnverifiedUserByEmail,
} from "./queries";
export type {
  ConsumeVerificationResult,
  ConsumeEmailCodeResult,
} from "./queries";
