-- Refresh demo walks so each lifecycle status is visible relative to deploy time,
-- and add a few bell notices for signed-in members to try.

-- Completed (History)
UPDATE "Walk"
SET
  "title" = 'Nuttall Park and the Irwell',
  "description" = 'A gentle loop through Nuttall Park and along the river. Easy underfoot and a good first Sunday with the group.',
  "location" = 'Nuttall Park, Ramsbottom',
  "startsAt" = NOW() - INTERVAL '7 days',
  "durationMins" = 90,
  "cancelledAt" = NULL,
  "cancelledReason" = NULL
WHERE "id" = 'walk_seed_nuttall';

UPDATE "Walk"
SET
  "title" = 'Elton Reservoir circuit',
  "description" = 'Around the reservoir on the paths. Steady pace, time to chat, and a sit-down if anyone needs it.',
  "location" = 'Elton Reservoir, Bury',
  "startsAt" = NOW() - INTERVAL '3 days',
  "durationMins" = 90,
  "cancelledAt" = NULL,
  "cancelledReason" = NULL
WHERE "id" = 'walk_seed_elton';

-- In progress (clock-in open, started ~25 minutes ago, 90 minute walk)
UPDATE "Walk"
SET
  "title" = 'Burrs Country Park loop',
  "description" = 'Meet by the visitor centre. Through the park and back along the Irwell. Bring a bottle of water.',
  "location" = 'Burrs Country Park, Bury',
  "startsAt" = NOW() - INTERVAL '25 minutes',
  "durationMins" = 90,
  "cancelledAt" = NULL,
  "cancelledReason" = NULL
WHERE "id" = 'walk_seed_burrs';

-- Starting soon (within the hour before start)
UPDATE "Walk"
SET
  "title" = 'Philips Park woodland',
  "description" = 'Shaded paths through Philips Park. A little longer than usual, with a pause at the café if it is open.',
  "location" = 'Philips Park, Whitefield',
  "startsAt" = NOW() + INTERVAL '25 minutes',
  "durationMins" = 90,
  "cancelledAt" = NULL,
  "cancelledReason" = NULL
WHERE "id" = 'walk_seed_philips';

-- Cancelled (future date, already called off — shows under Upcoming as Cancelled)
UPDATE "Walk"
SET
  "title" = 'Heaton Park Sunday',
  "description" = 'Called off because of standing water on the paths. We will put another date in when it dries out.',
  "location" = 'Heaton Park, Prestwich',
  "startsAt" = NOW() + INTERVAL '14 days',
  "durationMins" = 90,
  "cancelledAt" = NOW() - INTERVAL '1 day',
  "cancelledReason" = 'Heavy rain and wet paths. Stay home this week — we will go again soon.'
WHERE "id" = 'walk_seed_heaton';

-- Extra upcoming walk (well before clock-in opens)
INSERT INTO "Walk" (
  "id",
  "token",
  "slug",
  "title",
  "description",
  "location",
  "startsAt",
  "durationMins",
  "cancelledAt",
  "cancelledReason",
  "createdById",
  "createdAt"
)
SELECT
  'walk_seed_tottington',
  'seedtottingtn',
  'tottington',
  'Tottington Lines Sunday',
  'A flat, gentle walk along the old railway path. Ideal if you are new to the group.',
  'Tottington Lines, Bury',
  NOW() + INTERVAL '7 days',
  90,
  NULL,
  NULL,
  u.id,
  NOW()
FROM (
  SELECT id
  FROM "User"
  ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
) u
WHERE NOT EXISTS (
  SELECT 1 FROM "Walk" w WHERE w.id = 'walk_seed_tottington' OR w.token = 'seedtottingtn'
);

-- If Tottington already existed from an earlier try, still pin it as upcoming
UPDATE "Walk"
SET
  "startsAt" = NOW() + INTERVAL '7 days',
  "durationMins" = 90,
  "cancelledAt" = NULL,
  "cancelledReason" = NULL
WHERE "id" = 'walk_seed_tottington';

-- Demo notices for the bell (skip any id already present)
INSERT INTO "SiteNotice" ("id", "title", "body", "createdAt", "updatedAt")
SELECT v.id, v.title, v.body, NOW() - v.age, NOW() - v.age
FROM (
  VALUES
    (
      'notice_seed_welcome',
      'Welcome to the group',
      'Thanks for joining Bury Steps. Open Walks for the next Sunday, and use the share link on the day to clock in. Questions are welcome in the Facebook group too.',
      INTERVAL '2 days'
    ),
    (
      'notice_seed_weather',
      'Sunday weather check',
      'The forecast looks changeable this weekend. Bring a waterproof and sturdy shoes. If we have to cancel, we will update this notice and the walk page.',
      INTERVAL '12 hours'
    ),
    (
      'notice_seed_meetup',
      'Sign-in on the day',
      'Please clock in when you arrive so we know who is on the walk. It only takes a moment and helps keep everyone safe.',
      INTERVAL '3 hours'
    )
) AS v(id, title, body, age)
WHERE NOT EXISTS (
  SELECT 1 FROM "SiteNotice" n WHERE n.id = v.id
);
