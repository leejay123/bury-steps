-- Name and phone a member gives before clock-in. Organisers only.
-- Null until they enter one. Optional unless emergencyContactRequired is on.
ALTER TABLE "User" ADD COLUMN "emergencyContactName" TEXT;
ALTER TABLE "User" ADD COLUMN "emergencyContactPhone" TEXT;

-- Off by default so existing members can still clock in until an organiser
-- chooses to require a contact.
ALTER TABLE "SiteSetting" ADD COLUMN "emergencyContactRequired" BOOLEAN NOT NULL DEFAULT false;
