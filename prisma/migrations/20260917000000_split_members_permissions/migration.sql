-- Split the single Members organiser permission into two: View (list,
-- search, resend/cancel an organiser invite, a member's walk history) and
-- Remove (delete a plain member's account, log in as one).
--
-- New columns default to true (same grandfathering rule as every earlier
-- permission column), then are immediately backfilled from permMembers so
-- an organiser who already had (or lacked) Members access keeps exactly
-- the same access across both on the day of the split.
ALTER TABLE "User" ADD COLUMN "permMembersView" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permMembersRemove" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User" SET
  "permMembersView" = "permMembers",
  "permMembersRemove" = "permMembers";

ALTER TABLE "User" DROP COLUMN "permMembers";
