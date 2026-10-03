-- Remember the first-visit clock-in pop-up on the account, not in the
-- browser. Anyone who already has an account has either seen it or has
-- been a member long enough that it should not start appearing now.
ALTER TABLE "User" ADD COLUMN "welcomeSeenAt" TIMESTAMP(3);
UPDATE "User" SET "welcomeSeenAt" = CURRENT_TIMESTAMP WHERE "welcomeSeenAt" IS NULL;
