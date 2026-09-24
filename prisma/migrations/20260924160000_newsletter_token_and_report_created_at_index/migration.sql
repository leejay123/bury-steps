-- Newsletter unsubscribe tokens must be app-minted (nanoid), not cuid().
-- Existing rows keep their current tokens until they re-subscribe.
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubscribeToken" DROP DEFAULT;

-- Purge cron filters accident reports by createdAt.
CREATE INDEX IF NOT EXISTS "AccidentReport_createdAt_idx" ON "AccidentReport"("createdAt");
