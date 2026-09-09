-- Replace the "every organiser who opted in gets alerted" model for
-- contact-form messages with a single designated owner.
ALTER TABLE "SiteSetting" ADD COLUMN "contactMessagesOwnerId" TEXT;

ALTER TABLE "SiteSetting"
  ADD CONSTRAINT "SiteSetting_contactMessagesOwnerId_fkey"
  FOREIGN KEY ("contactMessagesOwnerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Superseded by the single-owner setting above.
ALTER TABLE "User" DROP COLUMN "emailContactAlerts";
