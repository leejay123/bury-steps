-- Configurable auto-delete for cancelled walks (was a hardcoded 30 days —
-- default preserves that) and, newly, for accident reports (off by default).
-- Both can be exempted per-row via retentionLocked.
ALTER TABLE "SiteSetting" ADD COLUMN "cancelledWalkRetentionDays" INTEGER DEFAULT 30;
ALTER TABLE "SiteSetting" ADD COLUMN "accidentReportRetentionDays" INTEGER;

ALTER TABLE "Walk" ADD COLUMN "retentionLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AccidentReport" ADD COLUMN "retentionLocked" BOOLEAN NOT NULL DEFAULT false;
