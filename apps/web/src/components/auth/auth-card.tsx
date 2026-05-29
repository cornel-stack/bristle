// Shared centered shell for the auth pages (server component): serif title,
// optional subtitle, the form/content, and an optional footer (e.g. the
// "already have an account?" link). Token-only styling.

import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-grid">
      <div className="flex flex-col gap-tight">
        <h1 className="font-serif text-h2 font-semibold text-text-primary">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-body-md text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="text-body-sm text-text-secondary">{footer}</div>
      ) : null}
    </div>
  );
}
