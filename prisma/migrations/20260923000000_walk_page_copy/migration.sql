-- Editable copy for the walk-page "Before you set off" and "How this
-- group works" cards. Empty string on both columns means "use the
-- built-in default text" (see src/lib/homepage-copy.ts) -- existing
-- installs see no change until an admin edits one.
ALTER TABLE "SiteSetting" ADD COLUMN "howWalksWorkSteps" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSetting" ADD COLUMN "beforeYouSetOffTips" TEXT NOT NULL DEFAULT '';
