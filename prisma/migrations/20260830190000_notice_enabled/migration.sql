-- Allow disabling the pinned welcome (and any future system notices) without deleting.

ALTER TABLE "SiteNotice" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "SiteNotice_enabled_idx" ON "SiteNotice"("enabled");
