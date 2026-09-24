"use client";

import { useWalkClock } from "@/hooks/use-walk-clock";
import {
  canOrganiserAddAttendance,
  walkStatus,
} from "@/lib/walk-window";
import { EmptyState } from "@/components/empty-state";
import { ClipboardList } from "lucide-react";
import { AddAttendanceButton } from "./add-attendance-button";
import { WalkAttendanceTable, type WalkAttendanceRow } from "./walk-attendance";

/**
 * Attendance block on the organiser walk page. Add someone, empty-state copy,
 * and Attended vs Attendance labels all depend on the live phase — an SSR
 * snapshot would keep "too early to add" or "Attendance" after the walk
 * finishes if the page was left open.
 */
export function WalkAttendanceSection({
  canManageAttendance,
  canSeeHealthNotes,
  cancelledAt,
  clockedOutRows,
  durationMins,
  endedAt,
  stillInRows,
  startsAt,
  totalAttendanceCount,
  walkId,
}: {
  canManageAttendance: boolean;
  canSeeHealthNotes: boolean;
  cancelledAt: string | null;
  clockedOutRows: WalkAttendanceRow[];
  durationMins: number;
  endedAt: string | null;
  stillInRows: WalkAttendanceRow[];
  startsAt: string;
  totalAttendanceCount: number;
  walkId: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: new Date(startsAt),
  };
  const isCompleted = walkStatus(walk, now) === "completed";
  const canAdd = canOrganiserAddAttendance(walk, now);

  return (
    <>
      <section className="flex flex-col gap-3">
        {canAdd && canManageAttendance ? (
          <div className="flex justify-end">
            <AddAttendanceButton
              className="w-full sm:w-auto"
              walkCompleted={isCompleted}
              walkId={walkId}
              walkStartsAt={startsAt}
            />
          </div>
        ) : null}

        {stillInRows.length === 0 ? (
          <EmptyState
            description={
              totalAttendanceCount === 0
                ? isCompleted
                  ? "Nobody clocked in for this walk. If someone was there, use Add someone."
                  : "Share the link above with the group."
                : isCompleted
                  ? "Everyone who clocked in also clocked out before the walk finished."
                  : "Everyone who clocked in has since clocked out."
            }
            icon={ClipboardList}
            title={
              totalAttendanceCount === 0
                ? "Nobody has clocked in yet"
                : isCompleted
                  ? "Nobody stayed to the end"
                  : "Nobody is on the walk right now"
            }
          />
        ) : (
          <WalkAttendanceTable
            canRemove={!walk.cancelledAt && canManageAttendance}
            canSeeHealthNotes={canSeeHealthNotes}
            heading={{ count: stillInRows.length, label: isCompleted ? "Attended" : "Attendance" }}
            rows={stillInRows}
            walkCompleted={isCompleted}
          />
        )}
      </section>

      {clockedOutRows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <WalkAttendanceTable
            canRemove={!walk.cancelledAt && canManageAttendance}
            canSeeHealthNotes={canSeeHealthNotes}
            heading={{ count: clockedOutRows.length, label: "Clocked out" }}
            rows={clockedOutRows}
            walkCompleted={isCompleted}
          />
        </section>
      ) : null}
    </>
  );
}
