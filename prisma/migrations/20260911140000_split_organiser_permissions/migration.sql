-- Split the two combined organiser permissions into one per admin page:
-- permReportsMessages -> permMessages, permReports
-- permSettings -> permHomepage, permNotices, permProgress, permEmails,
--                  permSubscribers, permDisplay, permCacheReset
--
-- New columns default to true (same grandfathering rule as the original
-- columns), then are immediately backfilled from the old column they
-- replace so an organiser who had already been restricted keeps the same
-- restriction across every new sub-permission, rather than the split
-- silently handing them everything back via the default.
ALTER TABLE "User" ADD COLUMN "permMessages" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permReports" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permHomepage" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permNotices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permProgress" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permEmails" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permSubscribers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permDisplay" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permCacheReset" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User" SET
  "permMessages" = "permReportsMessages",
  "permReports" = "permReportsMessages";

UPDATE "User" SET
  "permHomepage" = "permSettings",
  "permNotices" = "permSettings",
  "permProgress" = "permSettings",
  "permEmails" = "permSettings",
  "permSubscribers" = "permSettings",
  "permDisplay" = "permSettings",
  "permCacheReset" = "permSettings";

ALTER TABLE "User" DROP COLUMN "permReportsMessages";
ALTER TABLE "User" DROP COLUMN "permSettings";
