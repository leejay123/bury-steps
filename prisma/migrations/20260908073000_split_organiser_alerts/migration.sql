-- Splits the single emailOrganiserAlerts toggle into two independent ones,
-- so one organiser can follow accident reports without also getting every
-- contact-form message (or vice versa). Both default true, same as the
-- combined toggle they replace, so nothing changes for existing organisers
-- until one of them separates their choice.
ALTER TABLE "User" ADD COLUMN "emailContactAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailAccidentAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" DROP COLUMN "emailOrganiserAlerts";
