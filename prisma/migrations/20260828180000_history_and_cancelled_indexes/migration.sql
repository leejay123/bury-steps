-- Attendance.userId was indexed on its own, which only serves an exact
-- match on the member. History lookups always add
-- `ORDER BY clockedInAt DESC` on top, so replace it with a composite index
-- that covers both — a leftmost-prefix match still serves the plain
-- `WHERE userId = ?` queries the old index handled.
DROP INDEX IF EXISTS "Attendance_userId_idx";
CREATE INDEX IF NOT EXISTS "Attendance_userId_clockedInAt_idx" ON "Attendance"("userId", "clockedInAt");

-- Used by the dashboard's "recently cancelled" window and the daily purge
-- cron's cutoff query, both of which filter on cancelledAt.
CREATE INDEX IF NOT EXISTS "Walk_cancelledAt_idx" ON "Walk"("cancelledAt");
