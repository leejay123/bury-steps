-- The member Walks page's "All walks" tab is no longer admin-toggleable —
-- it (and "Upcoming", which no longer shows cancelled walks) are both
-- always shown now.
ALTER TABLE "SiteSetting" DROP COLUMN "allWalksTabEnabled";
