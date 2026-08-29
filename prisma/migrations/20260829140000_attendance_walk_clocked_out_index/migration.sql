-- Speeds on-walk counts and Add someone exclusions (walkId + clockedOutAt IS NULL).
CREATE INDEX "Attendance_walkId_clockedOutAt_idx" ON "Attendance"("walkId", "clockedOutAt");
