import type { Metadata } from "next";

import {
  getDashboardProblems,
  getRecentActivity,
  getUsageMeters,
  getWeeklyMomentum,
  getWtpCountsByProblem,
} from "@bristle/db";

import { ActivityRail } from "@/components/app/dashboard/activity-rail";
import { DashboardHeader } from "@/components/app/dashboard/dashboard-header";
import { HeaderActions } from "@/components/app/dashboard/header-actions";
import { KpiCard } from "@/components/app/dashboard/kpi-card";
import { ProblemGrid } from "@/components/app/dashboard/problem-grid";
import { SortTabs } from "@/components/app/dashboard/sort-tabs";
import { WeeklyMomentumChart } from "@/components/app/dashboard/weekly-momentum-chart";
import { FirstRunTour } from "@/components/app/tour/first-run-tour";
import { getAppUser } from "@/lib/app-user";
import { isSortKey, sortProblems } from "@/lib/dashboard-sort";

export const metadata: Metadata = {
  title: "Dashboard — Bristle",
  robots: { index: false, follow: false },
};

const MATCH_COUNT = 87; // display literal (A4), like the Library's indexed count

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? "there";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = isSortKey(sortParam) ? sortParam : "momentum";

  const user = await getAppUser();
  const [meters, problems, wtpCounts, weekly, activity] = await Promise.all([
    getUsageMeters(user.id),
    getDashboardProblems(),
    getWtpCountsByProblem(),
    getWeeklyMomentum(user.id),
    getRecentActivity(user.id),
  ]);

  const byMetric = new Map(meters.map((m) => [m.metric, m]));
  const meter = (k: string) => byMetric.get(k);
  const watchedCount = user.watchedCategories?.length ?? 0;
  // Sort the FULL set, THEN slice the top six (never pre-truncate).
  const top6 = sortProblems(problems, sort, wtpCounts).slice(0, 6);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-loose p-loose">
      <div className="flex items-start justify-between gap-grid">
        <DashboardHeader
          name={firstName(user.name)}
          newMentions={meter("new_mentions_24h")?.used ?? 0}
          momentumCrossed={meter("momentum_crossed_24h")?.used ?? 0}
          watchedCount={watchedCount}
        />
        <HeaderActions />
      </div>

      <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="New mentions / 24h"
          value={meter("new_mentions_24h")?.used ?? 0}
          delta={meter("new_mentions_24h")?.deltaPct}
          variant="mentions"
        />
        <KpiCard
          label="Crossed momentum threshold"
          value={meter("momentum_crossed_24h")?.used ?? 0}
          variant="crossed"
        />
        <KpiCard
          label="Saved problems"
          value={meter("saved_problems")?.used ?? 0}
          quota={meter("saved_problems")?.quota}
          variant="saved"
        />
        <KpiCard
          label="Alert queue"
          value={meter("alert_queue")?.used ?? 0}
          secondary={meter("alert_queue")?.secondaryLabel}
          variant="alerts"
        />
      </div>

      <div className="flex flex-col gap-grid">
        <div className="flex flex-wrap items-center justify-between gap-grid">
          <SortTabs active={sort} />
          <p className="text-body-sm text-text-secondary">
            All {watchedCount} · {MATCH_COUNT} problems match · last 14d
          </p>
        </div>
        <ProblemGrid problems={top6} />
      </div>

      <div className="grid grid-cols-1 gap-grid lg:grid-cols-3">
        <div className="lg:col-span-2">
          {weekly ? <WeeklyMomentumChart data={weekly} /> : null}
        </div>
        <ActivityRail entries={activity} />
      </div>

      {/* The first-run spotlight tour — the one client island, dashboard-only
          (slice 025). Ephemeral/session-scoped; gated to /app by virtue of mount. */}
      <FirstRunTour />
    </div>
  );
}
