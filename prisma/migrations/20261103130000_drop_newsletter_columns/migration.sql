-- Applied by hand with a short lock_timeout so a wait cannot queue live
-- SELECTs behind ACCESS EXCLUSIVE (see 20261103120000 / 20261103123700).
ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "resendAudienceId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailNewsletter";
