-- Walk pages (members' and organisers'): "classic" is the original single
-- column; "columns" is two columns on a computer, with a right-hand column
-- that stays in view and the walk's sections in tabs.
ALTER TABLE "SiteSetting" ADD COLUMN "walkPageLayout" TEXT NOT NULL DEFAULT 'classic';
