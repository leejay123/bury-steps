-- Settings → Site behaviour → Show stories (off hides the stories row and stops new ones).
ALTER TABLE "SiteSetting" ADD COLUMN "storiesEnabled" BOOLEAN NOT NULL DEFAULT true;
