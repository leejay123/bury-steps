-- Settings → Homepage layout → Framed sections (shadcn.io style).
ALTER TABLE "SiteSetting" ADD COLUMN "homeFramed" BOOLEAN NOT NULL DEFAULT false;
