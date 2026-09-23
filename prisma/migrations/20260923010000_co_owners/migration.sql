-- Owner becomes a set instead of a single pointer — any number of
-- organisers can hold it at once (see src/lib/site-owner.ts). Replaces
-- SiteSetting.ownerId (a single FK, "exactly one owner" enforced by the
-- column shape itself) with User.isOwner (a flag, any number of rows can
-- be true at once — "at least one" is enforced in code instead, by
-- removeOwner refusing to strip the last one).
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: whoever the single ownerId pointed at becomes the sole owner
-- under the new model too, so no existing install goes ownerless.
UPDATE "User"
SET "isOwner" = true
WHERE "id" = (SELECT "ownerId" FROM "SiteSetting" WHERE "id" = 'site');

ALTER TABLE "SiteSetting" DROP CONSTRAINT IF EXISTS "SiteSetting_ownerId_fkey";
ALTER TABLE "SiteSetting" DROP COLUMN "ownerId";
