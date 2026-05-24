// ContactPaths component (per spec FR-009). Renders 3 cards from CONTACT_PATHS.
//
// File name deviation: plan §"Project Structure" listed this as
// `contact-paths.tsx`, but the data file `contact-paths.ts` already exists in
// the same folder, and TS module resolution becomes ambiguous when both .ts
// and .tsx of the same basename live in the same directory. Component file
// is named `paths.tsx` to keep imports unambiguous.

import Link from "next/link";
import {
  ChevronRight,
  LifeBuoy,
  Mail,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { CONTACT_PATHS, type ContactPath } from "./contact-paths";

const ICONS: Record<ContactPath["iconName"], LucideIcon> = {
  LifeBuoy,
  Mail,
  Zap,
};

export function ContactPaths() {
  return (
    <ul className="mt-loose flex flex-col gap-grid">
      {CONTACT_PATHS.map((path) => {
        const Icon = ICONS[path.iconName];
        return (
          <li key={path.label}>
            <Link
              href={path.href}
              className="flex items-center gap-grid rounded-card border border-border-default bg-surface-card p-card hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              <Icon
                aria-hidden="true"
                className="size-5 shrink-0 stroke-[1.5] text-text-primary"
              />
              <div className="flex-1">
                <p className="text-body-md font-medium text-text-primary">
                  {path.label}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {path.subtitle}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 stroke-[1.5] text-text-secondary"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
