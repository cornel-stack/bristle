"use client";

// Step 1 interactive island (design 3_1). Wraps the six RoleCards in a single-
// select grid, shows the per-role preview line, and reveals the "other" textarea.
// The overline + h1 + subhead are server-rendered by the page (tasks.md T015), so
// this island carries only the interactive surface — keeping client JS minimal.
//
// Selection: native radios (name="role") inside the form give native single-select
// + submission; a delegated onChange syncs `selected` for the preview line, the
// "other" textarea, and the RoleCard visual state. The saveRole action is injected
// as a prop (it lands in Batch B's app/onboarding/actions.ts); this island owns the
// SaveRoleState shape so Batch B can implement against it. Token-driven, no hex.

import { useActionState, useState } from "react";

import { ROLE_CUSTOM_MAX } from "@/lib/onboarding/constants";
import { ROLE_OPTIONS, type Role } from "@/lib/onboarding/role-options";

import { AuthFormBanner } from "../auth/auth-form-banner";
import { RoleCard } from "./role-card";

export type SaveRoleState =
  | { status: "idle" }
  | {
      status: "validation-error";
      fieldErrors: { role?: string; roleCustom?: string };
      values: { role?: string; roleCustom?: string };
    }
  | { status: "transport-error"; message: string };

export type SaveRoleAction = (
  state: SaveRoleState,
  formData: FormData,
) => Promise<SaveRoleState>;

const INITIAL_STATE: SaveRoleState = { status: "idle" };

interface RoleSelectorProps {
  action: SaveRoleAction;
  initialRole?: Role | null;
  initialRoleCustom?: string | null;
  // Step 1 is the onboarding entry point, so "← Back" is hidden by default. The
  // prop keeps the component composable for any future mid-flow step that needs it.
  showBack?: boolean;
}

export function RoleSelector({
  action,
  initialRole = null,
  initialRoleCustom = "",
  showBack = false,
}: RoleSelectorProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [selected, setSelected] = useState<Role | null>(initialRole);
  const [custom, setCustom] = useState(initialRoleCustom ?? "");

  const selectedOption = ROLE_OPTIONS.find((role) => role.slug === selected);
  const previewLine = selectedOption
    ? selectedOption.previewLine
    : "Pick a role to see how your dashboard will lead.";

  const needsCustom = selected === "other";
  const canContinue =
    selected !== null && (!needsCustom || custom.trim().length > 0);

  const banner =
    state.status === "transport-error" ? state.message : undefined;
  const fieldErrors =
    state.status === "validation-error" ? state.fieldErrors : {};

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-loose">
      {banner ? <AuthFormBanner key={banner}>{banner}</AuthFormBanner> : null}

      <div
        role="radiogroup"
        aria-label="Choose the role that fits you"
        onChange={(event) => {
          const target = event.target as HTMLInputElement;
          if (target.name === "role") setSelected(target.value as Role);
        }}
        className="grid grid-cols-1 gap-grid md:grid-cols-3"
      >
        {ROLE_OPTIONS.map((role) => (
          <RoleCard
            key={role.slug}
            value={role.slug}
            label={role.label}
            description={role.description}
            iconName={role.iconName}
            selected={selected === role.slug}
          />
        ))}
      </div>

      {needsCustom ? (
        <div className="flex flex-col gap-tight">
          <label
            htmlFor="role-custom"
            className="text-body-sm font-medium text-text-primary"
          >
            Tell us in your own words
          </label>
          <textarea
            id="role-custom"
            name="roleCustom"
            required
            maxLength={ROLE_CUSTOM_MAX}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            rows={3}
            className="rounded-card border border-border-default bg-surface-card p-snug text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
          />
          {fieldErrors.roleCustom ? (
            <p className="text-body-sm text-status-error">
              {fieldErrors.roleCustom}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-grid">
        {showBack ? (
          <button
            type="button"
            onClick={() => history.back()}
            className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            ← Back
          </button>
        ) : null}
        <p className="text-body-sm text-text-secondary">{previewLine}</p>
        <button
          type="submit"
          disabled={!canContinue || pending}
          aria-busy={pending}
          className="rounded-button bg-accent-bristle px-grid py-2 text-body-md font-medium text-surface-card disabled:opacity-60"
        >
          {pending ? "Saving…" : "Continue → categories"}
        </button>
      </div>
    </form>
  );
}
