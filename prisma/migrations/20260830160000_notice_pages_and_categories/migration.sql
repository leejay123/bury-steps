-- CreateEnum
CREATE TYPE "SiteNoticeKind" AS ENUM ('BELL', 'PAGE');

-- CreateEnum
CREATE TYPE "SiteNoticeAudience" AS ENUM ('MEMBERS', 'PUBLIC');

-- CreateTable
CREATE TABLE "SiteNoticeCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNoticeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteNoticeCategory_slug_key" ON "SiteNoticeCategory"("slug");

-- CreateIndex
CREATE INDEX "SiteNoticeCategory_sortOrder_idx" ON "SiteNoticeCategory"("sortOrder");

-- AlterTable
ALTER TABLE "SiteNotice" ADD COLUMN "kind" "SiteNoticeKind" NOT NULL DEFAULT 'BELL';
ALTER TABLE "SiteNotice" ADD COLUMN "audience" "SiteNoticeAudience" NOT NULL DEFAULT 'MEMBERS';
ALTER TABLE "SiteNotice" ADD COLUMN "slug" TEXT;
ALTER TABLE "SiteNotice" ADD COLUMN "pageBody" TEXT;
ALTER TABLE "SiteNotice" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SiteNotice_slug_key" ON "SiteNotice"("slug");

-- CreateIndex
CREATE INDEX "SiteNotice_kind_idx" ON "SiteNotice"("kind");

-- CreateIndex
CREATE INDEX "SiteNotice_audience_idx" ON "SiteNotice"("audience");

-- CreateIndex
CREATE INDEX "SiteNotice_categoryId_idx" ON "SiteNotice"("categoryId");

-- AddForeignKey
ALTER TABLE "SiteNotice" ADD CONSTRAINT "SiteNotice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SiteNoticeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed a default category so organisers can publish a page notice immediately.
INSERT INTO "SiteNoticeCategory" ("id", "slug", "label", "sortOrder", "createdAt", "updatedAt")
VALUES ('noticecat_general', 'general', 'General', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
