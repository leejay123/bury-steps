-- Optional "accept before it takes effect" flow for promoting a member to
-- organiser.
ALTER TABLE "User" ADD COLUMN "organiserInviteToken" TEXT;
ALTER TABLE "User" ADD COLUMN "organiserInviteSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "organiserInviteExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_organiserInviteToken_key" ON "User"("organiserInviteToken");

ALTER TABLE "SiteSetting" ADD COLUMN "organiserInviteRequired" BOOLEAN NOT NULL DEFAULT false;
