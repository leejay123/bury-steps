import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { Overview } from "@/components/dashboard/overview";
import { loadOverview } from "@/components/dashboard/overview-data";
import { DashboardDesignSwitch, EnterDashboardView } from "@/components/dashboard/design-switch";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

/**
 * The dashboard's Overview (a test alongside the normal site): the signed-in
 * person's figures, chart, upcoming walks and notices (organisers: the
 * group's), in the design chosen under Settings → Branding → Dashboard design.
 * Every other dashboard page is the site's own page inside the dashboard frame.
 */
export default function DashboardPage() {
  return (
    <>
      <EnterDashboardView />
      <Suspense fallback={<OverviewSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const [user, theme] = await Promise.all([requireUser(), getSiteTheme()]);
  const data = await loadOverview(user);
  return (
    <div className="flex flex-col gap-4">
      {user.isOwner ? (
        <div className="flex justify-end">
          <DashboardDesignSwitch design={theme.dashboardDesign} />
        </div>
      ) : null}
      <Overview data={data} design={theme.dashboardDesign} />
    </div>
  );
}

/** The Overview's shape while it loads: the welcome, a row of figures, the chart and a table. */
function OverviewSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div className="flex flex-col gap-3 rounded-xl border p-5" key={i}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
        <div className="rounded-xl border p-5 md:col-span-2 lg:col-span-3">
          <Skeleton className="h-56 w-full" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton className="h-4 w-full" key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
