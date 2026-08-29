-- AlterTable
ALTER TABLE "Walk" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Walk_slug_key" ON "Walk"("slug");
