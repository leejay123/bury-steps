-- Speed up organiser member lists and “walks created” counts.
-- Attendance.userId was only indexed as the second column of (walkId, userId),
-- so looking up one person’s clock-ins could not use that index.

CREATE INDEX IF NOT EXISTS "Attendance_userId_idx" ON "Attendance"("userId");
CREATE INDEX IF NOT EXISTS "Walk_createdById_idx" ON "Walk"("createdById");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
