// Pure, client-safe constants/helpers only — no `prisma` import here. A
// client component (admin/settings/retention/retention-settings.tsx) imports
// MAX_RETENTION_DAYS from this module; keeping the DB-backed getters in a
// separate walk-retention-server.ts stops @prisma/client's browser stub
// from riding along into that page's client bundle (same issue as
// walk-slug.ts — see its comment).

/**
 * Fallback used only for a brand-new SiteSetting row that predates this
 * column (the migration backfills existing rows to this same value, so
 * this isn't actually reached in practice) and the admin settings form's
 * placeholder text. The live, admin-configurable value always comes from
 * getCancelledWalkRetentionDays() in walk-retention-server.ts — nothing
 * else should import this.
 */
export const DEFAULT_CANCELLED_WALK_RETENTION_DAYS = 30;

/** Sanity cap on either retention setting — 10 years. Not a meaningful
 * real-world limit, just a guard against a fat-fingered huge number. */
export const MAX_RETENTION_DAYS = 3650;

/** Shared parser for both retention-days settings forms — blank (or 0)
 * means "never auto-delete" (null), matching the settings' own semantics. */
export function parseRetentionDays(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "invalid";
  const n = Number(trimmed);
  if (n === 0) return null;
  if (n > MAX_RETENTION_DAYS) return "invalid";
  return n;
}
