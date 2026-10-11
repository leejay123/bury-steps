-- Walk pages with tabs (layouts A to D): how the title and the walk's
-- controls are shown at the top — "standard", "buttons" (H1), "toolbar"
-- (H2), "band" (H3) or "grouped" (H4).
ALTER TABLE "SiteSetting" ADD COLUMN "walkHeaderStyle" TEXT NOT NULL DEFAULT 'standard';
