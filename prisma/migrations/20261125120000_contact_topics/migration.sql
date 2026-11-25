-- The Contact us form now asks what the message is about and emails the
-- matching committee mailbox (Chair, Treasurer or Secretary).
ALTER TABLE "ContactMessage" ADD COLUMN "topic" TEXT NOT NULL DEFAULT 'SECRETARY';

ALTER TABLE "SiteSetting"
  ADD COLUMN "contactChairEmail" TEXT NOT NULL DEFAULT 'chair@burysteps-walkinggroup.co.uk',
  ADD COLUMN "contactTreasurerEmail" TEXT NOT NULL DEFAULT 'treasurer@burysteps-walkinggroup.co.uk',
  ADD COLUMN "contactSecretaryEmail" TEXT NOT NULL DEFAULT 'secretary@burysteps-walkinggroup.co.uk';
