-- CreateTable
CREATE TABLE "SiteNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteNoticeRead" (
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteNoticeRead_pkey" PRIMARY KEY ("noticeId","userId")
);

-- CreateIndex
CREATE INDEX "SiteNotice_createdAt_idx" ON "SiteNotice"("createdAt");

-- CreateIndex
CREATE INDEX "SiteNoticeRead_userId_idx" ON "SiteNoticeRead"("userId");

-- AddForeignKey
ALTER TABLE "SiteNoticeRead" ADD CONSTRAINT "SiteNoticeRead_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "SiteNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteNoticeRead" ADD CONSTRAINT "SiteNoticeRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
