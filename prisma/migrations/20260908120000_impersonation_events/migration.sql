-- Audit trail for "log in as this member" (Clerk actor tokens). See
-- src/server/actions/impersonation.ts.
CREATE TABLE "ImpersonationEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,
    "adminName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "targetId" TEXT,
    "targetName" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,

    CONSTRAINT "ImpersonationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImpersonationEvent_createdAt_idx" ON "ImpersonationEvent"("createdAt");

ALTER TABLE "ImpersonationEvent" ADD CONSTRAINT "ImpersonationEvent_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImpersonationEvent" ADD CONSTRAINT "ImpersonationEvent_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
