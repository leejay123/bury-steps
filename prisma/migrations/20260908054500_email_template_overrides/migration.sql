-- Admin-edited subject/body text per system email. A missing row (or a
-- null field on one) falls back to the built-in default in
-- src/lib/email/registry.ts, so this is purely additive.
CREATE TABLE "EmailTemplateOverride" (
    "key" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplateOverride_pkey" PRIMARY KEY ("key")
);
