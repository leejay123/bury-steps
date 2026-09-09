-- Toggle for the member Walks page's "All walks" tab (every completed
-- walk site-wide, title/date/location only — attendee visibility keeps
-- the existing per-walk privacy rule).
ALTER TABLE "SiteSetting" ADD COLUMN "allWalksTabEnabled" BOOLEAN NOT NULL DEFAULT false;
