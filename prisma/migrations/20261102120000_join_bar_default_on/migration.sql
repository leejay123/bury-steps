-- Homepage join strip replaces the old dismissible announcement banner.
-- The strip already showed for everyone; keep it on by default.
ALTER TABLE "SiteSetting" ALTER COLUMN "announcementEnabled" SET DEFAULT true;
UPDATE "SiteSetting" SET "announcementEnabled" = true;
