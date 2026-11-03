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
/**
 * Manage → Add someone: the Add someone button, only while organisers may
 * add people (the same live rule the Attendance tab used), for the Manage
 * menu's list.
 */
export function AddSomeoneInManage({
  cancelledAt,
  durationMins,
  endedAt,
  startsAt,
  walkId,
}: {
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
  walkId: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: new Date(startsAt),
  };
  if (!canOrganiserAddAttendance(walk, now)) return null;
  return (
    <AddAttendanceButton
      walkCompleted={walkStatus(walk, now) === "completed"}
      walkId={walkId}
      walkStartsAt={startsAt}
    />
  );
}

export function WalkAttendanceSection({
  canManageAttendance,
  canSeeEmergencyContact,
  canSeeHealthNotes,
  cancelledAt,
  conditionsNote = null,
  clockedOutRows,
  durationMins,
  endedAt,
  stillInRows,
  startsAt,
  totalAttendanceCount,
}: {
  canManageAttendance: boolean;
  canSeeEmergencyContact: boolean;
  canSeeHealthNotes: boolean;
  cancelledAt: string | null;
  /** Members' reported conditions: shown in the first list, under its header. */
  conditionsNote?: { title: string; text: string } | null;
  clockedOutRows: WalkAttendanceRow[];
  durationMins: number;
  endedAt: string | null;
  stillInRows: WalkAttendanceRow[];
  startsAt: string;
  totalAttendanceCount: number;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: new Date(startsAt),
  };
  const isCompleted = walkStatus(walk, now) === "completed";

  return (
    <>
      <section className="flex flex-col gap-3">
        {/* Add someone is in the Manage menu (AddSomeoneInManage). */}
        {stillInRows.length === 0 ? (
          <EmptyState
            description={
              totalAttendanceCount === 0
                ? cancelledAt
                  ? "Nobody clocked in before it was cancelled."
                  : isCompleted
                    ? "Nobody clocked in for this walk. If someone was there, use Manage → Add someone."
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
            canSeeEmergencyContact={canSeeEmergencyContact}
            canSeeHealthNotes={canSeeHealthNotes}
            heading={{ count: stillInRows.length, label: isCompleted ? "Attended" : "Attendance" }}
            note={conditionsNote}
            rows={stillInRows}
            walkCompleted={isCompleted}
          />
        )}
      </section>

      {clockedOutRows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <WalkAttendanceTable
            canRemove={!walk.cancelledAt && canManageAttendance}
            canSeeEmergencyContact={canSeeEmergencyContact}
            canSeeHealthNotes={canSeeHealthNotes}
            heading={{ count: clockedOutRows.length, label: "Clocked out" }}
            // Only when the first list is empty (the note goes in the first one).
            note={stillInRows.length === 0 ? conditionsNote : null}
            rows={clockedOutRows}
            walkCompleted={isCompleted}
          />
        </section>
      ) : null}
    </>
  );
}
