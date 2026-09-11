-- Granular organiser permissions (Walks / Members / Reports & messages /
-- Settings & homepage), chosen at invite time and editable after from
-- Members. Defaulting to true means every organiser that already existed
-- keeps full access with no backfill needed.
ALTER TABLE "User" ADD COLUMN "permWalks" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permMembers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permReportsMessages" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "permSettings" BOOLEAN NOT NULL DEFAULT true;
