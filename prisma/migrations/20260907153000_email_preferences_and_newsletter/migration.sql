-- Email notification preferences on User. Purely additive: existing rows
-- get the same defaults new signups will (opted in to walk announcements,
-- notices, and progress; opted out of the newsletter until they say
-- otherwise). unsubscribeToken is left NULL for existing rows on purpose —
-- it's generated lazily the first time it's actually needed (see
-- getOrCreateUnsubscribeToken in src/lib/email), so this migration never
-- has to invent a value for rows it doesn't know about.
ALTER TABLE "User" ADD COLUMN "emailWalkAnnouncements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailNotices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailProgress" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailNewsletter" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "unsubscribeToken" TEXT;

CREATE UNIQUE INDEX "User_unsubscribeToken_key" ON "User"("unsubscribeToken");

-- Footer newsletter signups from visitors who aren't (or aren't yet) members.
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");
