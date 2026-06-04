"use client";

import type { AlertNotificationVM, AlertRule } from "@bristle/db";
import { useMemo, useRef, useState } from "react";

import { AlertFeed } from "./alert-feed";
import { AlertsHeader } from "./alerts-header";
import { DeliveryPanel } from "./delivery-panel";
import { FilterTabs, type AlertFilter } from "./filter-tabs";
import { NewRuleForm } from "./new-rule-form";
import { deriveRuleName, type RuleType } from "./rule-format";
import { WatchRuleRow } from "./watch-rule-row";

// The Alerts client island. EPHEMERAL write model (inherited from slice 4.5):
// hydrate ONCE from the server, then filter / mark-read / mark-all / toggle-rule /
// add-rule mutate in-memory state only — no DB write, no server action, no
// storage; reload resets to the seeded baseline. Tier 5.5 swaps these for real
// per-user write server actions (TF-028).
function matchesFilter(n: AlertNotificationVM, f: AlertFilter): boolean {
  switch (f) {
    case "unread":
      return !n.isRead;
    case "momentum":
      return n.type === "momentum";
    case "new":
      return n.type === "new";
    case "threshold":
      return n.type === "threshold" || n.type === "weekly";
    default:
      return true;
  }
}

export function AlertsView({
  rules: initialRules,
  notifications: initialNotifications,
}: {
  rules: AlertRule[];
  notifications: AlertNotificationVM[];
}) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [notifications, setNotifications] = useState<AlertNotificationVM[]>(initialNotifications);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const nextId = useRef(0);

  const unread = notifications.filter((n) => !n.isRead).length;
  const counts = useMemo<Record<AlertFilter, number>>(
    () => ({
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      momentum: notifications.filter((n) => n.type === "momentum").length,
      new: notifications.filter((n) => n.type === "new").length,
      threshold: notifications.filter((n) => n.type === "threshold" || n.type === "weekly").length,
    }),
    [notifications],
  );
  const visible = notifications.filter((n) => matchesFilter(n, filter));

  function markRead(id: string) {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }
  function markAll() {
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
  }
  function toggleRule(id: string) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }
  function addRule(categoryKey: string, ruleType: RuleType, threshold: number | null) {
    setRules((rs) => [
      ...rs,
      {
        id: `tmp-${nextId.current++}`,
        userId: "",
        name: deriveRuleName(categoryKey, ruleType, threshold),
        categoryKey,
        ruleType,
        threshold,
        channels: [],
        enabled: true,
        firedCount: 0,
        position: rs.length,
      },
    ]);
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-grid py-section">
      <AlertsHeader
        unread={unread}
        total={notifications.length}
        ruleCount={rules.length}
        onMarkAll={markAll}
        onNewRule={() => setShowForm(true)}
      />
      <div className="mt-section grid gap-section lg:grid-cols-[1fr_19rem]">
        <div className="min-w-0">
          <FilterTabs active={filter} counts={counts} onChange={setFilter} />
          <div className="mt-section">
            <AlertFeed notifications={visible} onMarkRead={markRead} />
          </div>
        </div>
        <aside className="flex flex-col gap-grid">
          {showForm ? <NewRuleForm onSubmit={addRule} onCancel={() => setShowForm(false)} /> : null}
          <section className="rounded-card border border-border-default bg-surface-card p-grid">
            <p className="text-body-sm font-medium uppercase tracking-wide text-text-secondary">
              Active watch rules &middot; {rules.length}
            </p>
            <div className="mt-grid divide-y divide-border-default">
              {rules.map((r) => (
                <WatchRuleRow key={r.id} rule={r} onToggle={toggleRule} />
              ))}
            </div>
          </section>
          <DeliveryPanel />
        </aside>
      </div>
    </div>
  );
}
