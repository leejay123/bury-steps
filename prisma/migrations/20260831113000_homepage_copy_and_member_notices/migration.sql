ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedTitle" TEXT NOT NULL DEFAULT 'How this started';
ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedEyebrow" TEXT NOT NULL DEFAULT 'Kindness · Friendship · Welcome';
ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedTeaser" TEXT NOT NULL DEFAULT 'What started out as a self-help mission to get myself fit after my diabetes diagnosis began with a simple goal: walking four miles a day with the dogs after work. It has grown into a community of walkers supporting one another week after week.';
ALTER TABLE "SiteSetting" ADD COLUMN "howThisStartedBody" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSetting" ADD COLUMN "memberNoticesEnabled" BOOLEAN NOT NULL DEFAULT true;
