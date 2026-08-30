-- Pinned welcome notice for signed-in members (edit title/body only; not deletable).

ALTER TABLE "SiteNotice" ADD COLUMN IF NOT EXISTS "systemKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "SiteNotice_systemKey_key" ON "SiteNotice"("systemKey");

INSERT INTO "SiteNotice" (
  "id",
  "title",
  "body",
  "kind",
  "audience",
  "slug",
  "pageBody",
  "categoryId",
  "systemKey",
  "createdAt",
  "updatedAt"
)
SELECT
  'notice_system_welcome',
  'Welcome, {{firstName}}',
  E'Welcome to Bury Steps Walking Group.\n\n• Walks — see upcoming Sundays and clock in on the day.\n• Progress — how the group is doing this month together.\n• History — every walk you have clocked in to.\n• The bell — short updates from the organisers (this message stays at the top).\n\nQuestions? Ask in the Facebook group or talk to an organiser on a walk.',
  'BELL'::"SiteNoticeKind",
  'MEMBERS'::"SiteNoticeAudience",
  NULL,
  NULL,
  NULL,
  'welcome',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "SiteNotice" n WHERE n."systemKey" = 'welcome' OR n.id = 'notice_system_welcome'
);
