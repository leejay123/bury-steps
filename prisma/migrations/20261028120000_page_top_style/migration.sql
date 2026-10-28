-- Settings → Branding → Page tops: plain, grey, big or dark.
ALTER TABLE "SiteSetting" ADD COLUMN "pageTopStyle" TEXT NOT NULL DEFAULT 'plain';
