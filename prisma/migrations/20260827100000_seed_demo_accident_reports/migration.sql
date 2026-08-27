-- Sample accident reports so organisers can see the table and print flow.
-- Attached to the first organiser. Linked to seed walks when those rows exist.
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
  v.id,
  v.happened_at,
  w.id,
  v.what_happened,
  v.who_involved,
  v.what_we_did,
  v.organiser_notes,
  u.id,
  NOW(),
  NOW()
FROM (
  VALUES
    (
      'report_demo_1',
      TIMESTAMPTZ '2026-08-16 12:40:00+00',
      'walk_seed_nuttall',
      'A member slipped on a wet path near the river and landed on their right wrist.',
      'Jane M. (member) and two other walkers who stopped to help.',
      'We sat her down, checked the wrist, and walked back to the cars at an easy pace. She said she would get it looked at if it swelled.',
      'Followed up by text the next day. Wrist was bruised, not broken.'
    ),
    (
      'report_demo_2',
      TIMESTAMPTZ '2026-08-23 13:10:00+00',
      'walk_seed_elton',
      'A walker felt faint in the heat on the far side of the reservoir and had to sit down.',
      'David P. (member). Two organisers stayed with him.',
      'We stopped the group, gave him water and shade, and waited until he felt steady. He walked back with us at a slower pace.',
      'Remind everyone to bring water in warm weather.'
    ),
    (
      'report_demo_3',
      TIMESTAMPTZ '2026-08-26 09:15:00+00',
      NULL,
      'Someone reported a trip on the car park kerb before we set off. No walk had started yet.',
      'A visitor who had come to try the group, plus the organiser on the welcome table.',
      'We helped them to a bench, offered a plaster for a graze on the shin, and they chose to go home rather than walk.',
      'Not tied to a walk in the diary. Keep an eye on the kerb edge next Sunday.'
    )
) AS v(
  id,
  happened_at,
  walk_id,
  what_happened,
  who_involved,
  what_we_did,
  organiser_notes
)
JOIN LATERAL (
  SELECT id
  FROM "User"
  WHERE role = 'ADMIN'
  ORDER BY "createdAt" ASC
  LIMIT 1
) u ON true
LEFT JOIN "Walk" w ON w.id = v.walk_id
WHERE NOT EXISTS (
  SELECT 1 FROM "AccidentReport" r WHERE r.id = v.id
);
