-- Lets the owner adjust the cinematic hero's overlay darkness and text
-- color. Both default-backed so the existing look is unchanged.
ALTER TABLE "SiteSetting" ADD COLUMN "heroOverlayOpacity" INTEGER NOT NULL DEFAULT 55;
ALTER TABLE "SiteSetting" ADD COLUMN "heroTextColor" TEXT NOT NULL DEFAULT '#ffffff';
