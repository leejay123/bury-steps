-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "clockedOutAt" TIMESTAMP(3);
ALTER TABLE "Attendance" ADD COLUMN "clockedOutReason" TEXT;

-- People still on a walk are listed often; skip rows that have already left.
CREATE INDEX "Attendance_walkId_active_idx" ON "Attendance"("walkId") WHERE "clockedOutAt" IS NULL;
