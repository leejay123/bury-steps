-- Only the unused signup table. Do not DROP COLUMN on "User" or "SiteSetting"
-- here: those tables are queried on every request, ACCESS EXCLUSIVE waits
-- behind live SELECTs (and idle-in-transaction sessions), then the queued
-- ALTER stalls the site. Extra columns are ignored by Prisma. The table is
-- 6 rows and nothing in the live app touches it.
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '5s';

DROP TABLE IF EXISTS "NewsletterSubscriber";
