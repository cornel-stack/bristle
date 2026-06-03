"use server";

// Onboarding Server Actions (contracts §4). Order in each: authoritative auth()
// → Zod validate → persist → redirect() OUTSIDE try/catch (redirect throws
// NEXT_REDIRECT; a surrounding catch would swallow it — slice-013/014 pattern).
// The discriminated state shapes are OWNED by the islands (RoleSelector /
// CategorySelector); imported here as types so the action signatures match what
// useActionState expects. Zod runs server-side only (kept out of the client
// bundle). No rate limiting: these are signed-in-only, low-abuse mutations with
// no enumeration surface (see the slice plan).

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  completeOnboarding,
  getUserByEmail,
  saveUserCategories,
  saveUserRole,
} from "@bristle/db";
import { CATEGORIES } from "@bristle/shared";

import { auth } from "@/auth";
import type { SaveCategoriesState } from "@/components/onboarding/category-selector";
import type { SaveRoleState } from "@/components/onboarding/role-selector";
import {
  CATEGORIES_MAX,
  CATEGORIES_MIN,
  ROLE_CUSTOM_MAX,
} from "@/lib/onboarding/constants";
import { isRole } from "@/lib/onboarding/role-options";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const LOGIN_REDIRECT = "/login?callbackUrl=/onboarding/role";

const KNOWN_SLUGS = new Set(CATEGORIES.map((category) => category.slug));

const roleSchema = z
  .object({
    role: z.string().refine(isRole, "Pick one of the listed roles."),
    roleCustom: z
      .string()
      .trim()
      .max(ROLE_CUSTOM_MAX, `Keep it under ${ROLE_CUSTOM_MAX} characters.`),
  })
  .refine((data) => data.role !== "other" || data.roleCustom.length > 0, {
    message: "Tell us a bit about what you're after.",
    path: ["roleCustom"],
  });

const categoriesSchema = z
  .array(z.string())
  .transform((slugs) => [...new Set(slugs)])
  .superRefine((slugs, ctx) => {
    if (slugs.length < CATEGORIES_MIN || slugs.length > CATEGORIES_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Pick between ${CATEGORIES_MIN} and ${CATEGORIES_MAX} categories.`,
      });
    }
    for (const slug of slugs) {
      if (!KNOWN_SLUGS.has(slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "That category is not available.",
        });
        break;
      }
    }
  });

// Step 1 — persist role (+ "other" free text), then advance to step 2.
export async function saveRole(
  _prevState: SaveRoleState,
  formData: FormData,
): Promise<SaveRoleState> {
  const session = await auth();
  if (!session?.user?.email) redirect(LOGIN_REDIRECT);
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect(LOGIN_REDIRECT);

  const rawRole = formData.get("role")?.toString() ?? "";
  const rawRoleCustom = formData.get("roleCustom")?.toString() ?? "";

  const parsed = roleSchema.safeParse({
    role: rawRole,
    roleCustom: rawRoleCustom,
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      status: "validation-error",
      fieldErrors: {
        role: fieldErrors.role?.[0],
        roleCustom: fieldErrors.roleCustom?.[0],
      },
      values: { role: rawRole, roleCustom: rawRoleCustom },
    };
  }

  try {
    await saveUserRole({
      userId: user.id,
      role: parsed.data.role,
      roleCustom:
        parsed.data.role === "other" ? parsed.data.roleCustom : null,
    });
  } catch {
    return { status: "transport-error", message: GENERIC_ERROR };
  }

  redirect("/onboarding/categories");
}

// Step 2 — persist 3–5 watched categories (completes onboarding), then enter app.
export async function saveCategories(
  _prevState: SaveCategoriesState,
  formData: FormData,
): Promise<SaveCategoriesState> {
  const session = await auth();
  if (!session?.user?.email) redirect(LOGIN_REDIRECT);
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect(LOGIN_REDIRECT);

  const raw = formData.getAll("categories").map((value) => value.toString());
  const parsed = categoriesSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "validation-error",
      message:
        parsed.error.issues[0]?.message ??
        `Pick between ${CATEGORIES_MIN} and ${CATEGORIES_MAX} categories.`,
      values: [...new Set(raw)],
    };
  }

  try {
    await saveUserCategories({ userId: user.id, categories: parsed.data });
  } catch {
    return { status: "transport-error", message: GENERIC_ERROR };
  }

  redirect("/account");
}

// "Skip for now" — complete onboarding without role/categories, then enter app.
export async function skipOnboarding(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect(LOGIN_REDIRECT);
  const user = await getUserByEmail(session.user.email);
  if (!user) redirect(LOGIN_REDIRECT);

  await completeOnboarding(user.id);

  redirect("/account");
}
