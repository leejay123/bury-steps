ALTER TYPE "SiteNoticeAudience" ADD VALUE 'VISITORS';

-- Demo: a short visitors-only bell notice (skip if already present)
INSERT INTO "SiteNotice" (
  "id",
  "title",
  "body",
  "kind",
  "audience",
  "slug",
  "pageBody",
  "categoryId",
  "createdAt",
  "updatedAt"
)
SELECT
  'notice_seed_visitor_hello',
  'Visiting for the first time?',
  'Tap Browse all notices for open invitations and how Sunday walks work. Create an account when you are ready to clock in.',
  'BELL',
  'VISITORS',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM "SiteNotice" n WHERE n.id = 'notice_seed_visitor_hello'
);

-- Existing public page demos stay PUBLIC (everyone). Refresh audience if needed.
UPDATE "SiteNotice"
SET "audience" = 'PUBLIC'
WHERE "id" IN ('notice_seed_public_join', 'notice_seed_public_open')
  AND "audience" IS DISTINCT FROM 'PUBLIC';
