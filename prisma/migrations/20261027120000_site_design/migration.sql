-- Settings → Branding → Site design: "original" or "vercel" (the Vercel-inspired look).
ALTER TABLE "SiteSetting" ADD COLUMN "siteDesign" TEXT NOT NULL DEFAULT 'original';
