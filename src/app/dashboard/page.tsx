import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { DashboardDesignSwitch, EnterDashboardView } from "@/components/dashboard/design-switch";
import { DashboardDataProvider } from "@/components/efferd/dashboard-context";
import { loadDashboard } from "@/components/efferd/dashboard-data";
import { Dashboard as Dashboard1 } from "@/components/efferd/dashboard-1/dashboard";
import { Dashboard as Dashboard2 } from "@/components/efferd/dashboard-2/dashboard";
import { Dashboard as Dashboard3 } from "@/components/efferd/dashboard-3/dashboard";
import { Dashboard as Dashboard4 } from "@/components/efferd/dashboard-4/dashboard";
import { DashboardSkeleton } from "@/components/efferd/dashboard-skeleton";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const DASHBOARDS = { "1": Dashboard1, "2": Dashboard2, "3": Dashboard3, "4": Dashboard4 } as const;

/**
 * The dashboard's Overview (a test alongside the normal site): Efferd's
 * dashboard 1–4 (Settings → Branding → Dashboard design) filled with the
 * site's own figures — walks, clock-ins, leaders and notices. Every other
 * page is the site's own page inside Efferd's app shell (DashboardFrame).
 */
export default function DashboardPage() {
  return (
    <>
      <EnterDashboardView />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const [user, theme] = await Promise.all([requireUser(), getSiteTheme()]);
  const data = await loadDashboard(user);
  const Dashboard = DASHBOARDS[theme.dashboardDesign as keyof typeof DASHBOARDS] ?? Dashboard1;
  return (
    <div className="flex flex-col gap-4">
      {user.isOwner ? (
        <div className="flex justify-end">
          <DashboardDesignSwitch design={theme.dashboardDesign} />
        </div>
      ) : null}
      <DashboardDataProvider data={data}>
        <Dashboard />
      </DashboardDataProvider>
    </div>
  );
}
