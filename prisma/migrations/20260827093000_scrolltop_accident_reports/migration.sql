-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN "scrollToTopEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AccidentReport" (
    "id" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "walkId" TEXT,
    "whatHappened" TEXT NOT NULL,
    "whoInvolved" TEXT NOT NULL,
    "whatWeDid" TEXT NOT NULL,
    "organiserNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccidentReport_happenedAt_idx" ON "AccidentReport"("happenedAt");

-- CreateIndex
CREATE INDEX "AccidentReport_walkId_idx" ON "AccidentReport"("walkId");

-- AddForeignKey
ALTER TABLE "AccidentReport" ADD CONSTRAINT "AccidentReport_walkId_fkey" FOREIGN KEY ("walkId") REFERENCES "Walk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentReport" ADD CONSTRAINT "AccidentReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
