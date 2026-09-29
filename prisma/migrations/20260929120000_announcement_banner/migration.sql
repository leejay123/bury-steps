ALTER TABLE "SiteSetting" ADD COLUMN "announcementEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSetting" ADD COLUMN "announcementText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSetting" ADD COLUMN "announcementLink" TEXT NOT NULL DEFAULT '';
