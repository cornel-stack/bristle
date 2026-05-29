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

export const signupSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
    name: z.string().trim().max(100, "That name is too long.").optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;
