import type { AlertNotificationVM } from "@bristle/db";

import { NotificationCard } from "./notification-card";

// Groups the (filtered) feed by Today / Yesterday / Earlier — now-relative
// (TF-023), so re-seeds don't drift fixed dates. relativeTime is per-item.
function dayGroup(date: Date, startOfToday: number): "Today" | "Yesterday" | "Earlier" {
  const t = date.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86_400_000) return "Yesterday";
  return "Earlier";
}

export function AlertFeed({
  notifications,
  onMarkRead,
}: {
  notifications: AlertNotificationVM[];
  onMarkRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return <p className="text-body-md text-text-secondary">No notifications here.</p>;
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const order = ["Today", "Yesterday", "Earlier"] as const;
  const groups = order
    .map((label) => ({
      label,
      items: notifications.filter((n) => dayGroup(n.createdAt, startOfToday) === label),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-section">
      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="mb-grid text-body-sm font-medium uppercase tracking-wide text-text-tertiary">
            {g.label}
          </h2>
          <div className="flex flex-col gap-grid">
            {g.items.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
