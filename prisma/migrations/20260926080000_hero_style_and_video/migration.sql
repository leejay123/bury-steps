-- Lets the owner switch the homepage hero between the usual light banner
-- and a dark full-bleed video hero, and pick which bundled video to use.
-- Both default-backed so existing installs render exactly as before.
ALTER TABLE "SiteSetting" ADD COLUMN "heroStyle" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "SiteSetting" ADD COLUMN "heroVideoKey" TEXT NOT NULL DEFAULT 'hero-1';
