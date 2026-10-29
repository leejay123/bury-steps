import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { DashboardDataProvider } from "@/components/efferd/dashboard-context";
import { loadDashboard } from "@/components/efferd/dashboard-data";
import { Dashboard } from "@/components/efferd/dashboard-2/dashboard";
import { DashboardSkeleton } from "@/components/efferd/dashboard-skeleton";

export const metadata: Metadata = { title: "Overview", robots: { index: false, follow: false } };

/**
 * Signed-in people's Overview in the shadcn.io design: Efferd's dashboard 2 (their
 * dense grid with 1px lines between the tiles), filled with the site's own figures
 * (walks, clock-ins, leaders and notices), inside Efferd's app shell 2 (site-shell.tsx).
 * Its own address because /dashboard has long been a permanent redirect to /walks
 * (next.config.ts), which browsers remember.
 */
export default function OverviewPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OverviewContent />
    </Suspense>
  );
}

async function OverviewContent() {
  const user = await requireUser();
  const data = await loadDashboard(user);
  return (
    <DashboardDataProvider data={data}>
      <Dashboard />
    </DashboardDataProvider>
  );
}
