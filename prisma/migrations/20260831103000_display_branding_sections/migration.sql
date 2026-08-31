ALTER TABLE "SiteSetting" ADD COLUMN "siteName" TEXT NOT NULL DEFAULT 'Bury Steps Walking Group';
ALTER TABLE "SiteSetting" ADD COLUMN "siteTagline" TEXT NOT NULL DEFAULT 'Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just people walking together.';
ALTER TABLE "SiteSetting" ADD COLUMN "facebookGroupUrl" TEXT NOT NULL DEFAULT 'https://www.facebook.com/groups/burysteps';
ALTER TABLE "SiteSetting" ADD COLUMN "testimonialsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSetting" ADD COLUMN "faqsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSetting" ADD COLUMN "howWalksWorkEnabled" BOOLEAN NOT NULL DEFAULT true;
