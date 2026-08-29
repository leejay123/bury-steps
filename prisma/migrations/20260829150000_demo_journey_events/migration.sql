-- Sample Journey events on a few past walks so organisers can see the
-- timeline. Titles start with [Demo]. Removed when those walks are deleted
-- (Reset the site, or delete the walk).

INSERT INTO "WalkJourneyEvent" (
  "id",
  "walkId",
  "title",
  "body",
  "happenedAt",
  "createdAt",
  "createdById"
)
SELECT
  v.id,
  w.id,
  v.title,
  v.body,
  w."startsAt" + v.offset_mins * INTERVAL '1 minute',
  NOW(),
  u.id
FROM (
  VALUES
    (
      'cmtjrnynuttall01a4b5c6d7e8',
      'walk_seed_nuttall',
      '[Demo] Met at the park gates',
      'Everyone found the meeting point. A quick stretch and we set off.',
      0
    ),
    (
      'cmtjrnynuttall02a4b5c6d7e8',
      'walk_seed_nuttall',
      '[Demo] Pause by the Irwell',
      'Watched the river for a few minutes. Easy underfoot so far.',
      35
    ),
    (
      'cmtjrnynuttall03a4b5c6d7e8',
      'walk_seed_nuttall',
      '[Demo] Back at the car park',
      'Gentle loop done. Tea for anyone who wanted it afterwards.',
      85
    ),
    (
      'cmtjrnyelton001a4b5c6d7e8',
      'walk_seed_elton',
      '[Demo] Reservoir path',
      'Steady pace around the water. Good chat at the back of the group.',
      20
    ),
    (
      'cmtjrnyelton002a4b5c6d7e8',
      'walk_seed_elton',
      '[Demo] Sit-down at the bench',
      'Short rest for anyone who needed it, then on again.',
      55
    ),
    (
      'cmtjrnyburrs001a4b5c6d7e8',
      'walk_seed_burrs',
      '[Demo] Visitor centre',
      'Met by the centre. Bottles filled before we headed into the park.',
      0
    ),
    (
      'cmtjrnyburrs002a4b5c6d7e8',
      'walk_seed_burrs',
      '[Demo] Along the Irwell',
      'Shaded stretch — a favourite bit of this route.',
      40
    ),
    (
      'cmtjrnyburrs003a4b5c6d7e8',
      'walk_seed_burrs',
      '[Demo] Loop complete',
      'Back where we started. Same time next week if the weather holds.',
      90
    ),
    (
      'cmtjrnypage0101a4b5c6d7e',
      'cmtpagewk01a4b5c6d7e8f901',
      '[Demo] Setting off',
      'Sample journey event for a long-list demo walk.',
      5
    ),
    (
      'cmtjrnypage0102a4b5c6d7e',
      'cmtpagewk01a4b5c6d7e8f901',
      '[Demo] Halfway point',
      'Another sample beat so the timeline has more than one stop.',
      45
    ),
    (
      'cmtjrnypage0201a4b5c6d7e',
      'cmtpagewk02a4b5c6d7e8f901',
      '[Demo] Cafe stop',
      'Sample event — safe to remove with the walk.',
      50
    )
) AS v(id, walk_id, title, body, offset_mins)
JOIN "Walk" w ON w.id = v.walk_id
JOIN LATERAL (
  SELECT id
  FROM "User"
  WHERE role = 'ADMIN'
  ORDER BY "createdAt" ASC
  LIMIT 1
) u ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "WalkJourneyEvent" e
  WHERE e.id = v.id
);
