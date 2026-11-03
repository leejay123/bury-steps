-- Newsletter UI is gone in this deploy. Do not DROP the table or columns here:
-- this runs during `vercel build` while the previous deployment is still serving
-- and still SELECTs User."emailNewsletter". ACCESS EXCLUSIVE waits until
-- Supabase's 2-minute statement_timeout, which is what failed 2026-11-03
-- (P3018 / 57014). Extra columns are ignored by the new Prisma client; a
-- follow-up migration drops them once this code is live.

DELETE FROM "EmailTemplateOverride" WHERE "key" = 'newsletterSubscribed';
DELETE FROM "DisabledEmail" WHERE "key" = 'newsletterSubscribed';
