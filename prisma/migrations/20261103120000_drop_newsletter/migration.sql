-- Remove the newsletter: signup list, member opt-in flag, Resend audience
-- id, and any saved wording / "don't send" row for the subscribe email.
DROP TABLE IF EXISTS "NewsletterSubscriber";

ALTER TABLE "User" DROP COLUMN IF EXISTS "emailNewsletter";

ALTER TABLE "SiteSetting" DROP COLUMN IF EXISTS "resendAudienceId";

DELETE FROM "EmailTemplateOverride" WHERE "key" = 'newsletterSubscribed';
DELETE FROM "DisabledEmail" WHERE "key" = 'newsletterSubscribed';
