-- CreateTable
CREATE TABLE "HomepageTestimonial" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "imagePath" TEXT,
    "imageMime" TEXT,
    "imageData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageTestimonial_sortOrder_idx" ON "HomepageTestimonial"("sortOrder");
