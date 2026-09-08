-- Lets an organiser tag actual members as involved in an accident report,
-- alongside the existing free-text whoInvolved field.
CREATE TABLE "AccidentReportMember" (
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AccidentReportMember_pkey" PRIMARY KEY ("reportId", "userId")
);

CREATE INDEX "AccidentReportMember_userId_idx" ON "AccidentReportMember"("userId");

ALTER TABLE "AccidentReportMember" ADD CONSTRAINT "AccidentReportMember_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AccidentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccidentReportMember" ADD CONSTRAINT "AccidentReportMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
