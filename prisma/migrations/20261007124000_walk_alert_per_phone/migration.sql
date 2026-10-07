-- Remember which phone has already received a walk's starting-soon alert,
-- so a failed phone is tried again and a second look does not ping the rest.

CREATE TABLE "WalkAlertDelivery" (
    "id" TEXT NOT NULL,
    "walkId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalkAlertDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WalkAlertDelivery_walkId_subscriptionId_key" ON "WalkAlertDelivery"("walkId", "subscriptionId");
CREATE INDEX "WalkAlertDelivery_walkId_idx" ON "WalkAlertDelivery"("walkId");

ALTER TABLE "WalkAlertDelivery" ADD CONSTRAINT "WalkAlertDelivery_walkId_fkey" FOREIGN KEY ("walkId") REFERENCES "Walk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalkAlertDelivery" ADD CONSTRAINT "WalkAlertDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
