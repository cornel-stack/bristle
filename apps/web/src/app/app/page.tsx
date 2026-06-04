import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Bristle",
  robots: { index: false, follow: false },
};

// Stub — the full dashboard (header, KPIs, sort + grid, chart, activity) is built
// in Batch B/C (T017/T020). This placeholder makes /app a valid route under the
// shell so the auth gate + redirect are verifiable at STOP 1.
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-loose">
      <h1 className="font-serif text-h1 font-semibold text-text-primary">
        Dashboard
      </h1>
    </div>
  );
}
