// Zod schemas for the auth forms. Imported runtime-side ONLY by the Server
// Actions (signup/login/forgot/reset actions.ts). Client form components import
// just the inferred TYPE via `import type`, keeping the zod runtime out of the
// client bundle (slice-008 perf discipline). Messages follow CLAUDE.md §6 voice
// — plain, no exclamation marks, no hype — they surface as field errors.

import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("That email address does not look valid.");

const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That password is too long.");

// Slice 014: the rebuilt signup (design 2_1) drops the confirm-password field —
// the show/hide toggle + live strength meter replace it. Reset-password keeps
// confirm (design 2_4 / resetSchema below).
export const signupSchema = z.object({
  email,
  password,
  name: z.string().trim().max(100, "That name is too long.").optional(),
  // Terms acceptance (slice 014). The action coerces the checkbox to a boolean
  // before parsing; must be true to proceed.
  terms: z.boolean().refine((v) => v === true, {
    message: "Accept the Terms of Service to continue.",
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const verifyCodeSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ email });

export type ForgotInput = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetInput = z.infer<typeof resetSchema>;
