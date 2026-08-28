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
