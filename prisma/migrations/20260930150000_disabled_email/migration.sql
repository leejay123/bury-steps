CREATE TABLE "DisabledEmail" (
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisabledEmail_pkey" PRIMARY KEY ("key")
);
