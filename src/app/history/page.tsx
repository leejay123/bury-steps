import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import type { Metadata } from "next";
import { HistoryLoading } from "./loading";
import { prisma } from "@/lib/db";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { cacheLife } from "next/cache";
import { isWalkHistoryReady, walkStatus } from "@/lib/walk-window";
import { AttendanceHistory } from "@/components/attendance-history";
import { RememberListCount } from "@/components/remember-list-count";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { walkSharePath } from "@/lib/walk-slug";

/**
 * Fetched ahead from the menu, so History opens with your walks already
 * there (getHistoryForViewer). See node_modules/next/dist/docs/01-app/
 * 02-guides/optimizing-prefetching.md.
 */
export const prefetch = "partial";

export const metadata: Metadata = {
  title: "Walk history",
};


export default function WalkHistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <PlaceholderPreview fallback={<HistoryLoading />}>
        <WalkHistoryContent />
      </PlaceholderPreview>
    </Suspense>
  );
}

/**
 * Your finished walks, as a private saved copy: kept in this browser only
 * for five minutes (never on the server), so the page fetched ahead from
 * the menu can carry it. A clock-in or clock-out refreshes it at once.
 */
async function getHistoryForViewer() {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  // This is about the viewer's own clock-ins, not an admin capability — an
  // organiser or the owner who personally walks wants to see their own
  // history too, same as a plain member.
  const user = await getOptionalUser();
  if (!user) return null;

  const [attendances, totalCount] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { clockedInAt: "desc" },
      // Backstop against an unbounded query — a weekly walk never missed
      // would take ~19 years to reach this. Keeps the most recent walks.
      // `totalCount` below is a separate, uncapped query.
      take: 1000,
      include: {
        walk: {
          select: {
            token: true,
            slug: true,
            title: true,
            location: true,
            startsAt: true,
            durationMins: true,
            endedAt: true,
            cancelledAt: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where: { userId: user.id } }),
  ]);

  // A walk still under way isn't history yet — it hasn't finished — so it
  // doesn't belong in this list at all until it's either completed or
  // cancelled. Whichever walk that is (if any) is necessarily among the
  // most recent 1000 clock-ins, so subtracting it out of `totalCount` here
  // stays exact rather than approximate.
  const historyReady = attendances.filter((attendance) => isWalkHistoryReady(attendance.walk));
  const inProgressCount = attendances.length - historyReady.length;
  return {
    count: totalCount - inProgressCount,
    rows: historyReady.map((attendance) => ({
      id: attendance.id,
      title: attendance.walk.title,
      location: attendance.walk.location,
      startsAt: attendance.walk.startsAt.toISOString(),
      durationMins: attendance.walk.durationMins,
      cancelledAt: attendance.walk.cancelledAt?.toISOString() ?? null,
      clockedInAt: attendance.clockedInAt.toISOString(),
      clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
      clockedOutReason: attendance.clockedOutReason,
      completed: walkStatus(attendance.walk) === "completed",
      href: attendance.walk.cancelledAt ? undefined : walkSharePath(attendance.walk),
    })),
  };
}

async function WalkHistoryContent() {
  const history = await getHistoryForViewer();
  // Not signed in: requireUser sends them to sign in, as before.
  if (!history) await requireUser();
  const { count, rows } = history ?? { count: 0, rows: [] };

  return (
    <div className="flex flex-col gap-6">
      <RememberListCount count={Math.min(rows.length, LIST_PAGE_SIZE)} id="history" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">Your walk history</h1>
        {/* Fixed wording, so the loading placeholder shows it for real too. */}
        <p className="text-sm text-muted-foreground">
          Every walk you clock in to will be kept here, once it&apos;s finished.
        </p>
        {count > 0 ? (
          <p className="text-sm text-muted-foreground">
            {count === 1 ? "You have clocked in to 1 walk." : `You have clocked in to ${count} walks.`}
          </p>
        ) : null}
        {rows.length < count ? (
          <p className="text-xs text-muted-foreground">
            Showing the {rows.length.toLocaleString("en-GB")} most recent.
          </p>
        ) : null}
      </div>

      <AttendanceHistory rows={rows} />
    </div>
  );
}
