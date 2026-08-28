/**
 * Best-effort, in-process rate limiting. There is no Redis/Upstash in this
 * app — standing one up purely for a small walking group's clock-in button
 * would be a lot of new infrastructure for the risk involved — so this
 * lives in memory instead.
 *
 * Known limitation: each serverless instance has its own map, and it
 * resets whenever an instance cold-starts. On Vercel, a determined
 * attacker rotating across instances (or just waiting for one) can get
 * around it — this is abuse *deterrence*, not a hard guarantee. It still
 * meaningfully throttles the much more common case — someone spamming a
 * button, or a simple script hammering one action — on whichever warm
 * instance handles their requests.
 *
 * The actual hard guarantees for the actions that use this
 * (clockIn/clockOut) come from elsewhere: the `@@unique([walkId, userId])`
 * constraint on Attendance means no amount of rate-limit bypassing lets
 * someone create two attendance rows for the same walk, and every action
 * re-checks the caller's own auth/ownership before writing. Treat this
 * limiter as a courtesy that keeps logs and DB load sane, not as the thing
 * standing between the app and real abuse.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Cheap unbounded-growth guard so abuse across many keys can't leak memory forever. */
const MAX_TRACKED_KEYS = 5000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * `key` should identify both the caller and the action, e.g. `${userId}:clockIn`,
 * so one member's rapid clicking can't affect anyone else's.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}
