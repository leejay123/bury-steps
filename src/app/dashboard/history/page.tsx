import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AttendanceHistory } from "@/components/attendance-history";

export const metadata: Metadata = {
  title: "Walk history — Bury Steps Walking Group",
};

export const dynamic = "force-dynamic";

export default async function WalkHistoryPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const [attendances, count] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { clockedInAt: "desc" },
      // Backstop against an unbounded query — a weekly walk never missed
      // would take ~19 years to reach this. Keeps the most recent walks.
      // `count` below is a separate, uncapped query, so the "X walks"
      // heading stays accurate even for someone who has passed this cap.
      take: 1000,
      include: {
        walk: {
          select: {
            token: true,
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
            ? "Every walk you clock in to will be kept here."
            : count === 1
              ? "You have clocked in to 1 walk."
              : `You have clocked in to ${count} walks.`}
        </p>
        {attendances.length < count ? (
          <p className="text-xs text-muted-foreground">
            Showing the {attendances.length.toLocaleString("en-GB")} most recent.
          </p>
        ) : null}
      </div>

      <AttendanceHistory
        rows={attendances.map((attendance) => ({
          id: attendance.id,
          title: attendance.walk.title,
          location: attendance.walk.location,
          startsAt: attendance.walk.startsAt.toISOString(),
          durationMins: attendance.walk.durationMins,
          cancelledAt: attendance.walk.cancelledAt?.toISOString() ?? null,
          clockedInAt: attendance.clockedInAt.toISOString(),
          clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
          href: `/w/${attendance.walk.token}`,
        }))}
      />
    </div>
  );
}
