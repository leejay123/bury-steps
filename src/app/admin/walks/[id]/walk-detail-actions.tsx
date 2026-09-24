"use client";

import { CalendarPlus, Download } from "lucide-react";
import { useWalkClock } from "@/hooks/use-walk-clock";
import {
  canAddWalkToCalendar,
  isWalkScheduleLocked,
  walkStatus,
} from "@/lib/walk-window";
import { Button } from "@/components/ui/button";
import { CancelWalkButton } from "./cancel-walk-button";
import { DeleteWalkButton } from "./delete-walk-button";
import { DuplicateWalkButton } from "./duplicate-walk-button";
import { EditWalkButton } from "./edit-walk-button";
import { EndWalkButton } from "./end-walk-button";
import { ReopenWalkButton } from "./reopen-walk-button";

/**
 * Status-gated walk toolbar. Cancel / End / Edit / Add to calendar all depend
 * on the live phase of the walk — if these were decided only on the server,
 * a page left open through Starting soon → In progress would still offer
 * Cancel (and skip End walk) until a refresh. Same clock the status badge uses.
 */
export function WalkDetailActions({
  attendanceCount,
  cancelledAt,
  canCancel,
  canCreate,
  canEdit,
  canExportRoster,
  description,
  durationMins,
  endedAt,
  icsHref,
  latitude,
  location,
  longitude,
  postcode,
  rosterHref,
  startsAt,
  title,
  totalAttendanceCount,
  viewerIsOwner,
  walkId,
  what3words,
}: {
  attendanceCount: number;
  cancelledAt: string | null;
  canCancel: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canExportRoster: boolean;
  description: string | null;
  durationMins: number;
  endedAt: string | null;
  icsHref: string;
  latitude: number | null;
  location: string | null;
  longitude: number | null;
  postcode: string | null;
  rosterHref: string;
  startsAt: string;
  title: string;
  totalAttendanceCount: number;
  viewerIsOwner: boolean;
  walkId: string;
  what3words: string | null;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: new Date(startsAt),
  };
  const status = walkStatus(walk, now);
  const isCompleted = status === "completed";
  const showCalendar = canAddWalkToCalendar(walk, now);
  const scheduleLocked = isWalkScheduleLocked(walk.startsAt, now);
  const showCancel =
    canCancel && !walk.cancelledAt && (status === "upcoming" || status === "starting-soon");
  const showEnd = canCancel && status === "in-progress";

  return (
    <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
      {showCalendar ? (
        <Button asChild size="sm" variant="outline">
          <a download href={icsHref}>
            <CalendarPlus data-icon="inline-start" />
            Add to calendar
          </a>
        </Button>
      ) : null}
      {canExportRoster ? (
        <Button asChild size="sm" variant="outline">
          <a href={rosterHref}>
            <Download data-icon="inline-start" />
            Download roster (CSV)
          </a>
        </Button>
      ) : null}
      {canCreate ? <DuplicateWalkButton walkId={walkId} /> : null}
      {/*
        Cancel only ever applies to a walk that hasn't started yet —
        "cancelled" means it never happened, which stops being true the
        moment people are out on it. Once it's in progress, End walk is
        the equivalent action instead (marks it finished early rather
        than un-happening it); once it's completed, neither applies.
      */}
      {showCancel ? (
        <CancelWalkButton walkId={walkId} attendanceCount={attendanceCount} />
      ) : null}
      {/* Only makes sense while the walk is actually under way — before
          that there's nothing to cut short, and after it's already
          completed (naturally or via this same button) there's nothing
          left to end. */}
      {showEnd ? <EndWalkButton walkId={walkId} /> : null}
      {/*
        Edit for a completed walk would silently rewrite history rather
        than change a plan, so it stays hidden the moment the clock-in
        window has fully closed; Delete and the CSV export remain below,
        since a completed walk is still a real record that might need
        correcting or removing.
      */}
      {canEdit && !isCompleted ? (
        <EditWalkButton
          cancelled={Boolean(walk.cancelledAt)}
          description={description}
          durationMins={durationMins}
          latitude={latitude}
          location={location}
          longitude={longitude}
          postcode={postcode}
          scheduleLocked={scheduleLocked}
          startsAt={startsAt}
          title={title}
          walkId={walkId}
          what3words={what3words}
        />
      ) : null}
      {canCancel && walk.cancelledAt ? <ReopenWalkButton walkId={walkId} /> : null}
      {viewerIsOwner ? (
        <DeleteWalkButton attendanceCount={totalAttendanceCount} walkId={walkId} />
      ) : null}
    </div>
  );
}
