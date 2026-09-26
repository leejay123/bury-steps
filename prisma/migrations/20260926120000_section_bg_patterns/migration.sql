-- Per-section homepage background pattern choice ("none" | "dots" |
-- "stripes"). Hero defaults to "dots" — it always showed a dot grid before
-- this setting existed, so this default keeps its look unchanged. Every
-- other section had no pattern at all, so they default to "none".
ALTER TABLE "SiteSetting" ADD COLUMN "heroBgPattern" TEXT NOT NULL DEFAULT 'dots';
ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedBgPattern" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "SiteSetting" ADD COLUMN "testimonialsBgPattern" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "SiteSetting" ADD COLUMN "memberNoticesBgPattern" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "SiteSetting" ADD COLUMN "faqsBgPattern" TEXT NOT NULL DEFAULT 'none';
