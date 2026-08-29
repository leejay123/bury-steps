/** Browsers clamp setTimeout delays above this (~24.8 days). */
export const MAX_TIMER_DELAY_MS = 2_147_483_647;

/** Safe delay until `targetAt`, chunked so far-future walks still tick. */
export function walkClockDelayMs(targetAt: Date, nowMs = Date.now()): number {
  return Math.min(Math.max(0, targetAt.getTime() - nowMs), MAX_TIMER_DELAY_MS);
}
