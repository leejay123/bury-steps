import { ArrowRightIcon } from "lucide-react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard } from "./dashboard-2/dashboard-card";

/**
 * The Overview while its figures load, part for part with dashboard-2/dashboard.tsx:
 * the same joined grid (1px lines between the tiles), the same cards and sizes, the
 * real headings where they never change, and grey only where the figures and names go.
 */
export function DashboardSkeleton() {
  return (
    <div className="@container">
      <div
        aria-busy="true"
        className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2 @min-[60rem]:grid-cols-4"
        data-page-loading=""
      >
        {/* The four figures (their names depend on who's looking: organiser or member). */}
        {[0, 1, 2, 3].map((i) => (
          <DashboardCard key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="flex flex-row items-center gap-2">
              <Skeleton className="h-8 w-12" />
            </CardContent>
            <CardFooter className="gap-1 rounded-none bg-background text-xs">
              <Skeleton className="h-4 w-40" />
            </CardFooter>
          </DashboardCard>
        ))}
        {/* Busiest days. */}
        <DashboardCard className="gap-4 md:col-span-2">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Busiest days</CardTitle>
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <CardDescription>
              Clock-ins by day of the week, last 90 days. The badge is the busiest day against the average.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full md:h-80" />
          </CardContent>
        </DashboardCard>
        {/* You and the group. */}
        <DashboardCard className="gap-4 md:col-span-2">
          <CardHeader>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>You and the group</CardTitle>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <CardDescription>Clock-ins per week, last 12 weeks.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full md:h-80" />
          </CardContent>
        </DashboardCard>
        {/* Recent walks. */}
        <DashboardCard className="relative gap-0 md:col-span-2">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-base">Recent walks</CardTitle>
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="mask-b-from-50% mask-b-to-100% px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">Walk</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="pe-6 text-right tabular-nums">Walkers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <TableRow className="h-12" key={i}>
                    <TableCell className="ps-6">
                      <Skeleton className={`h-4 ${i % 2 ? "w-28" : "w-36"}`} />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="pe-6">
                      <Skeleton className="ms-auto h-4 w-6" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="mask-t-from-30% absolute inset-x-0 bottom-0 flex h-1/5 items-center justify-center bg-background">
            <span className="inline-flex h-9 items-center gap-2 px-4 font-medium text-sm">
              View All
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </span>
          </div>
        </DashboardCard>
        {/* Notices: the latest one, as an empty-state card. */}
        <DashboardCard className="gap-0">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-balance text-base">Notices</CardTitle>
            <CardDescription className="text-pretty">The latest from the organisers.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full items-center px-0">
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-6 text-center md:p-12">
              <div className="flex max-w-sm flex-col items-center gap-2">
                <Skeleton className="mb-2 size-10 rounded-lg" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
              <span className="inline-flex h-9 items-center gap-2 px-4 font-medium text-sm">
                Read notices
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </span>
            </div>
          </CardContent>
        </DashboardCard>
        {/* Activity. */}
        <DashboardCard className="gap-0">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-base">Activity</CardTitle>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="px-0">
            <ul className="flex flex-col divide-y divide-border">
              {[0, 1, 2, 3].map((i) => (
                <li className="flex h-16 items-center gap-3 px-6" key={i}>
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-full max-w-56" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </DashboardCard>
      </div>
    </div>
  );
}
