/** Clock-in opens 60 min before the start and closes when the walk is due to finish. */
export const OPENS_BEFORE_MS = 60 * 60 * 1000;

/** Longest walk duration allowed by the schema (minutes). Used for list lookbacks. */
export const MAX_WALK_DURATION_MINS = 600;

/**
 * Earliest `startsAt` that might still have an open clock-in window.
 * Shorter than this and the walk is safely in History.
 */
export function upcomingListLookbackFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() - MAX_WALK_DURATION_MINS * 60_000);
}

export type WindowState = "too-early" | "open" | "closed";

export function walkOpensAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() - OPENS_BEFORE_MS);
}

function scheduledEndsAt(startsAt: Date, durationMins: number): Date {
  return new Date(startsAt.getTime() + durationMins * 60_000);
}

/**
 * When the walk actually finishes (or finished) — the organiser's early end
 * (see endWalkEarly in src/server/actions/walks.ts) if one was recorded,
 * otherwise the scheduled end from its published length. `endedAt` can only
 * pull the finish in, never push it out: a value at or after the scheduled
 * end is ignored rather than extending the walk, since setting a *later*
 * end isn't what this field is for.
 */
export function effectiveEndsAt(walk: {
  startsAt: Date;
  durationMins: number;
  endedAt?: Date | null;
}): Date {
  const scheduled = scheduledEndsAt(walk.startsAt, walk.durationMins);
  if (!walk.endedAt || walk.endedAt.getTime() >= scheduled.getTime()) return scheduled;
  return walk.endedAt;
}

export function windowState(
  startsAt: Date,
  durationMins: number,
  now: Date = new Date(),
  endedAt: Date | null = null,
): WindowState {
  if (now.getTime() < walkOpensAt(startsAt).getTime()) return "too-early";
  if (now.getTime() >= effectiveEndsAt({ startsAt, durationMins, endedAt }).getTime()) {
    return "closed";
  }
  return "open";
}

/**
 * The overall lifecycle status of a walk, as shown on organiser and member
 * surfaces. Clock-in is available for starting-soon and in-progress only;
 * Completed means the walk's actual end (its early end if it has one,
 * otherwise the scheduled end) has been reached.
 */
export type WalkStatus =
  | "cancelled"
  | "upcoming"
  | "starting-soon"
  | "in-progress"
  | "completed";

export function walkStatus(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): WalkStatus {
  if (walk.cancelledAt) return "cancelled";
  if (now.getTime() < walkOpensAt(walk.startsAt).getTime()) return "upcoming";
  if (now.getTime() < walk.startsAt.getTime()) return "starting-soon";
  if (now.getTime() < effectiveEndsAt(walk).getTime()) return "in-progress";
  return "completed";
}

/** Organisers may add journey events once the walk has started (not cancelled). */
export function canOrganiserEditJourney(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return false;
  const status = walkStatus(walk, now);
  return status === "in-progress" || status === "completed";
}

/**
 * Next instant the public status badge should change. Null once the walk
 * is cancelled or completed — nothing left on a timer.
 */
export function nextWalkStatusChangeAt(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): Date | null {
  if (walk.cancelledAt) return null;
  const opensAt = walkOpensAt(walk.startsAt);
  const endsAt = effectiveEndsAt(walk);
  if (now.getTime() < opensAt.getTime()) return opensAt;
  if (now.getTime() < walk.startsAt.getTime()) return walk.startsAt;
  if (now.getTime() < endsAt.getTime()) return endsAt;
  return null;
}

/**
 * Remaining time until start while Starting soon, e.g. "23:04".
 * Returns null when start has already passed.
 */
export function formatStartingSoonCountdown(
  startsAt: Date,
  now: Date = new Date(),
): string | null {
  const ms = startsAt.getTime() - now.getTime();
  if (ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Remaining time until a walk actually finishes while In progress, e.g.
 * "23 min" — coarse to the minute (matching the minute-by-minute ticking
 * useWalkClock actually does for most of a walk; showing a stale mm:ss
 * that hasn't moved in 45 seconds would look broken), switching to a
 * seconds-precise "0:12" only in the final minute, which is also where
 * useWalkClock switches to ticking every second. Returns null once the
 * walk's actual end has already passed.
 */
export function formatInProgressCountdown(endsAt: Date, now: Date = new Date()): string | null {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return null;
  if (ms < 60_000) {
    const secs = Math.ceil(ms / 1000);
    return `0:${secs.toString().padStart(2, "0")}`;
  }
  const mins = Math.floor(ms / 60_000);
  return `${mins} min`;
}

/**
 * Whether a walk a member clocked in to belongs in their "history" yet. A
 * walk that's still under way isn't history — it's happening right now —
 * so this is only true once it's cancelled (kept as a record either way)
 * or fully completed. There's no "upcoming" case here in practice: you can
 * only have an attendance record for a walk you've clocked in to, which
 * requires its window to already be open.
 */
export function isWalkHistoryReady(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return true;
  return windowState(walk.startsAt, walk.durationMins, now, walk.endedAt ?? null) === "closed";
}

/**
 * Date, time, and expected length freeze once the published start has
 * passed. Last-minute "we're 15 minutes late leaving" is still allowed in
 * the hour before start, when clock-in is already open. Changing the
 * official start after people are walking would rewrite the record under
 * them; late arrivals after the scheduled end need an organiser to add them.
 */
export function isWalkScheduleLocked(startsAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= startsAt.getTime();
}

/** New / edited start times must still be in the future. */
export function isWalkStartInThePast(startsAt: Date, now: Date = new Date()): boolean {
  return startsAt.getTime() <= now.getTime();
}

/**
 * Calendar downloads are only useful before the walk is over. Cancelled and
 * completed walks stay off calendars.
 */
export function canAddWalkToCalendar(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return false;
  return walkStatus(walk, now) !== "completed";
}

/**
 * Organisers can add a member who was there but did not clock in — while
 * the window is open (phone died) and after the walk is completed (they
 * forgot until too late). Not before clock-in opens, and not on a
 * cancelled walk (reopen it first).
 */
export function canOrganiserAddAttendance(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return false;
  return windowState(walk.startsAt, walk.durationMins, now, walk.endedAt ?? null) !== "too-early";
}

/**
 * Clock-in time when an organiser adds someone. While the window is still
 * open, use now — they are being added as they arrive. Once the walk has
 * completed, use the start so they count as having done the walk rather
 * than appearing to clock in after it finished.
 */
export function organiserRecordedClockInAt(
  walk: { startsAt: Date; durationMins: number; endedAt?: Date | null },
  now: Date = new Date(),
): Date {
  return windowState(walk.startsAt, walk.durationMins, now, walk.endedAt ?? null) === "closed"
    ? walk.startsAt
    : now;
}
