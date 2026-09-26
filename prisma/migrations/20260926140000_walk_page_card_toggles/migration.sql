-- Show/hide switches for the two cards on a walk's own page.
-- howWalksWorkEnabled already existed (unused until now). Default on
-- so existing walks keep both cards until an organiser turns one off.
ALTER TABLE "SiteSetting" ADD COLUMN "beforeYouSetOffEnabled" BOOLEAN NOT NULL DEFAULT true;
