-- Stores every Resend webhook event (sent/delivered/bounced/complained/...)
-- so bounces and spam complaints are visible after the fact instead of
-- failing silently. See src/app/api/webhooks/resend/route.ts.
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "resendId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailEvent_resendId_idx" ON "EmailEvent"("resendId");

CREATE INDEX "EmailEvent_recipient_idx" ON "EmailEvent"("recipient");

CREATE INDEX "EmailEvent_createdAt_idx" ON "EmailEvent"("createdAt");
