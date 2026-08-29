-- CreateTable
CREATE TABLE "WalkJourneyEvent" (
    "id" TEXT NOT NULL,
    "walkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WalkJourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalkJourneyEvent_walkId_happenedAt_idx" ON "WalkJourneyEvent"("walkId", "happenedAt");

-- AddForeignKey
ALTER TABLE "WalkJourneyEvent" ADD CONSTRAINT "WalkJourneyEvent_walkId_fkey" FOREIGN KEY ("walkId") REFERENCES "Walk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkJourneyEvent" ADD CONSTRAINT "WalkJourneyEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
