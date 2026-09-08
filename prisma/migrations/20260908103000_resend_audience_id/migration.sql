-- The Resend audience (Segment) newsletter subscribers are synced into.
-- Created automatically on first use — see src/lib/email/resend-audience.ts.
ALTER TABLE "SiteSetting" ADD COLUMN "resendAudienceId" TEXT;
