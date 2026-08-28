export const LONDON = "Europe/London";

export type DateInput = Date | string | number;

/** Dates crossing `unstable_cache` or a Client Component arrive as ISO strings. */
export function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

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
export function utcToLondonWallClock(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) throw new Error("Invalid date");
  const shifted = new Date(date.getTime() + londonOffsetMs(date));
  return shifted.toISOString().slice(0, 16);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Build a UK wall-clock `datetime-local` string from a calendar day plus hours and minutes. */
export function combineLondonDateAndTime(date: Date, hour: number, minute: number): string {
  const { day, month, year } = londonYmd(date);
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
}

export function formatWalkDay(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(londonYear(date) === londonYear(new Date()) ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatWalkDate(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function londonYear(at: DateInput): number {
  const date = toDate(at);
  if (!isValidDate(date)) return new Date().getFullYear();
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      year: "numeric",
    }).format(date),
  );
}

export function formatDate(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function londonYmd(at: DateInput): { day: number; month: number; year: number } {
  const date = toDate(at);
  if (!isValidDate(date)) {
    const now = new Date();
    return { day: now.getUTCDate(), month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return { day: Number(parts.day), month: Number(parts.month), year: Number(parts.year) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function plural(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}

/** How long someone has been a member, e.g. "today", "12 days", "2 months", "1 year 3 months". */
export function formatMembershipAge(joined: DateInput, now: DateInput = new Date()): string {
  const from = londonYmd(joined);
  const to = londonYmd(now);
  let years = to.year - from.year;
  let months = to.month - from.month;
  let days = to.day - from.day;

  if (days < 0) {
    months -= 1;
    const prevMonth = to.month === 1 ? 12 : to.month - 1;
    const prevYear = to.month === 1 ? to.year - 1 : to.year;
    days += daysInMonth(prevYear, prevMonth);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "today";

  const parts: string[] = [];
  if (years > 0) parts.push(plural(years, "year"));
  if (months > 0) parts.push(plural(months, "month"));
  if (parts.length > 0) return parts.join(" ");
  if (days <= 0) return "today";
  return plural(days, "day");
}

export function formatDateTime(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** Short date and time for tables, e.g. "30 Aug, 13:00". Adds the year when it is not this year. */
export function formatCompactDateTime(at: DateInput): string {
  const date = toDate(at);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    day: "numeric",
    month: "short",
    ...(londonYear(date) === londonYear(new Date()) ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
