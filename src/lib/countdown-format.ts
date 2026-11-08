/**
 * A live countdown's words, in one of four styles (chosen on the walk page
 * designer's Details card):
 *
 * - digital: 01:49:21, with days first once there are any (2:01:49:21)
 * - narrow:  1h 49m 21s
 * - short:   1 hr, 49 min, 21 sec
 * - long:    1 hour, 49 minutes, 21 seconds
 *
 * Leading units that are zero are left out (no "0 days"), the rest always
 * show so the line doesn't change shape every minute.
 */
export const COUNTDOWN_STYLES = ["digital", "narrow", "short", "long"] as const;
export type CountdownStyle = (typeof COUNTDOWN_STYLES)[number];

export function isCountdownStyle(value: unknown): value is CountdownStyle {
  return typeof value === "string" && (COUNTDOWN_STYLES as readonly string[]).includes(value);
}

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function split(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const NAMES = {
  short: { days: ["day", "days"], hours: ["hr", "hr"], minutes: ["min", "min"], seconds: ["sec", "sec"] },
  long: {
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
    seconds: ["second", "seconds"],
  },
} as const;

/** The units to show, biggest first, from the first that isn't zero. */
function units(parts: Parts): (keyof Parts)[] {
  const order: (keyof Parts)[] = ["days", "hours", "minutes", "seconds"];
  const first = order.findIndex((unit) => parts[unit] > 0);
  return first === -1 ? ["seconds"] : order.slice(first);
}

/** The countdown as words, e.g. "1h 49m 21s". `ms` is the time left (never below zero). */
export function formatCountdown(ms: number, style: CountdownStyle): string {
  const parts = split(ms);
  if (style === "digital") {
    const pad = (n: number) => String(n).padStart(2, "0");
    const clock = `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
    return parts.days > 0 ? `${parts.days}:${clock}` : clock;
  }
  const shown = units(parts);
  if (style === "narrow") {
    const letter = { days: "d", hours: "h", minutes: "m", seconds: "s" } as const;
    return shown.map((unit) => `${parts[unit]}${letter[unit]}`).join(" ");
  }
  const names = NAMES[style];
  return shown
    .map((unit) => `${parts[unit]} ${names[unit][parts[unit] === 1 ? 0 : 1]}`)
    .join(", ");
}
