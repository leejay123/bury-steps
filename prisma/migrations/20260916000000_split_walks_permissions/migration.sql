-- Split the single Walks organiser permission into nine, one per
-- capability: View / Create / Edit / Cancel (and end) / Delete /
-- Attendance (see + add/remove) / Health notes / Journey updates /
-- Export (retention lock + roster CSV).
--
-- New columns default to true (same grandfathering rule as every earlier
-- permission column), then are immediately backfilled from permWalks so
-- an organiser who already had (or lacked) Walks access keeps exactly
-- the same access across all nine on the day of the split.
ALTER TABLE "User" ADD COLUMN "permWalksView" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksCreate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksEdit" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksCancel" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksDelete" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksAttendance" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksHealth" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksJourney" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permWalksExport" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User" SET
  "permWalksView" = "permWalks",
  "permWalksCreate" = "permWalks",
  "permWalksEdit" = "permWalks",
  "permWalksCancel" = "permWalks",
  "permWalksDelete" = "permWalks",
  "permWalksAttendance" = "permWalks",
  "permWalksHealth" = "permWalks",
  "permWalksJourney" = "permWalks",
  "permWalksExport" = "permWalks";

ALTER TABLE "User" DROP COLUMN "permWalks";
