// One selectable role in the Step 1 grid (server component, design 3_1). A
// <label> wraps a visually-hidden radio so selection works with native form
// semantics and the whole card is the hit target. `iconName` is resolved against
// a small explicit lucide map (the six role icons only — keeps the bundle tight,
// no all-of-lucide import). Selected → accent border + tinted card + a filled
// accent check badge top-right. Hover is a color shift only (§4.5); no elevation
// (§4.4 forbids light-mode card shadows). Token-driven, no hex.

import {
  Check,
  Layers,
  Plus,
  Shuffle,
  TrendingUp,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ROLE_ICONS: Record<string, LucideIcon> = {
  Zap,
  Layers,
  Shuffle,
  TrendingUp,
  User,
  Plus,
};

interface RoleCardProps {
  value: string;
  label: string;
  description: string;
  iconName: string;
  selected?: boolean;
}

export function RoleCard({
  value,
  label,
  description,
  iconName,
  selected = false,
}: RoleCardProps) {
  const Icon = ROLE_ICONS[iconName] ?? Plus;
  return (
    <label
      className={`relative flex cursor-pointer flex-col gap-snug rounded-modal border p-card transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-bristle ${
        selected
          ? "border-accent-bristle bg-accent-bristle/10"
          : "border-border-default bg-surface-card hover:border-border-strong"
      }`}
    >
      <input
        type="radio"
        name="role"
        value={value}
        defaultChecked={selected}
        className="sr-only"
      />
      {selected ? (
        <span className="absolute right-card top-card flex size-5 items-center justify-center rounded-pill bg-accent-bristle text-surface-card">
          <Check className="size-3" strokeWidth={1.5} aria-hidden="true" />
        </span>
      ) : null}
      <span
        className={`flex size-8 items-center justify-center rounded-card ${
          selected
            ? "bg-surface-card text-accent-bristle"
            : "bg-surface-raised text-text-secondary"
        }`}
      >
        <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="font-sans text-h4 font-semibold text-text-primary">
        {label}
      </span>
      <span className="text-body-sm text-text-secondary">{description}</span>
    </label>
  );
}
