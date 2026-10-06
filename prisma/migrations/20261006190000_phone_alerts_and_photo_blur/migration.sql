-- Phone-alert subscriptions, one "starting soon" send per walk, and a
-- tiny blurred preview stored beside each uploaded photo.

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Walk" ADD COLUMN "startingSoonPushSentAt" TIMESTAMP(3);

ALTER TABLE "HomepageSlide" ADD COLUMN "imageBlur" TEXT;
ALTER TABLE "HomepageTestimonial" ADD COLUMN "imageBlur" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "logoBlur" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "reportBannerBlur" TEXT;
