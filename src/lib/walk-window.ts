/** Clock-in opens 60 min before the start and closes 60 min after the walk ends. */
export const OPENS_BEFORE_MS = 60 * 60 * 1000;
export const CLOSES_AFTER_MS = 60 * 60 * 1000;

export type WindowState = "too-early" | "open" | "closed";

export function windowState(
  startsAt: Date,
  durationMins: number,
  now: Date = new Date(),
): WindowState {
  const opens = startsAt.getTime() - OPENS_BEFORE_MS;
  const closes = startsAt.getTime() + durationMins * 60_000 + CLOSES_AFTER_MS;
  if (now.getTime() < opens) return "too-early";
  if (now.getTime() > closes) return "closed";
  return "open";
}

/**
 * The overall lifecycle status of a walk, as shown to organisers: a walk is
 * either cancelled, still ahead of its clock-in window, currently open for
 * clock-in, or — once the window has fully closed — completed. "Completed"
 * is deliberately a user-facing rename of the `windowState` "closed" result:
 * the underlying clock-in window logic hasn't changed, but a walk that has
 * simply happened and finished should read as "Completed", not "Closed" or
 * silently show no status at all.
 */
export type WalkStatus = "cancelled" | "upcoming" | "open" | "completed";

export function walkStatus(
  walk: { cancelledAt: Date | null; startsAt: Date; durationMins: number },
  now: Date = new Date(),
): WalkStatus {
  if (walk.cancelledAt) return "cancelled";
  const state = windowState(walk.startsAt, walk.durationMins, now);
  if (state === "too-early") return "upcoming";
  if (state === "open") return "open";
  return "completed";
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
  return walkStatus(walk, now) !== "open";
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
