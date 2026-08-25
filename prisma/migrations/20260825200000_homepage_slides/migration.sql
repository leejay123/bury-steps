-- CreateTable
CREATE TABLE "HomepageSlide" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "alt" TEXT NOT NULL DEFAULT 'Bury Steps Walking Group',
    "imagePath" TEXT,
    "imageMime" TEXT,
    "imageData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageSlide_sortOrder_idx" ON "HomepageSlide"("sortOrder");

-- Seed the branded hero as slide 1.
INSERT INTO "HomepageSlide" ("id", "sortOrder", "alt", "imagePath", "createdAt", "updatedAt")
VALUES (
    'cmhomepagehero01',
    0,
    'Bury Steps Walking Group',
    '/slides/bury-steps-hero.jpg',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
