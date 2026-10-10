-- Order (and show/hide) of the shared sections on a walk's page:
-- Before you set off, Meeting point map, 7-day forecast, Precise location.
ALTER TABLE "SiteSetting" ADD COLUMN "walkPageSections" TEXT NOT NULL DEFAULT 'before,map,forecast,precise';
