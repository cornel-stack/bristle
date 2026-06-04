import type { AlertNotificationVM } from "@bristle/db";
import Link from "next/link";

import { relativeTime } from "@/lib/relative-time";

// One feed item — type badge + unread dot + title + body + now-relative time, an
// "Open" link to the problem when tied to one (digest/weekly have no problem →
// no dead link), and a "Mark read" action while unread. All ephemeral.
export function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: AlertNotificationVM;
  onMarkRead: (id: string) => void;
}) {
  const unread = !notification.isRead;
  return (
    <article
      className={`rounded-card border bg-surface-card p-grid ${
        unread ? "border-border-strong" : "border-border-default"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-body-sm">
          {unread ? (
            <span className="size-2 rounded-pill bg-accent-bristle" aria-label="Unread" />
          ) : null}
          <span className="font-medium uppercase tracking-wide text-text-tertiary">
            {notification.type}
          </span>
          <span className="text-text-secondary">{relativeTime(notification.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-body-sm">
          {unread ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              Mark read
            </button>
          ) : null}
          {notification.slug ? (
            <Link
              href={`/app/problems/${notification.slug}`}
              className="font-medium text-accent-bristle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
            >
              Open →
            </Link>
          ) : null}
        </div>
      </div>
      <h3 className="mt-snug text-heading-h4 font-medium text-text-primary">
        {notification.title}
      </h3>
      {notification.body ? (
        <p className="mt-snug text-body-sm text-text-secondary">{notification.body}</p>
      ) : null}
    </article>
  );
}
