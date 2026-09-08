-- Lets each organiser opt out of the contact-form / accident-report alert
-- emails individually, instead of every ADMIN row being emailed
-- unconditionally. Purely additive; defaults to true so nothing changes for
-- existing organisers until one of them turns it off.
ALTER TABLE "User" ADD COLUMN "emailOrganiserAlerts" BOOLEAN NOT NULL DEFAULT true;
