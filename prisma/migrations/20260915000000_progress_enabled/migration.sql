-- Site-wide switch for the /progress page (see Settings → Display →
-- Site chrome). When false the page 404s for everyone, organisers
-- included, and the nav drops the link.
ALTER TABLE "SiteSetting" ADD COLUMN "progressEnabled" BOOLEAN NOT NULL DEFAULT true;
