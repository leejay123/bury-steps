/**
 * The site's own time, for clocks drawn in the browser (clock-in box,
 * countdowns, Upcoming): a phone whose clock is wrong would otherwise show
 * the clock-in button early, or "not open yet" when it is. Clocking in
 * itself never uses the phone's clock — the server stamps the time and
 * decides whether clock-in is open.
 *
 * Open pages ask /api/site-version every 30 seconds anyway (LiveUpdates);
 * its Date and Age headers say what time the site makes it, so the
 * difference from this device costs nothing extra to learn. Differences
 * under 3 seconds are ignored (the headers only count whole seconds).
 */
const STORAGE_KEY = "bs-clock-offset";
const IGNORE_UNDER_MS = 3000;
export const SERVER_CLOCK_EVENT = "bs-server-clock";

let offsetMs = readStored();

function readStored(): number {
  try {
    const value = Number(sessionStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Now, by the site's clock (this device's clock until the first check). */
export function serverNow(): Date {
  return new Date(Date.now() + offsetMs);
}

/** Learns the site's time from a /api/site-version answer. */
export function noteServerTime(response: Response, sentAtMs: number, receivedAtMs: number): void {
  const date = Date.parse(response.headers.get("date") ?? "");
  if (Number.isNaN(date)) return;
  const ageMs = (Number(response.headers.get("age")) || 0) * 1000;
  // The answer left the site about halfway through the round trip.
  const siteNowAtReceipt = date + ageMs + (receivedAtMs - sentAtMs) / 2;
  const measured = siteNowAtReceipt - receivedAtMs;
  const next = Math.abs(measured) < IGNORE_UNDER_MS ? 0 : Math.round(measured);
  if (next === offsetMs) return;
  offsetMs = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Private mode: it's learned again on the next check.
  }
  window.dispatchEvent(new Event(SERVER_CLOCK_EVENT));
}
