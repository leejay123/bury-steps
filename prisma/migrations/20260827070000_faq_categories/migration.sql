-- CreateTable
CREATE TABLE "HomepageFaqCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomepageFaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageFaqCategory_slug_key" ON "HomepageFaqCategory"("slug");

-- CreateIndex
CREATE INDEX "HomepageFaqCategory_sortOrder_idx" ON "HomepageFaqCategory"("sortOrder");

INSERT INTO "HomepageFaqCategory" ("id", "slug", "label", "sortOrder", "createdAt", "updatedAt") VALUES
('faqcat_joining', 'joining', 'Joining', 0, NOW(), NOW()),
('faqcat_walks', 'walks', 'Walks', 1, NOW(), NOW()),
('faqcat_on_the_day', 'on-the-day', 'On the day', 2, NOW(), NOW()),
('faqcat_account', 'account', 'Your account', 3, NOW(), NOW());

-- AlterTable
ALTER TABLE "HomepageFaq" ADD COLUMN "categoryId" TEXT;

UPDATE "HomepageFaq" SET "categoryId" = CASE "category"
  WHEN 'joining' THEN 'faqcat_joining'
  WHEN 'walks' THEN 'faqcat_walks'
  WHEN 'on-the-day' THEN 'faqcat_on_the_day'
  WHEN 'account' THEN 'faqcat_account'
  ELSE 'faqcat_joining'
END;

ALTER TABLE "HomepageFaq" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "HomepageFaq" DROP COLUMN "category";

ALTER TABLE "HomepageFaq" ADD CONSTRAINT "HomepageFaq_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HomepageFaqCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "HomepageFaq_categoryId_idx" ON "HomepageFaq"("categoryId");
