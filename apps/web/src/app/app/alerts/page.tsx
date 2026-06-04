// Alerts — /app/alerts. Server Component in the gated shell (the /app/:path*
// matcher covers it — no middleware/auth change). User-scoped (the rules + feed
// are the user's), so it resolves the getAppUser() seam. Reads the alerts data
// (read-only) and hands it to the client island, which owns the EPHEMERAL
// in-session state (the 4.5 write model — slice 4.6 inherits it).

import { getAlertsData } from "@bristle/db";

import { AlertsView } from "@/components/app/alerts/alerts-view";
import { getAppUser } from "@/lib/app-user";

export default async function AlertsPage() {
  const user = await getAppUser();
  const { rules, notifications } = await getAlertsData(user.id);
  return <AlertsView rules={rules} notifications={notifications} />;
}
