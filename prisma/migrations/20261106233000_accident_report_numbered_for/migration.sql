-- The report number belongs to one involved member, not whoever recorded it.
ALTER TABLE "AccidentReport" ADD COLUMN "numberedForUserId" TEXT;

CREATE INDEX "AccidentReport_numberedForUserId_idx" ON "AccidentReport"("numberedForUserId");

ALTER TABLE "AccidentReport" ADD CONSTRAINT "AccidentReport_numberedForUserId_fkey" FOREIGN KEY ("numberedForUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
