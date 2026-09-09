-- Trigram indexes so the admin Members search (ILIKE '%term%' via Prisma's
-- contains/insensitive) stays fast on "User" as the group grows well past
-- what a plain B-tree index can help with — a B-tree only speeds up
-- prefix matches, not "contains anywhere in the string".
--
-- Postgres extensions need CREATE privileges. Supabase's default database
-- role has these, and pg_trgm ships in the standard Postgres contrib
-- package, so this should apply cleanly — but if a future host's role
-- lacks the privilege, this statement (and this migration) is the one to
-- skip: search still works correctly without the index, just via a full
-- table scan instead of an index scan once the table is large.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING GIN ("email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_firstName_trgm_idx" ON "User" USING GIN ("firstName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_lastName_trgm_idx" ON "User" USING GIN ("lastName" gin_trgm_ops);
