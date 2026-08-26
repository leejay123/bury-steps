export const LONDON = "Europe/London";

/** Milliseconds Europe/London is ahead of UTC at a given instant (handles BST). */
function londonOffsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - at.getTime();
}

/**
 * Convert a `datetime-local` value ("2026-09-03T18:30") that the organiser
 * typed as UK wall-clock time into a correct UTC instant.
 * Ambiguous times inside the autumn DST fold resolve to BST.
 */
export function londonWallClockToUtc(value: string): Date {
  const naive = new Date(`${value.length === 16 ? `${value}:00` : value}Z`);
  if (Number.isNaN(naive.getTime())) throw new Error("Invalid date");
  return new Date(naive.getTime() - londonOffsetMs(naive));
}

/** Inverse — produces a `datetime-local` string for prefilling the form. */
export function utcToLondonWallClock(at: Date): string {
  const shifted = new Date(at.getTime() + londonOffsetMs(at));
  return shifted.toISOString().slice(0, 16);
}

export function formatWalkDate(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

export function formatTime(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

export function londonYear(at: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      year: "numeric",
    }).format(at),
  );
}

export function formatDate(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(at);
}

export function formatDateTime(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    dateStyle: "short",
    timeStyle: "short",
  }).format(at);
}
