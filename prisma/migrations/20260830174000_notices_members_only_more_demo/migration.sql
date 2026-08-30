-- Notices are members-only. Force existing rows onto MEMBERS and seed more
-- categories + full-page notices for organisers to browse.

UPDATE "SiteNotice" SET "audience" = 'MEMBERS' WHERE "audience" IS DISTINCT FROM 'MEMBERS';

INSERT INTO "SiteNoticeCategory" ("id", "slug", "label", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('noticecat_safety', 'safety', 'Safety', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('noticecat_events', 'events', 'Events', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Re-home earlier “public” demos as members-only full pages (ids may already exist).
UPDATE "SiteNotice"
SET
  "kind" = 'PAGE',
  "audience" = 'MEMBERS',
  "categoryId" = COALESCE("categoryId", 'noticecat_group'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('notice_seed_public_join', 'notice_seed_public_open', 'notice_seed_members_kit');

-- Extra full-page notices
INSERT INTO "SiteNotice" (
  "id", "title", "body", "kind", "audience", "slug", "pageBody", "categoryId", "createdAt", "updatedAt"
)
SELECT v.id, v.title, v.body, 'PAGE'::"SiteNoticeKind", 'MEMBERS'::"SiteNoticeAudience", v.slug, v."pageBody", v."categoryId", NOW() - v.age, NOW() - v.age
FROM (
  VALUES
    (
      'notice_seed_parking',
      'Parking at Burrs',
      'The visitor centre car park fills early on sunny Sundays. Overflow options and a tip for late arrivals.',
      'parking-at-burrs',
      E'If you are driving to Burrs Country Park:\n\n• Aim to arrive 10–15 minutes before the published start.\n• Use the visitor centre car park first. When it is full, use the overflow spaces signed from the main drive.\n• Do not park on the grass verges — the ground softens after rain.\n• If you are late, message the walk leader rather than rushing across the park alone.\n\nSee you at the meeting point.',
      'noticecat_walks',
      INTERVAL '2 days'
    ),
    (
      'notice_seed_dogs',
      'Dogs on walks',
      'Friendly reminder about dogs on group walks — when they are welcome, and what we ask of owners.',
      'dogs-on-walks',
      E'Dogs are welcome on most walks when:\n\n• They are friendly with people and other dogs.\n• They stay on a short lead near livestock, roads, and busy paths.\n• Owners clear up after them.\n\nIf a walk is not suitable for dogs (for example a busy festival weekend), we will say so on the walk page.\n\nThank you for helping everyone enjoy the day.',
      'noticecat_walks',
      INTERVAL '4 days'
    ),
    (
      'notice_seed_first_aid',
      'First aid and emergencies',
      'Who carries the first-aid kit, what to do if someone needs help, and how we record incidents.',
      'first-aid-and-emergencies',
      E'On every walk an organiser carries a basic first-aid kit.\n\nIf someone is hurt or unwell:\n1. Stop the group in a safe place.\n2. Tell the walk leader straight away.\n3. Call 999 if it is an emergency.\n\nAfterwards the organiser will write an accident report in Organiser tools so we have a clear record.\n\nLooking after each other is part of how Bury Steps works.',
      'noticecat_safety',
      INTERVAL '6 days'
    ),
    (
      'notice_seed_summer_picnic',
      'Summer picnic after the walk',
      'Optional social after the last Sunday in August — bring your own lunch if you would like to stay.',
      'summer-picnic-after-the-walk',
      E'After the last Sunday walk in August we will linger for a simple picnic at the meeting point.\n\n• Bring your own food and a drink.\n• Stay as long as you like — there is no set programme.\n• Weather dependent; if it pours we will skip the picnic and head home after the walk.\n\nNo need to RSVP. Just bring something to sit on if the grass is damp.',
      'noticecat_events',
      INTERVAL '10 hours'
    ),
    (
      'notice_seed_photos',
      'Photos on the walk',
      'We sometimes take photos for the group page. How to opt out, and what we share.',
      'photos-on-the-walk',
      E'Organisers may take a few photos during walks for the Facebook group or the website.\n\n• Tell the walk leader if you prefer not to appear in photos.\n• We do not tag people without asking.\n• Children only appear in photos when a parent or guardian agrees on the day.\n\nIf you spot a photo of yourself you would like removed, message an organiser and we will take it down.',
      'noticecat_group',
      INTERVAL '9 days'
    )
) AS v(id, title, body, slug, "pageBody", "categoryId", age)
WHERE NOT EXISTS (
  SELECT 1 FROM "SiteNotice" n WHERE n.id = v.id
);

-- Drop the visitors-only demo bell if it was seeded earlier.
DELETE FROM "SiteNotice" WHERE "id" = 'notice_seed_visitor_hello';
