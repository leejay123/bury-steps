/** Clock-in opens 60 min before the start and closes 60 min after the walk ends. */
export const OPENS_BEFORE_MS = 60 * 60 * 1000;
export const CLOSES_AFTER_MS = 60 * 60 * 1000;

export type WindowState = "too-early" | "open" | "closed";

export function walkOpensAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() - OPENS_BEFORE_MS);
}

export function walkEndsAt(startsAt: Date, durationMins: number): Date {
  return new Date(startsAt.getTime() + durationMins * 60_000);
}

export function walkClosesAt(startsAt: Date, durationMins: number): Date {
  return new Date(walkEndsAt(startsAt, durationMins).getTime() + CLOSES_AFTER_MS);
}

export function windowState(
  startsAt: Date,
  durationMins: number,
  now: Date = new Date(),
): WindowState {
  if (now.getTime() < walkOpensAt(startsAt).getTime()) return "too-early";
  if (now.getTime() > walkClosesAt(startsAt, durationMins).getTime()) return "closed";
  return "open";
}

/**
 * The overall lifecycle status of a walk, as shown on organiser and member
 * surfaces. Clock-in is available for starting-soon, in-progress, and
 * walk-ended; Completed means that window has fully closed.
 */
export type WalkStatus =
  | "cancelled"
  | "upcoming"
  | "starting-soon"
  | "in-progress"
  | "walk-ended"
  | "completed";

export function walkStatus(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number },
  now: Date = new Date(),
): WalkStatus {
  if (walk.cancelledAt) return "cancelled";
  if (now.getTime() < walkOpensAt(walk.startsAt).getTime()) return "upcoming";
  if (now.getTime() < walk.startsAt.getTime()) return "starting-soon";
  if (now.getTime() < walkEndsAt(walk.startsAt, walk.durationMins).getTime()) return "in-progress";
  if (now.getTime() <= walkClosesAt(walk.startsAt, walk.durationMins).getTime()) return "walk-ended";
  return "completed";
}

/**
 * Next instant the public status badge should change. Null once the walk
 * is cancelled or completed — nothing left on a timer.
 */
export function nextWalkStatusChangeAt(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number },
  now: Date = new Date(),
): Date | null {
  if (walk.cancelledAt) return null;
  const opensAt = walkOpensAt(walk.startsAt);
  const endsAt = walkEndsAt(walk.startsAt, walk.durationMins);
  const closesAt = walkClosesAt(walk.startsAt, walk.durationMins);
  if (now.getTime() < opensAt.getTime()) return opensAt;
  if (now.getTime() < walk.startsAt.getTime()) return walk.startsAt;
  if (now.getTime() < endsAt.getTime()) return endsAt;
  if (now.getTime() <= closesAt.getTime()) return new Date(closesAt.getTime() + 1);
  return null;
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
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return true;
  return windowState(walk.startsAt, walk.durationMins, now) === "closed";
}

/**
 * Date, time, and expected length freeze once the published start has
 * passed. Last-minute "we're 15 minutes late leaving" is still allowed in
 * the hour before start, when clock-in is already open. Changing the
 * official start after people are walking would rewrite the record under
 * them; late arrivals can still clock in until an hour after the walk was
 * due to finish, and an organiser can add someone who forgot.
 */
export function isWalkScheduleLocked(startsAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= startsAt.getTime();
}

/**
 * Organisers can add a member who was there but did not clock in — while
 * the window is open (phone died) and after the walk is completed (they
 * forgot until too late). Not before clock-in opens, and not on a
 * cancelled walk (reopen it first).
 */
export function canOrganiserAddAttendance(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number },
  now: Date = new Date(),
): boolean {
  if (walk.cancelledAt) return false;
  return windowState(walk.startsAt, walk.durationMins, now) !== "too-early";
}

/**
 * Clock-in time when an organiser adds someone. While the window is still
 * open, use now — they are being added as they arrive. Once the walk has
 * completed, use the start so they count as having done the walk rather
 * than appearing to clock in after it finished.
 */
export function organiserRecordedClockInAt(
  walk: { startsAt: Date; durationMins: number },
  now: Date = new Date(),
): Date {
  return windowState(walk.startsAt, walk.durationMins, now) === "closed" ? walk.startsAt : now;
}
