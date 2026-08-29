import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isWalkHistoryReady, walkStatus } from "@/lib/walk-window";
import { AttendanceHistory } from "@/components/attendance-history";
import { walkSharePath } from "@/lib/walk-slug";

export const metadata: Metadata = {
  title: "Walk history — Bury Steps Walking Group",
};

export const dynamic = "force-dynamic";

export default async function WalkHistoryPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

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
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          <Link className="hover:underline" href="/dashboard">
            Walks
          </Link>
          <span aria-hidden="true"> · </span>
          History
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Your walk history</h1>
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "Every walk you clock in to will be kept here, once it's finished."
            : count === 1
              ? "You have clocked in to 1 walk."
              : `You have clocked in to ${count} walks.`}
        </p>
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
          completed: walkStatus(attendance.walk) === "completed",
          href: walkSharePath(attendance.walk),
        }))}
      />
    </div>
  );
}
