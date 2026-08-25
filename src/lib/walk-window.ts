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
