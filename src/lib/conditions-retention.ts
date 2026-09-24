/** Days health notes stay on an attendance after the walk's start — see
 * clock-in and the purge-conditions cron. Kept outside "use server" files
 * so walks/reschedule can share the same number. */
export const CONDITIONS_RETENTION_DAYS = 90;

export function conditionsPurgeAfterFromStartsAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() + CONDITIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
