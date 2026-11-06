-- AlterTable
ALTER TABLE "AccidentReport" ADD COLUMN "reportNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccidentReport_reportNumber_key" ON "AccidentReport"("reportNumber");
