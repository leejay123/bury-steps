import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import type { Metadata } from "next";
import { HistoryLoading } from "./loading";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isWalkHistoryReady, walkStatus } from "@/lib/walk-window";
import { AttendanceHistory } from "@/components/attendance-history";
import { RememberListCount } from "@/components/remember-list-count";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { walkSharePath } from "@/lib/walk-slug";

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

async function WalkHistoryContent() {
  // This is about the viewer's own clock-ins, not an admin capability — an
  // organiser or the owner who personally walks wants to see their own
  // history too, same as a plain member. The account menu (SiteUserButton)
  // already links here unconditionally for every role; this used to bounce
  // an admin straight back to /admin without ever showing it.
  const user = await requireUser();

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
  const count = totalCount - inProgressCount;

  return (
    <div className="flex flex-col gap-6">
      <RememberListCount count={Math.min(historyReady.length, LIST_PAGE_SIZE)} id="history" />
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
        {historyReady.length < count ? (
          <p className="text-xs text-muted-foreground">
            Showing the {historyReady.length.toLocaleString("en-GB")} most recent.
          </p>
        ) : null}
      </div>

      <AttendanceHistory
        rows={historyReady.map((attendance) => ({
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
        }))}
      />
    </div>
  );
}
