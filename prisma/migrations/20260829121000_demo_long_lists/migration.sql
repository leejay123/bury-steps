-- Extra walks and accident reports so organisers can check Previous/Next
-- on long lists. Titles and write-ups start with [Demo]. Remove them with
-- Settings → Reset the site, or by deleting those rows.

INSERT INTO "Walk" (
  "id",
  "token",
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
  'cmtpagewk' || lpad(n::text, 2, '0') || 'a4b5c6d7e8f901',
  'pagedemo' || lpad(n::text, 2, '0') || 'xx',
  '[Demo] Sunday walk ' || n,
  'Sample row so we can check long lists. Safe to remove from Settings.',
  (ARRAY[
    'Burrs Country Park, Bury',
    'Elton Reservoir, Bury',
    'Nuttall Park, Ramsbottom',
    'Philips Park, Whitefield',
    'Heaton Park, Prestwich'
  ])[1 + ((n - 1) % 5)],
  CASE
    WHEN n <= 25 THEN TIMESTAMPTZ '2026-08-23 12:00:00+00' - ((n - 1) * INTERVAL '7 days')
    ELSE TIMESTAMPTZ '2026-09-06 12:00:00+00' + ((n - 26) * INTERVAL '7 days')
  END,
  90,
  CASE
    WHEN n IN (7, 14, 21) THEN TIMESTAMPTZ '2026-08-01 10:00:00+00'
    ELSE NULL
  END,
  CASE
    WHEN n IN (7, 14, 21) THEN 'Sample cancelled walk, for checking the list.'
    ELSE NULL
  END,
  u.id,
  NOW()
FROM generate_series(1, 28) AS n
JOIN LATERAL (
  SELECT id
  FROM "User"
  ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
) u ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "Walk" w
  WHERE w.id = 'cmtpagewk' || lpad(n::text, 2, '0') || 'a4b5c6d7e8f901'
     OR w.token = 'pagedemo' || lpad(n::text, 2, '0') || 'xx'
);

INSERT INTO "AccidentReport" (
  "id",
  "happenedAt",
  "walkId",
  "whatHappened",
  "whoInvolved",
  "whatWeDid",
  "organiserNotes",
  "createdById",
  "createdAt",
  "updatedAt"
)
SELECT
  'cmtpagerp' || lpad(n::text, 2, '0') || 'a4b5c6d7e8f901',
  TIMESTAMPTZ '2026-08-23 12:40:00+00' - ((n - 1) * INTERVAL '7 days'),
  w.id,
  '[Demo] Report ' || n || ': a walker slipped on a wet path and needed a sit-down.',
  'A member, and two people who stopped to help.',
  'We sat them down, waited until they felt steady, and walked back at an easy pace.',
  'Sample report so we can check long lists. Safe to remove from Settings.',
  u.id,
  NOW(),
  NOW()
FROM generate_series(1, 25) AS n
JOIN LATERAL (
  SELECT id
  FROM "User"
  WHERE role = 'ADMIN'
  ORDER BY "createdAt" ASC
  LIMIT 1
) u ON true
LEFT JOIN "Walk" w
  ON w.id = 'cmtpagewk' || lpad(n::text, 2, '0') || 'a4b5c6d7e8f901'
WHERE NOT EXISTS (
  SELECT 1
  FROM "AccidentReport" r
  WHERE r.id = 'cmtpagerp' || lpad(n::text, 2, '0') || 'a4b5c6d7e8f901'
);
