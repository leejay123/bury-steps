-- Add VISITORS for schema compatibility. Do not INSERT rows that use the new
-- value in this same migration: Postgres rejects using a newly added enum
-- value until the transaction commits (that is what failed on production).
ALTER TYPE "SiteNoticeAudience" ADD VALUE IF NOT EXISTS 'VISITORS';
