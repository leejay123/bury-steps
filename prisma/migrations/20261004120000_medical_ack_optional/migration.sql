-- Organiser-added attendance has no medical acknowledgement from the member.
ALTER TABLE "Attendance" ALTER COLUMN "medicalAckAt" DROP NOT NULL;
