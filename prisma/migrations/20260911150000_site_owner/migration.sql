-- The single "master organiser" who alone can promote/demote an
-- organiser, edit an organiser's permissions, or remove an organiser's
-- account (see src/lib/site-owner.ts). Same single-pointer pattern as
-- SiteSetting.contactMessagesOwnerId.
ALTER TABLE "SiteSetting" ADD COLUMN "ownerId" TEXT;

ALTER TABLE "SiteSetting"
  ADD CONSTRAINT "SiteSetting_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill for existing installs: whichever organiser account was created
-- first becomes the initial owner, so nothing is left ownerless. Going
-- forward, syncLocalUser sets this the moment the very first organiser is
-- ever bootstrapped, so this UPDATE is a one-time catch-up only.
UPDATE "SiteSetting"
SET "ownerId" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "ownerId" IS NULL;
