-- Every tab bar on the site: "standard" (grey pill) or "underline" (the
-- shadcn-space tabs-05 look: underline that slides, hover highlight).
ALTER TABLE "SiteSetting" ADD COLUMN "tabStyle" TEXT NOT NULL DEFAULT 'standard';
