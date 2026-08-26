-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSetting" ("id", "primaryColor", "updatedAt")
VALUES ('site', '#1f3d2b', CURRENT_TIMESTAMP);
