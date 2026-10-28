-- Settings → Branding → Dashboard design (Efferd dashboards 1–4).
ALTER TABLE "SiteSetting" ADD COLUMN "dashboardDesign" TEXT NOT NULL DEFAULT '1';
